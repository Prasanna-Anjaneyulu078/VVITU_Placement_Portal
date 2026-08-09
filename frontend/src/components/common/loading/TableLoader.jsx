import React from 'react';
import './Loaders.css';

export default function TableLoader({ rows = 5, columns = 4, isDark = false }) {
  return (
    <div className={`table-loader-container ${isDark ? 'dark' : ''}`}>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="table-loader-row">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <div key={cIdx} className="skeleton-box table-loader-cell" style={{ width: cIdx === 0 ? '40%' : '100%' }}></div>
          ))}
        </div>
      ))}
    </div>
  );
}
