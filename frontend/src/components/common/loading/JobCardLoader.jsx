import React from 'react';
import './Loaders.css';

export default function JobCardLoader({ isDark = false }) {
  return (
    <div className={`job-card-loader ${isDark ? 'dark' : ''}`}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div className="skeleton-box" style={{ width: 48, height: 48, borderRadius: 8 }}></div>
        <div style={{ flex: 1 }}>
          <div className="skeleton-box" style={{ height: 20, width: '60%', marginBottom: 8 }}></div>
          <div className="skeleton-box" style={{ height: 16, width: '40%' }}></div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <div className="skeleton-box" style={{ height: 24, width: 80, borderRadius: 12 }}></div>
        <div className="skeleton-box" style={{ height: 24, width: 100, borderRadius: 12 }}></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
        <div className="skeleton-box" style={{ height: 16, width: 100 }}></div>
        <div className="skeleton-box" style={{ height: 32, width: 80, borderRadius: 6 }}></div>
      </div>
    </div>
  );
}
