import React, { useState } from 'react';

interface HtmlInputProps {
  onSubmit: (html: string, sourceUrl?: string) => void;
  loading: boolean;
}

const HtmlInput: React.FC<HtmlInputProps> = ({ onSubmit, loading }) => {
  const [html, setHtml] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (html.trim() && !loading) {
      onSubmit(html.trim(), sourceUrl.trim() || undefined);
    }
  };

  return (
    <div className="html-input-container">
      <div className="input-description">
        <h3>Manual HTML Input</h3>
        <p>If the DocSend link doesn't work due to CORS restrictions, you can:</p>
        <ol>
          <li>Open the DocSend link in your browser</li>
          <li>Right-click and select "View Page Source" or press Ctrl+U (Cmd+U on Mac)</li>
          <li>Copy the entire HTML content and paste it below</li>
        </ol>
      </div>
      
      <form onSubmit={handleSubmit} className="html-input-form">
        <div className="input-group">
          <label htmlFor="source-url">Source URL (optional):</label>
          <input
            id="source-url"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://docsend.com/view/..."
            className="source-url-input"
            disabled={loading}
          />
        </div>
        
        <div className="input-group">
          <label htmlFor="html-content">HTML Content:</label>
          <textarea
            id="html-content"
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder="Paste the HTML content here..."
            className="html-textarea"
            disabled={loading}
            rows={12}
            required
          />
        </div>
        
        <button
          type="submit"
          className="submit-button"
          disabled={loading || !html.trim()}
        >
          {loading ? 'Converting...' : 'Convert HTML to Markdown'}
        </button>
      </form>
    </div>
  );
};

export default HtmlInput;