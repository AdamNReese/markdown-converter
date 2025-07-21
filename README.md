# File to Markdown Converter

A React TypeScript web application that converts various file formats to markdown with drag & drop functionality.

## Features

- **Drag & Drop Upload**: Intuitive file selection with drag and drop support
- **Multiple File Types**: Supports HTML, TXT, DOC, DOCX, XML, JSON, CSV
- **Mass Conversion**: Convert multiple files at once with progress tracking
- **Smart Conversion**: Intelligent conversion based on file type (HTML to markdown, JSON to tables, CSV to markdown tables, etc.)
- **Download Options**: Download individual files or all files as a ZIP archive
- **Preview**: Live preview of converted markdown content
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Graceful error handling with detailed error files

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Building for Production

```bash
npm run build
```

## Usage

### File Upload Methods

**Method 1: Drag & Drop (Recommended)**
1. Drag files from your computer into the upload area
2. Files will be automatically selected and displayed
3. Click "Convert Files" to process all files

**Method 2: Browse Files**
1. Click "Browse Files" button in the upload area
2. Select single or multiple files from your computer
3. Click "Convert Files" to process

### Supported File Types

- **HTML/Web**: `.html`, `.htm`, `.xml` - Converted using Turndown service
- **Text**: `.txt` - Smart text-to-markdown conversion
- **Documents**: `.doc`, `.docx` - Text extraction and conversion
- **Data**: `.json`, `.csv` - Converted to markdown tables and structured content

### After Conversion
- View progress indicator during mass conversion
- Preview converted markdown content
- Download individual files or all files as a ZIP archive
- Failed conversions are saved as error files with details

## Technical Details

### Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Turndown** - HTML to Markdown conversion
- **JSZip** - ZIP file generation
- **CSS3** - Styling and responsive design

### File Structure

```
src/
├── components/
│   ├── FileUpload.tsx     # Drag & drop file upload component
│   └── MarkdownOutput.tsx # Display component for converted files
├── utils/
│   ├── fileConverter.ts   # File conversion logic for multiple formats
│   └── fileDownloader.ts  # File download and ZIP creation utilities
├── App.tsx                # Main application component
├── App.css                # Application styles
└── index.tsx              # Application entry point
```

### Conversion Details

**HTML/XML Files:**
- Uses Turndown service for clean HTML-to-markdown conversion
- Preserves headings, lists, links, and formatting
- Cleans up extra spaces and formatting

**JSON Files:**
- Converts objects to structured markdown with headings
- Arrays become markdown tables when possible
- Preserves data structure and hierarchy

**CSV Files:**
- Automatically converts to markdown tables
- First row becomes table header
- Handles basic CSV parsing

**Text Files:**
- Smart conversion with automatic heading detection
- Preserves paragraphs and line breaks
- Enhances plain text with markdown formatting

### Limitations

**📄 File Reading Limitations**
- DOC/DOCX files require text-only content (no complex formatting)

**💾 Browser File Access**
- All processing happens client-side for privacy
- Large files may consume browser memory
- Some file types may not be fully supported

**🔧 Conversion Quality**
- HTML files produce the best results
- Complex formatting may be simplified
- Binary files are not supported

## License

MIT License