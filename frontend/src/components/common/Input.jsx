import React from 'react';
import './Input.css';

const Input = ({ 
  label, 
  error, 
  type = 'text', 
  className = '', 
  containerClassName = '',
  icon: Icon,
  rightIcon: RightIcon,
  onRightIconClick,
  ...props 
}) => {
  const inputClasses = [
    'custom-input',
    error ? 'input-error' : '',
    Icon ? 'input-with-icon' : '',
    RightIcon ? 'input-with-right-icon' : '',
    className
  ].filter(Boolean).join(' ');

  const InputElement = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div className={`form-group ${containerClassName}`}>
      {label && <label className="form-label">{label}</label>}
      <div className="input-wrapper">
        {Icon && <Icon size={18} className="input-icon" />}
        <InputElement 
          type={type !== 'textarea' ? type : undefined}
          className={inputClasses} 
          {...props} 
        />
        {RightIcon && (
          <div 
            className={`input-right-icon ${onRightIconClick ? 'clickable' : ''}`}
            onClick={onRightIconClick}
          >
            <RightIcon size={18} />
          </div>
        )}
      </div>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Input;
