import React from 'react';
import './Card.css';

const Card = ({ 
  children, 
  title, 
  subtitle,
  headerAction,
  className = '',
  bodyClassName = '',
  noPadding = false,
  ...props 
}) => {
  return (
    <div className={`custom-card ${className}`} {...props}>
      {(title || subtitle || headerAction) && (
        <div className="card-header">
          <div className="card-title-group">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {headerAction && <div className="card-header-action">{headerAction}</div>}
        </div>
      )}
      <div className={`card-body ${noPadding ? 'p-0' : ''} ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default Card;
