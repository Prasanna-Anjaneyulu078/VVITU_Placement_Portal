import React from 'react';
import './Loaders.css';

export default function ProfileLoader({ isDark = false }) {
  return (
    <div className={`profile-loader ${isDark ? 'dark' : ''}`}>
      <div className="profile-loader-header">
        <div className="skeleton-box profile-loader-avatar"></div>
        <div className="profile-loader-info">
          <div className="skeleton-box" style={{ height: 32, width: '40%' }}></div>
          <div className="skeleton-box" style={{ height: 20, width: '25%' }}></div>
          <div className="skeleton-box" style={{ height: 20, width: '30%' }}></div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton-box" style={{ height: 200, width: '100%' }}></div>
          <div className="skeleton-box" style={{ height: 150, width: '100%' }}></div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton-box" style={{ height: 150, width: '100%' }}></div>
          <div className="skeleton-box" style={{ height: 200, width: '100%' }}></div>
        </div>
      </div>
    </div>
  );
}
