import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface FileUploadProps {
  onFilesSubmit: (files: File[]) => void;
  loading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSubmit, loading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedTypes = [
    '.html', '.htm', '.txt', '.doc', '.docx', 
    '.xml', '.json', '.csv'
  ];

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      addFilesToList(newFiles);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      addFilesToList(newFiles);
    }
  };

  const addFilesToList = (newFiles: File[]) => {
    setSelectedFiles(prevFiles => {
      // Filter out duplicates based on name and size
      const existingFileKeys = new Set(
        prevFiles.map(file => `${file.name}-${file.size}-${file.lastModified}`)
      );
      
      const uniqueNewFiles = newFiles.filter(file => {
        const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
        return !existingFileKeys.has(fileKey);
      });
      
      return [...prevFiles, ...uniqueNewFiles];
    });
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleConvert = () => {
    if (selectedFiles.length > 0 && !loading) {
      onFilesSubmit(selectedFiles);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="file-upload-container">
      <div className="upload-info">
        <h3>Supported File Types</h3>
        <div className="supported-types">
          {supportedTypes.map(type => (
            <span key={type} className="file-type-badge">{type}</span>
          ))}
        </div>
      </div>

      <div
        className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${loading ? 'disabled' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <h3>Drag & Drop Files Here</h3>
          <p>or</p>
          <button 
            type="button" 
            className="browse-button"
            onClick={handleButtonClick}
            disabled={loading}
          >
            Browse Files
          </button>
          <p className="upload-hint">
            Select multiple files to convert them all to markdown
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept={supportedTypes.join(',')}
        disabled={loading}
      />

      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <div className="files-header">
            <h4>Selected Files ({selectedFiles.length})</h4>
            <div className="files-actions">
              <button 
                className="clear-button"
                onClick={clearFiles}
                disabled={loading}
              >
                Clear All
              </button>
              <button 
                className="convert-button"
                onClick={handleConvert}
                disabled={loading || selectedFiles.length === 0}
              >
                {loading ? 'Converting...' : `Convert ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
          
          <div className="files-list">
            {selectedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-details">
                    {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                  </div>
                </div>
                <button
                  className="remove-file-button"
                  onClick={() => removeFile(index)}
                  disabled={loading}
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;