import React from 'react';
import './StatusBadge.css';

export default function StatusBadge({ status, variant, className = '' }) {
  const getStatusClass = () => {
    if (variant) return `badge-${variant}`;
    
    const lowerStatus = status?.toLowerCase() || '';
    
    if (lowerStatus.includes('approv') || lowerStatus.includes('active') || lowerStatus.includes('success')) {
      return 'badge-success';
    }
    if (lowerStatus.includes('pend') || lowerStatus.includes('review') || lowerStatus.includes('wait')) {
      return 'badge-warning';
    }
    if (lowerStatus.includes('reject') || lowerStatus.includes('clos') || lowerStatus.includes('fail')) {
      return 'badge-danger';
    }
    if (lowerStatus.includes('info') || lowerStatus.includes('new')) {
      return 'badge-info';
    }
    
    return 'badge-default';
  };

  return (
    <span className={`status-badge ${getStatusClass()} ${className}`}>
      {status}
    </span>
  );
}
