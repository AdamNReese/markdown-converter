import React, { useState } from 'react';

interface LinkInputProps {
  onSubmit: (link: string) => void;
  loading: boolean;
}

const LinkInput: React.FC<LinkInputProps> = ({ onSubmit, loading }) => {
  const [link, setLink] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (link.trim() && !loading) {
      onSubmit(link.trim());
    }
  };

  const isValidDocSendLink = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.includes('docsend.com');
    } catch {
      return false;
    }
  };

  return (
    <div className="link-input-container">
      <form onSubmit={handleSubmit} className="link-input-form">
        <div className="input-group">
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Enter DocSend link (e.g., https://docsend.com/view/...)"
            className="link-input"
            disabled={loading}
            required
          />
          <button
            type="submit"
            className="submit-button"
            disabled={loading || !link.trim() || !isValidDocSendLink(link)}
          >
            {loading ? 'Converting...' : 'Convert to Markdown'}
          </button>
        </div>
        
        {link && !isValidDocSendLink(link) && (
          <div className="validation-error">
            Please enter a valid DocSend link
          </div>
        )}
      </form>
    </div>
  );
};

export default LinkInput;