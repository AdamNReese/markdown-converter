import TurndownService from 'turndown';
import { MarkdownFile } from '../App';

export async function processDocSendLink(url: string): Promise<MarkdownFile[]> {
  if (!url.includes('docsend.com')) {
    throw new Error('Invalid DocSend URL');
  }

  // Try multiple access methods
  const accessMethods = [
    () => fetchWithCORS(url),
    () => fetchWithProxy(url),
    () => fetchWithAllOrigins(url)
  ];

  let lastError: Error | null = null;

  for (const method of accessMethods) {
    try {
      const html = await method();
      const markdownFiles = await extractAndConvertContent(html, url);
      
      if (markdownFiles.length === 0) {
        throw new Error('No content found in the DocSend presentation');
      }

      return markdownFiles;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      continue;
    }
  }

  // If all methods failed, provide helpful error message
  const errorMessage = lastError?.message || 'Unknown error';
  
  // Check if it's a bot detection issue
  if (errorMessage.includes('bot') || errorMessage.includes('Bot') || 
      errorMessage.includes('automated') || errorMessage.includes('security')) {
    throw new Error(`DocSend has detected automated access and blocked the request.

📋 RECOMMENDED SOLUTION - Manual Copy:
1. Open the DocSend link in your browser
2. Right-click and select "View Page Source" (or press Ctrl+U / Cmd+U)
3. Copy the entire HTML content
4. Switch to "HTML Content" tab above and paste it

⚠️  Why this happens:
DocSend has anti-bot protection to prevent automated downloads. This is normal security behavior.

🔧 Alternative options:
• Use the "Demo Mode" to see how the converter works
• Try a different browser or incognito mode
• Use a CORS browser extension (less reliable)

Error details: ${errorMessage}`);
  }

  throw new Error(`Unable to access DocSend content. This is likely due to CORS or security restrictions.

📋 RECOMMENDED SOLUTION - Manual Copy:
1. Open the DocSend link in your browser  
2. Right-click and select "View Page Source" (or press Ctrl+U / Cmd+U)
3. Copy the entire HTML content
4. Switch to "HTML Content" tab above and paste it

🔧 Other options:
• Try the "Demo Mode" to see how the converter works
• Use a CORS browser extension (like "CORS Unblock")
• Try a different browser or incognito mode

Error details: ${errorMessage}`);
}

async function fetchWithCORS(url: string): Promise<string> {
  const response = await fetch(url, {
    mode: 'cors',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; DocSend-Markdown-Converter)',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.text();
}

async function fetchWithProxy(url: string): Promise<string> {
  // Try with a public CORS proxy
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  
  const response = await fetch(proxyUrl);
  
  if (!response.ok) {
    throw new Error(`Proxy request failed: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.contents) {
    throw new Error('No content received from proxy');
  }

  return data.contents;
}

async function fetchWithAllOrigins(url: string): Promise<string> {
  // Alternative proxy service
  const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
  
  const response = await fetch(proxyUrl, {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  if (!response.ok) {
    throw new Error(`Alternative proxy failed: ${response.status}`);
  }

  return response.text();
}

export async function processHtmlContent(html: string, sourceUrl: string): Promise<MarkdownFile[]> {
  try {
    const markdownFiles = await extractAndConvertContent(html, sourceUrl);
    
    if (markdownFiles.length === 0) {
      throw new Error('No content found in the HTML');
    }

    return markdownFiles;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to process HTML content');
  }
}

async function extractAndConvertContent(html: string, originalUrl: string): Promise<MarkdownFile[]> {
  // Check for bot detection messages first
  const botKeywords = [
    'you appear to be a bot',
    'bot protection',
    'automated access',
    'security check',
    'please verify',
    'captcha',
    'cloudflare'
  ];
  
  const htmlLower = html.toLowerCase();
  for (const keyword of botKeywords) {
    if (htmlLower.includes(keyword)) {
      throw new Error(`DocSend bot protection detected: "${keyword}". Please use manual HTML copy method.`);
    }
  }

  const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full'
  });

  turndownService.addRule('cleanupSpaces', {
    filter: ['p', 'div', 'span'],
    replacement: function (content: string) {
      return content.replace(/\s+/g, ' ').trim();
    }
  });

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const slides = extractSlides(doc);
  const markdownFiles: MarkdownFile[] = [];

  if (slides.length > 0) {
    slides.forEach((slide, index) => {
      const slideContent = turndownService.turndown(slide.innerHTML);
      const fileName = `slide_${(index + 1).toString().padStart(2, '0')}.md`;
      
      const markdownContent = `# Slide ${index + 1}\n\n${slideContent}\n\n---\n\n*Source: ${originalUrl}*\n*Slide ${index + 1} of ${slides.length}*`;
      
      markdownFiles.push({
        name: fileName,
        content: markdownContent
      });
    });

    const fullDocument = slides.map((slide, index) => {
      const slideContent = turndownService.turndown(slide.innerHTML);
      return `# Slide ${index + 1}\n\n${slideContent}`;
    }).join('\n\n---\n\n');

    markdownFiles.unshift({
      name: 'full_presentation.md',
      content: `# Full Presentation\n\n${fullDocument}\n\n---\n\n*Source: ${originalUrl}*\n*Generated on ${new Date().toISOString()}*`
    });
  } else {
    const bodyContent = doc.body ? turndownService.turndown(doc.body.innerHTML) : '';
    if (bodyContent.trim()) {
      markdownFiles.push({
        name: 'docsend_content.md',
        content: `# DocSend Content\n\n${bodyContent}\n\n---\n\n*Source: ${originalUrl}*\n*Generated on ${new Date().toISOString()}*`
      });
    }
  }

  return markdownFiles;
}

function extractSlides(doc: Document): Element[] {
  const slideSelectors = [
    '.slide',
    '.page',
    '.ds-slide',
    '.presentation-slide',
    '[data-slide]',
    '.slide-content',
    '.page-content'
  ];

  for (const selector of slideSelectors) {
    const slides = Array.from(doc.querySelectorAll(selector));
    if (slides.length > 0) {
      return slides;
    }
  }

  const contentContainers = Array.from(doc.querySelectorAll('div')).filter(div => {
    const className = div.className.toLowerCase();
    const id = div.id.toLowerCase();
    return className.includes('slide') || className.includes('page') || 
           id.includes('slide') || id.includes('page');
  });

  if (contentContainers.length > 0) {
    return contentContainers;
  }

  const mainContent = doc.querySelector('main') || doc.querySelector('.main') || doc.querySelector('#main');
  if (mainContent) {
    return [mainContent];
  }

  return [];
}