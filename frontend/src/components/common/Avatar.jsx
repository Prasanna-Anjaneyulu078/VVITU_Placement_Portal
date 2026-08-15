import React, { useState, useEffect } from 'react';
import { getInitials, getDisplayName } from '../../utils/avatarUtils';
import { getImageUrl } from '../../utils/imageUrl';
import './Avatar.css';

const Avatar = ({ 
  src, 
  image,
  alt = '', 
  name,
  size = 'md', 
  className = '',
  bgColor = 'FFF4EB',
  textColor = 'F47C20',
  ...props 
}) => {
  const [imageError, setImageError] = useState(false);

  const rawImage = image || src;
  const resolvedUrl = getImageUrl(rawImage);
  
  // Resolve display name safely using centralized name resolver
  const displayName = getDisplayName(name) || getDisplayName(alt) || getDisplayName(props.user) || '';
  const initials = getInitials(displayName);

  // Reset image error state whenever user or image source changes
  useEffect(() => {
    setImageError(false);
  }, [rawImage, displayName]);

  const showImage = Boolean(resolvedUrl) && !imageError && !resolvedUrl.includes('ui-avatars.com');

  const avatarClasses = [
    'custom-avatar',
    `avatar-${size}`,
    className
  ].filter(Boolean).join(' ');

  const bgColorHash = bgColor === 'random' 
    ? '#' + ['F47C20', '3B82F6', '10B981', '8B5CF6', 'EC4899', 'F59E0B'][String(displayName).split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 6]
    : String(bgColor).startsWith('#') ? bgColor : `#${bgColor}`;
    
  const textCol = String(textColor).startsWith('#') ? textColor : `#${textColor}`;

  return (
    <div 
      className={avatarClasses} 
      role="img"
      aria-label={displayName || 'User Avatar'}
      style={{
        backgroundColor: !showImage ? bgColorHash : 'transparent',
        color: textCol,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '1.75rem' : size === 'xl' ? '2.25rem' : '1rem',
        overflow: 'hidden',
        userSelect: 'none',
        ...props.style
      }}
      {...props}
    >
      {showImage ? (
        <img 
          src={resolvedUrl} 
          alt={displayName || 'User Avatar'} 
          className="avatar-img" 
          onError={() => setImageError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span style={{ lineHeight: 1 }}>{initials}</span>
      )}
    </div>
  );
};

export default Avatar;
