import TurndownService from 'turndown';
import { MarkdownFile } from '../App';

export async function convertFilesToMarkdown(
  files: File[], 
  onProgress?: (current: number) => void
): Promise<MarkdownFile[]> {
  const markdownFiles: MarkdownFile[] = [];
  const turndownService = createTurndownService();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i);

    try {
      const fileName = file.name.replace(/\.[^/.]+$/, '') + '.md';
      let markdownContent: string;
      
      // Handle DOCX files specially - they return markdown directly
      if (file.name.toLowerCase().endsWith('.docx') || file.type.includes('wordprocessingml')) {
        markdownContent = await readFileContent(file); // Already returns markdown
      } else {
        const content = await readFileContent(file);
        markdownContent = await convertContentToMarkdown(content, file, turndownService);
      }
      
      markdownFiles.push({
        name: fileName,
        content: markdownContent,
        originalFile: file.name
      });
    } catch (error) {
      console.error(`Error converting ${file.name}:`, error);
      
      // Add error file with information about the failure
      markdownFiles.push({
        name: `ERROR_${file.name}.md`,
        content: `# Conversion Error\n\n**File:** ${file.name}\n**Error:** ${error instanceof Error ? error.message : 'Unknown error'}\n\n*This file could not be converted to markdown.*`,
        originalFile: file.name
      });
    }
  }

  onProgress?.(files.length);
  return markdownFiles;
}

function createTurndownService(): TurndownService {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full',
    preformattedCode: true
  });

  // Enhanced rules for better conversion
  turndownService.addRule('preserveSpaces', {
    filter: ['p', 'div', 'span'],
    replacement: function (content: string, node: any) {
      // Preserve code blocks and pre-formatted text
      if (node.closest && (node.closest('pre') || node.closest('code'))) {
        return content;
      }
      // More conservative space cleanup - preserve single spaces, normalize multiple
      return content.replace(/[ \t]+/g, ' ').replace(/\n\s+/g, '\n');
    }
  });

  turndownService.addRule('preserveLineBreaks', {
    filter: 'br',
    replacement: function (content: string, node: any) {
      // In lists, use single line break, elsewhere use double
      if (node.closest && node.closest('li')) {
        return '\n';
      }
      return '  \n'; // Two spaces + newline for hard line break in markdown
    }
  });

  turndownService.addRule('improvedTables', {
    filter: 'table',
    replacement: function (content: string, node: any) {
      const table = node as HTMLTableElement;
      const rows = Array.from(table.querySelectorAll('tr'));
      
      if (rows.length === 0) return '';

      let markdown = '';
      
      // Process header row
      const headerRow = rows[0];
      const headerCells = Array.from(headerRow.querySelectorAll('th, td'));
      if (headerCells.length > 0) {
        markdown += '| ' + headerCells.map(cell => cell.textContent?.trim() || '').join(' | ') + ' |\n';
        markdown += '| ' + headerCells.map(() => '---').join(' | ') + ' |\n';
      }

      // Process data rows
      const dataRows = rows.slice(headerCells.some(cell => cell.tagName === 'TH') ? 1 : 0);
      dataRows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length > 0) {
          markdown += '| ' + cells.map(cell => cell.textContent?.trim() || '').join(' | ') + ' |\n';
        }
      });

      return markdown;
    }
  });

  turndownService.addRule('improvedLists', {
    filter: ['ul', 'ol'],
    replacement: function (content: string, node: any) {
      const list = node as HTMLElement;
      const isOrdered = list.tagName === 'OL';
      const items = Array.from(list.querySelectorAll(':scope > li'));
      
      let markdown = '';
      items.forEach((item, index) => {
        const itemContent = turndownService.turndown(item.innerHTML).trim();
        const prefix = isOrdered ? `${index + 1}. ` : '- ';
        
        // Handle multi-line list items
        const lines = itemContent.split('\n');
        markdown += prefix + lines[0] + '\n';
        
        // Indent continuation lines
        if (lines.length > 1) {
          const indent = isOrdered ? '   ' : '  '; // 3 spaces for ordered, 2 for unordered
          lines.slice(1).forEach(line => {
            markdown += indent + line + '\n';
          });
        }
      });

      return markdown;
    }
  });

  turndownService.addRule('improvedCode', {
    filter: ['pre', 'code'],
    replacement: function (content: string, node: any) {
      const element = node as HTMLElement;
      
      // Check if it's inline code
      if (element.tagName === 'CODE' && !element.closest('pre')) {
        return '`' + content + '`';
      }
      
      // Block code
      const language = element.className.match(/language-(\w+)/)?.[1] || '';
      return '\n```' + language + '\n' + content + '\n```\n';
    }
  });

  turndownService.addRule('improvedBlockquotes', {
    filter: 'blockquote',
    replacement: function (content: string) {
      return content.split('\n').map(line => '> ' + line).join('\n') + '\n';
    }
  });

  return turndownService;
}

