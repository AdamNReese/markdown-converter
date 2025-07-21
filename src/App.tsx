import React, { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import MarkdownOutput from './components/MarkdownOutput';
import { convertFilesToMarkdown } from './utils/fileConverter';

export interface MarkdownFile {
  name: string;
  content: string;
  originalFile?: string;
}

function App() {
  const [markdownFiles, setMarkdownFiles] = useState<MarkdownFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const handleFilesSubmit = async (files: File[]) => {
    setLoading(true);
    setError(null);
    setMarkdownFiles([]);
    setProgress({ current: 0, total: files.length });

    try {
      const convertedFiles = await convertFilesToMarkdown(files, (current) => {
        setProgress({ current, total: files.length });
      });
      setMarkdownFiles(convertedFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during conversion');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>File to Markdown Converter</h1>
        <p>Convert your files to markdown format with drag & drop</p>
      </header>
      
      <main className="App-main">
        <FileUpload onFilesSubmit={handleFilesSubmit} loading={loading} />
        
        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}
        
        {loading && (
          <div className="loading-message">
            {progress ? (
              <>
                Converting files... ({progress.current}/{progress.total})
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
              </>
            ) : (
              'Processing files...'
            )}
          </div>
        )}
        
        {markdownFiles.length > 0 && (
          <MarkdownOutput files={markdownFiles} />
        )}
      </main>
    </div>
  );
}

export default App;