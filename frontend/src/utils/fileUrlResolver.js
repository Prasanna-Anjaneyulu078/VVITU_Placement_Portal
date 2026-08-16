import api from './axiosConfig';

/**
 * Gets the active backend origin (e.g. "https://vvitu-placement-portal-api.onrender.com" or "http://localhost:8082").
 */
export function getBackendOrigin() {
  const envBase = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_BASE_URL : null;
  const apiBase = api?.defaults?.baseURL || envBase || 'http://localhost:8082/api';
  try {
    const parsed = new URL(apiBase, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8082');
    return parsed.origin;
  } catch {
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8082';
  }
}

/**
 * Checks if a value is a valid Base64 data URL string.
 */
export function isBase64(value) {
  if (!value || typeof value !== 'string') return false;
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]{2,}/i.test(value.trim());
}

/**
 * Safely appends a version parameter (?v=...) for cache busting HTTP or relative URLs.
 * GUARANTEE: Base64 data strings and Blob URLs are returned 100% UNTOUCHED.
 */
export function withCacheBust(url, version) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // GUARANTEE: BASE64 AND BLOB URLS MUST NEVER BE APPENDED WITH QUERY PARAMETERS
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const vParam = encodeURIComponent(version !== undefined && version !== null ? String(version) : String(Date.now()));
  const separator = trimmed.includes('?') ? '&' : '?';
  
  if (/[?&]v=[^&]+/.test(trimmed)) {
    return trimmed.replace(/([?&])v=[^&]+/, `$1v=${vParam}`);
  }
  return `${trimmed}${separator}v=${vParam}`;
}

/**
 * Universal File & Document URL Resolver.
 * Safely converts relative paths (/uploads/...) or legacy localhost URLs into active backend origin URLs.
 *
 * @param {string} fileRef - File path, URL, or Base64 string
 * @param {Object} [options] - Options (cacheBust, version)
 * @returns {string|null} Resolved browser-ready URL or null
 */
export function getFileUrl(fileRef, options = {}) {
  if (!fileRef || typeof fileRef !== 'string') return null;
  const trimmed = fileRef.trim();

  if (
    !trimmed ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed === 'false' ||
    trimmed === '[object Object]' ||
    trimmed === 'data:' ||
    trimmed === 'data:image' ||
    trimmed === 'http://' ||
    trimmed === 'https://'
  ) {
    return null;
  }

  if (
    !trimmed.startsWith('/') &&
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('data:') &&
    !trimmed.startsWith('blob:') &&
    !trimmed.includes('/uploads/')
  ) {
    return null;
  }

  // 1. Base64 or Blob URLs -> Return UNTOUCHED
  if (trimmed.startsWith('data:')) {
    return isBase64(trimmed) ? trimmed : null;
  }
  if (trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const backendOrigin = getBackendOrigin();

  // 2. Absolute HTTP/HTTPS URLs
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      // Normalize any host/port with /uploads/ path to use current active backend origin
      if (parsed.pathname.includes('/uploads/')) {
        const normalized = `${backendOrigin}${parsed.pathname}${parsed.search}`;
        return options.cacheBust ? withCacheBust(normalized, options.version) : normalized;
      }
    } catch {
      // Keep original URL if parsing fails
    }
    return options.cacheBust ? withCacheBust(trimmed, options.version) : trimmed;
  }

  // 3. Relative Upload Paths (/uploads/...)
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const fullUrl = `${backendOrigin}${cleanPath}`;
  return options.cacheBust ? withCacheBust(fullUrl, options.version) : fullUrl;
}

/**
 * Profile Image URL Resolver with alias support for User/Student/Alumni objects.
 */
export function getProfileImageUrl(userOrPath, options = {}) {
  if (!userOrPath) return null;
  let rawPath = userOrPath;
  if (typeof userOrPath === 'object') {
    rawPath = userOrPath.profileImageUrl || userOrPath.profileImage || userOrPath.avatar || userOrPath.imageUrl;
  }
  return getFileUrl(rawPath, options);
}

/**
 * Document & Resume URL Resolver.
 */
export function getDocumentUrl(docRef, options = {}) {
  if (!docRef) return null;
  let rawPath = docRef;
  if (typeof docRef === 'object') {
    rawPath = docRef.filePath || docRef.fileUrl || docRef.verificationDocumentUrl || docRef.url;
  }
  return getFileUrl(rawPath, options);
}

/**
 * Generates clean 2-letter uppercase initials from full name.
 * e.g., "Venkata Prasanna Borigorla" -> "VB"
 *       "Satish Kumar" -> "SK"
 *       "Admin" -> "AD"
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  const cleanName = name.replace(/[^a-zA-Z\s]/g, '').trim();
  if (!cleanName) return 'U';
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
