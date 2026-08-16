import React, { useState, useMemo, useEffect } from 'react';
import { getCompanyLogoUrl, getInitials } from '../../utils/imageUrl';

export default function CompanyLogo({ url, name, size = 'md', className = '' }) {
  const [imageError, setImageError] = useState(false);
  const resolvedUrl = useMemo(() => getCompanyLogoUrl(url, name), [url, name]);
  const initial = getInitials(name || 'Company');

  useEffect(() => {
    setImageError(false);
  }, [url, name, resolvedUrl]);

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg text-xs',
    md: 'w-11 h-11 rounded-xl text-base',
    lg: 'w-14 h-14 rounded-xl text-xl',
    xl: 'w-16 h-16 rounded-2xl text-2xl'
  }[size] || 'w-11 h-11 rounded-xl text-base';

  const showImg = Boolean(resolvedUrl) && !imageError;

  return (
    <div className={`${sizeClasses} bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden font-extrabold text-[#F47C20] ${className}`}>
      {showImg ? (
        <img
          src={resolvedUrl}
          alt={name || 'Company Logo'}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain p-1"
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