async function readFileContent(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  // Handle binary formats that need special processing
  if (fileName.endsWith('.docx') || fileType.includes('wordprocessingml')) {
    return await readDocxFile(file);
  }

  // Standard text reading for other formats
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    // Read as text for most file types
    reader.readAsText(file);
  });
}

async function readDocxFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    const documentXml = await zip.file('word/document.xml')?.async('text');
    if (!documentXml) {
      throw new Error('Could not find document content in DOCX file');
    }

    // Parse the XML and extract text with simple approach
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(documentXml, 'text/xml');
    
    let markdown = '';
    
    // Get all paragraphs
    const paragraphs = xmlDoc.querySelectorAll('w\\:p, p');
    
    paragraphs.forEach(paragraph => {
      const paragraphText = extractParagraphText(paragraph);
      if (paragraphText.trim()) {
        markdown += paragraphText + '\n\n';
      }
    });

    return markdown.trim() || 'No readable content found in DOCX file';
    
  } catch (error) {
    console.error('Error reading DOCX file:', error);
    throw new Error(`Failed to read DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function extractParagraphText(paragraph: Element): string {
  // Check if this is a heading first
  const headingLevel = getHeadingLevel(paragraph);
  
  // Extract all text from the paragraph, preserving basic formatting
  let fullText = '';
  const runs = paragraph.querySelectorAll('w\\:r, r');
  
  runs.forEach(run => {
    const textNodes = run.querySelectorAll('w\\:t, t');
    textNodes.forEach(textNode => {
      const text = textNode.textContent || '';
      if (text) {
        // Check if this run has formatting
        const formatting = getSimpleRunFormatting(run);
        
        if (formatting.bold && text.trim()) {
          fullText += '**' + text + '**';
        } else if (formatting.italic && text.trim()) {
          fullText += '*' + text + '*';
        } else {
          fullText += text;
        }
      }
    });
    
    // Add space between runs if needed
    const lastChar = fullText.slice(-1);
    if (lastChar && !lastChar.match(/\s/) && fullText.length > 0) {
      // Check if the next run starts with text
      const nextTextNode = run.nextElementSibling?.querySelector('w\\:t, t');
      if (nextTextNode && nextTextNode.textContent && !nextTextNode.textContent.startsWith(' ')) {
        fullText += ' ';
      }
    }
  });
  
  // Clean up the text
  fullText = fullText.replace(/\s+/g, ' ').trim();
  
  // Apply heading if needed
  if (headingLevel > 0 && fullText) {
    fullText = '#'.repeat(headingLevel) + ' ' + fullText;
  }
  
  return fullText;
}

function getSimpleRunFormatting(run: Element): { bold: boolean; italic: boolean } {
  const formatting = { bold: false, italic: false };
  
  const rPr = run.querySelector('w\\:rPr, rPr');
  if (rPr) {
    const bold = rPr.querySelector('w\\:b, b');
    if (bold && (!bold.hasAttribute('w:val') || bold.getAttribute('w:val') !== '0')) {
      formatting.bold = true;
    }
    
    const italic = rPr.querySelector('w\\:i, i');
    if (italic && (!italic.hasAttribute('w:val') || italic.getAttribute('w:val') !== '0')) {
      formatting.italic = true;
    }
  }
  
  return formatting;
}


function getHeadingLevel(paragraph: Element): number {
  // Check paragraph style for heading
  const pPr = paragraph.querySelector('w\\:pPr, pPr');
  if (pPr) {
    const pStyle = pPr.querySelector('w\\:pStyle, pStyle');
    if (pStyle) {
      const val = pStyle.getAttribute('w:val') || pStyle.getAttribute('val');
      if (val) {
        // Common heading style patterns
        const headingMatch = val.match(/[Hh]eading(\d+)/);
        if (headingMatch) {
          return parseInt(headingMatch[1]);
        }
        if (val.includes('Title')) return 1;
        if (val.includes('Subtitle')) return 2;
      }
    }
    
    // Check for outline level
    const outlineLvl = pPr.querySelector('w\\:outlineLvl, outlineLvl');
    if (outlineLvl) {
      const level = parseInt(outlineLvl.getAttribute('w:val') || outlineLvl.getAttribute('val') || '0');
      return Math.min(level + 1, 6); // Max 6 heading levels
    }
  }
  
  return 0;
}



async function convertContentToMarkdown(
  content: string, 
  file: File, 
  turndownService: TurndownService
): Promise<string> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  let processedContent = content;
  let sourceFormat = 'Unknown';

  // IMPORTANT: DOCX files should NOT reach this function - they're processed in readDocxFile
  // If we see a DOCX here, it means the file detection failed
  if (fileName.endsWith('.docx') || fileType.includes('wordprocessingml')) {
    throw new Error('DOCX file should be processed by readDocxFile, not convertContentToMarkdown');
  }

  // Determine file type and process accordingly
  if (fileType.includes('html') || fileName.endsWith('.html') || fileName.endsWith('.htm')) {
    sourceFormat = 'HTML';
    processedContent = turndownService.turndown(content);
  } else if (fileType.includes('json') || fileName.endsWith('.json')) {
    sourceFormat = 'JSON';
    processedContent = convertJsonToMarkdown(content);
  } else if (fileType.includes('csv') || fileName.endsWith('.csv')) {
    sourceFormat = 'CSV';
    processedContent = convertCsvToMarkdown(content);
  } else if (fileType.includes('xml') || fileName.endsWith('.xml')) {
    sourceFormat = 'XML';
    processedContent = convertXmlToMarkdown(content, turndownService);
  } else {
    // Plain text files
    sourceFormat = 'Text';
    processedContent = convertPlainTextToMarkdown(content);
  }

  // Clean up and normalize the content
  const cleanedContent = cleanupMarkdownContent(processedContent);

  return cleanedContent;
}

function cleanupMarkdownContent(content: string): string {
  let cleaned = content;
  
  // Remove excessive empty lines (more than 3 consecutive)
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
  
  // Ensure proper spacing around headers
  cleaned = cleaned.replace(/\n(#{1,6}\s)/g, '\n\n$1');
  cleaned = cleaned.replace(/(#{1,6}\s[^\n]+)\n(?!\n)/g, '$1\n\n');
  
  // Only remove trailing whitespace from lines
  cleaned = cleaned.replace(/[ \t]+$/gm, '');
  
  // Fix missing spaces after punctuation (conservative)
  cleaned = cleaned.replace(/([.!?])([A-Z])/g, '$1 $2');
  cleaned = cleaned.replace(/([,;:])([a-zA-Z])/g, '$1 $2');
  
  // Clean up the beginning and end
  cleaned = cleaned.trim();
  
  // Ensure content ends with a single newline
  if (cleaned && !cleaned.endsWith('\n')) {
    cleaned += '\n';
  }
  
  return cleaned;
}

function convertJsonToMarkdown(jsonContent: string): string {
  try {
    const data = JSON.parse(jsonContent);
    let markdown = '# JSON Data\n\n';
    
    // Add summary information
    if (Array.isArray(data)) {
      markdown += `**Type:** Array with ${data.length} items\n\n`;
      markdown += convertArrayToMarkdownTable(data);
    } else if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      markdown += `**Type:** Object with ${keys.length} properties\n\n`;
      markdown += convertObjectToMarkdown(data);
    } else {
      markdown += `**Type:** ${typeof data}\n\n`;
      markdown += '**Value:**\n```json\n' + JSON.stringify(data, null, 2) + '\n```\n';
    }
    
    return markdown;
  } catch (error) {
    return '# Invalid JSON Content\n\n**Error:** ' + (error instanceof Error ? error.message : 'Unknown parsing error') + '\n\n**Raw Content:**\n```json\n' + jsonContent + '\n```\n';
  }
}

function convertCsvToMarkdown(csvContent: string): string {
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) return '# Empty CSV\n';
  
  let markdown = '# CSV Data\n\n';
  
  // Enhanced CSV parsing that handles quoted fields
  const rows = lines.map(line => parseCSVLine(line));
  
  if (rows.length > 0) {
    // Add summary information
    markdown += `**Rows:** ${rows.length}\n`;
    markdown += `**Columns:** ${rows[0]?.length || 0}\n\n`;
    
    // Create markdown table
    const header = rows[0];
    if (header && header.length > 0) {
      // Clean and format header
      const cleanHeader = header.map(cell => cell.trim() || 'Column');
      markdown += '| ' + cleanHeader.join(' | ') + ' |\n';
      markdown += '| ' + cleanHeader.map(() => '---').join(' | ') + ' |\n';
      
      // Add data rows
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row && row.length > 0) {
          // Ensure row has same number of columns as header
          const paddedRow = [...row];
          while (paddedRow.length < cleanHeader.length) {
            paddedRow.push('');
          }
          
          // Clean cell content for markdown
          const cleanRow = paddedRow.slice(0, cleanHeader.length).map(cell => {
            return (cell || '').toString().trim().replace(/\|/g, '\\|'); // Escape pipes
          });
          
          markdown += '| ' + cleanRow.join(' | ') + ' |\n';
        }
      }
      
      // Add summary statistics if numeric data detected
      const numericColumns = detectNumericColumns(rows);
      if (numericColumns.length > 0) {
        markdown += '\n## Data Summary\n\n';
        numericColumns.forEach(colIndex => {
          const colName = cleanHeader[colIndex] || `Column ${colIndex + 1}`;
          const values = rows.slice(1)
            .map(row => parseFloat(row[colIndex]))
            .filter(val => !isNaN(val));
          
          if (values.length > 0) {
            const sum = values.reduce((a, b) => a + b, 0);
            const avg = sum / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            markdown += `**${colName}:**\n`;
            markdown += `- Count: ${values.length}\n`;
            markdown += `- Average: ${avg.toFixed(2)}\n`;
            markdown += `- Min: ${min}\n`;
            markdown += `- Max: ${max}\n\n`;
          }
        });
      }
    }
  }
  
  return markdown;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
}

function detectNumericColumns(rows: string[][]): number[] {
  if (rows.length < 2) return [];
  
  const numericColumns: number[] = [];
  const header = rows[0];
  
  for (let colIndex = 0; colIndex < header.length; colIndex++) {
    let numericCount = 0;
    let totalCount = 0;
    
    // Check data rows (skip header)
    for (let rowIndex = 1; rowIndex < Math.min(rows.length, 11); rowIndex++) { // Sample first 10 rows
      const cell = rows[rowIndex][colIndex];
      if (cell && cell.trim()) {
        totalCount++;
        const numValue = parseFloat(cell.trim());
        if (!isNaN(numValue)) {
          numericCount++;
        }
      }
    }
    
    // If 70% or more of the values are numeric, consider it a numeric column
    if (totalCount > 0 && (numericCount / totalCount) >= 0.7) {
      numericColumns.push(colIndex);
    }
  }
  
  return numericColumns;
}

function convertXmlToMarkdown(xmlContent: string, turndownService: TurndownService): string {
  try {
    // Simple XML to HTML conversion for turndown
    let htmlContent = xmlContent
      .replace(/<([^>]+)>/g, (match, tagContent) => {
        // Convert XML tags to HTML-like structure
        if (tagContent.startsWith('/')) {
          return `</${tagContent.substring(1)}>`;
        }
        return `<${tagContent}>`;
      });
    
    return '# XML Content\n\n' + turndownService.turndown(htmlContent);
  } catch (error) {
    return '# XML Content\n\n```xml\n' + xmlContent + '\n```\n';
  }
}


function convertPlainTextToMarkdown(textContent: string): string {
  let markdown = textContent;
  
  // Normalize line endings but preserve internal whitespace
  markdown = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split into lines for processing
  const lines = markdown.split('\n');
  const processedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    const line = originalLine.trim();
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
    
    if (!line) {
      // Preserve empty lines for paragraph separation
      processedLines.push('');
      continue;
    }
    
    // Detect headers (various patterns)
    if (isHeader(line, nextLine)) {
      // Determine header level based on various factors
      const level = getHeaderLevel(line, i, lines);
      processedLines.push('#'.repeat(level) + ' ' + line);
      continue;
    }
    
    // Detect lists
    if (isList(line)) {
      processedLines.push(convertToMarkdownList(line));
      continue;
    }
    
    // Detect code blocks (indented content) - preserve original indentation
    if (isCodeLine(originalLine)) {
      processedLines.push('    ' + line); // 4-space indentation for code
      continue;
    }
    
    // Detect quotes (lines starting with > or common quote patterns)
    if (isQuote(line)) {
      processedLines.push('> ' + line.replace(/^>\s*/, ''));
      continue;
    }
    
    // Regular paragraph text - preserve the original line with its spacing
    processedLines.push(line);
  }
  
  // Join lines preserving structure
  markdown = processedLines.join('\n');
  
  // Clean up excessive empty lines (more than 2) but preserve paragraph breaks
  markdown = markdown.replace(/\n{4,}/g, '\n\n\n');
  
  // Detect and format URLs (but preserve surrounding text spacing)
  markdown = markdown.replace(/(^|[\s])((https?:\/\/[^\s]+))([\s]|$)/g, '$1[$3]($3)$4');
  
  // Detect and format email addresses (but preserve surrounding text spacing)
  markdown = markdown.replace(/(^|[\s])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})([\s]|$)/g, '$1[$2](mailto:$2)$3');
  
  return markdown.trim();
}

function isHeader(line: string, nextLine: string): boolean {
  // All caps lines (likely headers)
  if (line.length > 3 && line === line.toUpperCase() && /^[A-Z\s\d\-\.:]+$/.test(line)) {
    return true;
  }
  
  // Lines followed by underlines (= or -)
  if (nextLine && (nextLine.match(/^=+$/) || nextLine.match(/^-+$/))) {
    return true;
  }
  
  // Lines starting with numbers (1., 2., etc.) and all caps
  if (/^\d+\.\s+[A-Z]/.test(line) && line === line.toUpperCase()) {
    return true;
  }
  
  // Common header patterns
  if (/^(Chapter|Section|Part|Article|Introduction|Conclusion|Summary|Overview|Background)\s+/i.test(line)) {
    return true;
  }
  
  return false;
}

function getHeaderLevel(line: string, index: number, lines: string[]): number {
  // Determine header level based on context
  
  // If it's the first significant line, probably H1
  if (index === 0 || lines.slice(0, index).every(l => !l.trim())) {
    return 1;
  }
  
  // If it's very short and all caps, probably important (H2)
  if (line.length < 30 && line === line.toUpperCase()) {
    return 2;
  }
  
  // If it starts with Chapter/Part, probably H1
  if (/^(Chapter|Part)\s+/i.test(line)) {
    return 1;
  }
  
  // If it starts with Section, probably H2
  if (/^Section\s+/i.test(line)) {
    return 2;
  }
  
  // Default to H3 for other headers
  return 3;
}

function isList(line: string): boolean {
  // Bullet points
  if (/^[-*•]\s+/.test(line)) return true;
  
  // Numbered lists
  if (/^\d+\.\s+/.test(line)) return true;
  
  // Letter lists
  if (/^[a-zA-Z]\.\s+/.test(line)) return true;
  
  // Roman numerals
  if (/^[ivxlcdm]+\.\s+/i.test(line)) return true;
  
  return false;
}

function convertToMarkdownList(line: string): string {
  // Convert various list formats to markdown
  
  // Already markdown-style bullets
  if (/^[-*]\s+/.test(line)) {
    return line;
  }
  
  // Bullet symbols to markdown
  if (/^•\s+/.test(line)) {
    return line.replace(/^•\s+/, '- ');
  }
  
  // Numbered lists - keep as is if they start with 1.
  if (/^\d+\.\s+/.test(line)) {
    return line;
  }
  
  // Convert other patterns to bullet points
  return '- ' + line.replace(/^[a-zA-Z•\-*]\.\s*/, '');
}

function isCodeLine(line: string): boolean {
  // Lines that are heavily indented (4+ spaces)
  if (/^    /.test(line)) return true;
  
  // Lines that look like code (contain common programming patterns)
  if (/[{}();]/.test(line) && !/^[A-Z]/.test(line.trim())) return true;
  
  // Lines with common code keywords
  if (/\b(function|var|let|const|if|else|for|while|class|def|import|export)\b/.test(line)) return true;
  
  return false;
}

function isQuote(line: string): boolean {
  // Lines starting with quote markers
  if (/^>\s/.test(line)) return true;
  
  // Lines in quotes
  if (/^["'].*["']$/.test(line)) return true;
  
  // Lines that start with common quote indicators
  if (/^(Quote:|"|')/.test(line)) return true;
  
  return false;
}

function convertArrayToMarkdownTable(array: any[]): string {
  if (array.length === 0) return '**Empty array**\n';
  
  // If array contains objects, create a table
  if (typeof array[0] === 'object' && array[0] !== null) {
    // Get all possible keys from all objects
    const allKeys = new Set<string>();
    array.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => allKeys.add(key));
      }
    });
    
    const keys = Array.from(allKeys);
    if (keys.length === 0) return '**Array of empty objects**\n';
    
    let markdown = `**Array Table** (${array.length} items)\n\n`;
    markdown += '| ' + keys.join(' | ') + ' |\n';
    markdown += '| ' + keys.map(() => '---').join(' | ') + ' |\n';
    
    array.forEach(item => {
      const values = keys.map(key => {
        if (item && typeof item === 'object' && key in item) {
          const value = item[key];
          if (value === null || value === undefined) {
            return '';
          } else if (typeof value === 'object') {
            return JSON.stringify(value).replace(/\|/g, '\\|');
          } else {
            return String(value).replace(/\|/g, '\\|');
          }
        }
        return '';
      });
      markdown += '| ' + values.join(' | ') + ' |\n';
    });
    
    return markdown;
  } else {
    // Simple list for primitive values
    let markdown = `**Array List** (${array.length} items)\n\n`;
    
    // Group similar items if the array is long
    if (array.length > 20) {
      const itemCounts = new Map<string, number>();
      array.forEach(item => {
        const key = String(item);
        itemCounts.set(key, (itemCounts.get(key) || 0) + 1);
      });
      
      markdown += '**Item counts:**\n';
      Array.from(itemCounts.entries())
        .sort(([,a], [,b]) => b - a)
        .forEach(([item, count]) => {
          markdown += `- \`${item}\`: ${count} times\n`;
        });
      
      return markdown;
    } else {
      return markdown + array.map((item, index) => `${index + 1}. ${item}`).join('\n') + '\n';
    }
  }
}

