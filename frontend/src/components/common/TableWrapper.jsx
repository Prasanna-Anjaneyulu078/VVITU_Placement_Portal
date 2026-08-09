import React from 'react';
import './TableWrapper.css';

export default function TableWrapper({ children, className = '' }) {
  return (
    <div className={`table-wrapper ${className}`}>
      {children}
    </div>
  );
}
