import React from 'react';
import './Skeleton.css';

const Skeleton = ({ width, height, borderRadius = '4px', className = '' }) => {
  const style = {
    width: width || '100%',
    height: height || '20px',
    borderRadius: borderRadius,
  };

  return (
    <div 
      className={`skeleton-loader ${className}`} 
      style={style}
    ></div>
  );
};

export default Skeleton;
