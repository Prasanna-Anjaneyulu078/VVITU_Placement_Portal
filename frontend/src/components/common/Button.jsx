import React from 'react';
import './Button.css';
import './loading/Loaders.css';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  isLoading = false,
  loadingText,
  icon: Icon,
  fullWidth = false,
  ...props 
}) => {
  const buttonClasses = [
    'custom-btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full-width' : '',
    isLoading ? 'btn-loading' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      type={type} 
      onClick={onClick} 
      className={buttonClasses} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="button-loader-spinner"></span>
          {loadingText || children}
        </>
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 14 : 18} className="button-icon-svg" />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
