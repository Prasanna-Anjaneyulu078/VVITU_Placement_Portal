import React from 'react';
import Avatar from './Avatar';

/**
 * Universal Reusable Profile Avatar Component.
 * Supports Student, Alumni, Admin profiles with automatic Initials Fallback (e.g. VB, SK).
 * Never displays broken images or empty circles.
 */
const ProfileAvatar = ({ user, name, src, image, size = 'md', className = '', ...props }) => {
  const resolvedName = name || user?.name || user?.studentName || user?.userName || '';
  const resolvedSrc = src || image || user?.profileImageUrl || user?.profileImage || user?.avatar || '';

  return (
    <Avatar
      name={resolvedName}
      src={resolvedSrc}
      size={size}
      className={className}
      user={user}
      {...props}
    />
  );
};

export default ProfileAvatar;
