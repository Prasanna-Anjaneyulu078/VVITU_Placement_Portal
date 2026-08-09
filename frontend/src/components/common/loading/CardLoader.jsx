import React from 'react';
import './Loaders.css';

export default function CardLoader({ isDark = false, lines = 2 }) {
  return (
    <div className={`card-loader-container ${isDark ? 'dark' : ''}`}>
      <div className="skeleton-box" style={{ height: 20, width: '40%', marginBottom: 8 }}></div>
      <div className="skeleton-box" style={{ height: 32, width: '60%' }}></div>
      {Array.from({ length: lines - 2 }).map((_, i) => (
        <div key={i} className="skeleton-box" style={{ height: 16, width: '100%', marginTop: 8 }}></div>
      ))}
    </div>
  );
}
