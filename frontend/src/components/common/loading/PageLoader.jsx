import React from 'react';
import './Loaders.css';

export default function PageLoader({ text = 'Loading...', isDark = false }) {
  return (
    <div className={`global-page-loader-overlay ${isDark ? 'dark' : ''}`}>
      <div className="loader-spinner-container">
        <div className="loader-spinner"></div>
        {text && <div className="loader-text">{text}</div>}
      </div>
    </div>
  );
}