function convertObjectToMarkdown(obj: any, level: number = 2): string {
  let markdown = '';
  const entries = Object.entries(obj);
  
  // If object has many properties, create a summary table first
  if (entries.length > 10) {
    markdown += '## Property Summary\n\n';
    markdown += '| Property | Type | Value Preview |\n';
    markdown += '| --- | --- | --- |\n';
    
    entries.forEach(([key, value]) => {
      const type = Array.isArray(value) ? `Array[${value.length}]` : typeof value;
      let preview = '';
      
      if (value === null || value === undefined) {
        preview = String(value);
      } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
          preview = `[${value.length} items]`;
        } else {
          const keys = Object.keys(value);
          preview = `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
        }
      } else {
        preview = String(value).slice(0, 50);
        if (String(value).length > 50) preview += '...';
      }
      
      markdown += `| ${key} | ${type} | ${preview.replace(/\|/g, '\\|')} |\n`;
    });
    
    markdown += '\n## Detailed Content\n\n';
  }
  
  for (const [key, value] of entries) {
    const heading = '#'.repeat(Math.min(level, 6)); // Max 6 heading levels
    markdown += `${heading} ${key}\n\n`;
    
    if (value === null || value === undefined) {
      markdown += `*${value}*\n\n`;
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        markdown += convertArrayToMarkdownTable(value) + '\n';
      } else {
        // For nested objects, add some context
        const keys = Object.keys(value);
        if (keys.length === 0) {
          markdown += '*Empty object*\n\n';
        } else if (keys.length === 1) {
          markdown += convertObjectToMarkdown(value, level + 1);
        } else {
          markdown += convertObjectToMarkdown(value, level + 1);
        }
      }
    } else if (typeof value === 'string' && value.length > 100) {
      // Long strings as code blocks
      markdown += '```\n' + value + '\n```\n\n';
    } else {
      markdown += `${value}\n\n`;
    }
  }
  
  return markdown;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}