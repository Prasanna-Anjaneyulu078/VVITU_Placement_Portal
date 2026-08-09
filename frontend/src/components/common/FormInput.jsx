import React from 'react';
import './FormInput.css';

const FormInput = ({ 
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
    'form-input-field',
    error ? 'form-input-error' : '',
    Icon ? 'form-input-with-icon' : '',
    RightIcon ? 'form-input-with-right-icon' : '',
    className
  ].filter(Boolean).join(' ');

  const InputElement = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div className={`form-input-group ${containerClassName}`}>
      {label && <label className="form-input-label">{label}</label>}
      <div className="form-input-wrapper">
        {Icon && <Icon size={18} className="form-input-icon" />}
        <InputElement 
          type={type !== 'textarea' ? type : undefined}
          className={inputClasses} 
          {...props} 
        />
        {RightIcon && (
          <div 
            className={`form-input-right-icon ${onRightIconClick ? 'clickable' : ''}`}
            onClick={onRightIconClick}
          >
            <RightIcon size={18} />
          </div>
        )}
      </div>
      {error && <p className="form-input-error-message">{error}</p>}
    </div>
  );
};

export default FormInput;
