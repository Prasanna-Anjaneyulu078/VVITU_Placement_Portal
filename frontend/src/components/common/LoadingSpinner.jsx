import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', color = 'primary', fullPage = false }) => {
  const spinnerClass = `spinner ${size} ${color}`;
  
  if (fullPage) {
    return (
      <div className="spinner-container full-page">
        <div className={spinnerClass}></div>
      </div>
    );
  }

  return (
    <div className="spinner-container">
      <div className={spinnerClass}></div>
    </div>
  );
};

export default LoadingSpinner;
