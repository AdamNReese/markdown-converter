import React, { useState } from 'react';
import { MarkdownFile } from '../App';
import { downloadFile, downloadAllAsZip } from '../utils/fileDownloader';

interface MarkdownOutputProps {
  files: MarkdownFile[];
}

const MarkdownOutput: React.FC<MarkdownOutputProps> = ({ files }) => {
  const [selectedFile, setSelectedFile] = useState<string>(files[0]?.name || '');
  const [showPreview, setShowPreview] = useState(true);

  const currentFile = files.find(file => file.name === selectedFile);

  const handleDownloadSingle = (file: MarkdownFile) => {
    downloadFile(file.name, file.content);
  };

  const handleDownloadAll = () => {
    downloadAllAsZip(files);
  };

  return (
    <div className="markdown-output">
      <div className="output-header">
        <h2>Converted Files ({files.length})</h2>
        <div className="output-controls">
          <button 
            className="download-all-button"
            onClick={handleDownloadAll}
          >
            Download All as ZIP
          </button>
          <button
            className="toggle-preview-button"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
      </div>

      <div className="file-list">
        <h3>Files:</h3>
        <ul>
          {files.map((file) => (
            <li key={file.name} className="file-item">
              <button
                className={`file-button ${selectedFile === file.name ? 'selected' : ''}`}
                onClick={() => setSelectedFile(file.name)}
              >
                {file.name}
              </button>
              <button
                className="download-button"
                onClick={() => handleDownloadSingle(file)}
                title={`Download ${file.name}`}
              >
                ↓
              </button>
            </li>
          ))}
        </ul>
      </div>

      {showPreview && currentFile && (
        <div className="file-preview">
          <div className="preview-header">
            <h3>Preview: {currentFile.name}</h3>
            <div className="preview-stats">
              {currentFile.content.length} characters, {currentFile.content.split('\n').length} lines
            </div>
          </div>
          <div className="preview-content">
            <pre style={{ whiteSpace: 'pre-wrap' }}>{currentFile.content}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkdownOutput;