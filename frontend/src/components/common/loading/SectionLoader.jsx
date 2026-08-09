import React from 'react';
import './Loaders.css';

export default function SectionLoader({ rows = 3, isDark = false, style }) {
  return (
    <div className={`section-loader ${isDark ? 'dark' : ''}`} style={style}>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="skeleton-box" 
          style={{ height: 20, width: i % 2 === 0 ? '100%' : '80%' }}
        ></div>
      ))}
    </div>
  );
}
