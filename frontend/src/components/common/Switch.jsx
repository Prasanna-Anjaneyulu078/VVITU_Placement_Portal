import React from 'react';
import './Switch.css';

const Switch = ({ checked, onChange, label, description }) => {
  return (
    <div className="switch-container">
      <div className="switch-info">
        {label && <p className="switch-label">{label}</p>}
        {description && <p className="switch-description">{description}</p>}
      </div>
      <label className="custom-switch">
        <input 
          type="checkbox" 
          checked={checked}
          onChange={onChange}
        />
        <span className="switch-slider round"></span>
      </label>
    </div>
  );
};

export default Switch;
