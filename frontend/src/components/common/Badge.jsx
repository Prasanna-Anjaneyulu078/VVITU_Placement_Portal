import React from 'react';
import './Badge.css';

const Badge = ({ 
  children, 
  variant = 'pending', 
  className = '',
  ...props 
}) => {
  const badgeClasses = [
    'custom-badge',
    `badge-${variant.toLowerCase()}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClasses} {...props}>
      {children}
    </span>
  );
};

export default Badge;
