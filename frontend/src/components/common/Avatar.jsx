import React, { useState, useEffect } from 'react';
import { generateAvatarSVG } from '../../utils/avatarUtils';
import { getImageUrl } from '../../utils/imageUrl';
import './Avatar.css';

const Avatar = ({ 
  src, 
  alt = 'User', 
  name,
  size = 'md', 
  className = '',
  bgColor = 'F47C20',
  textColor = 'ffffff',
  ...props 
}) => {
  const [imageError, setImageError] = useState(false);
  const displayName = name || alt || 'User';

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const avatarClasses = [
    'custom-avatar',
    `avatar-${size}`,
    className
  ].filter(Boolean).join(' ');

  const fallbackDataUrl = generateAvatarSVG(displayName, bgColor, textColor);

  return (
    <div 
      className={avatarClasses} 
      role="img"
      aria-label={displayName}
      {...props}
    >
      {src && !imageError && !src.includes('ui-avatars.com') ? (
        <img 
          src={getImageUrl(src)} 
          alt={displayName} 
          className="avatar-img" 
          onError={() => setImageError(true)}
        />
      ) : (
        <img 
          src={fallbackDataUrl} 
          alt={displayName} 
          className="avatar-img"
        />
      )}
    </div>
  );
};

export default Avatar;
