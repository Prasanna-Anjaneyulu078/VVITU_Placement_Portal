/**
 * Centralized Image Resolution & Cache Busting Utility
 * Ensures Base64 image data is NEVER appended with query parameters or corrupted.
 */

/**
 * Checks if a value is a Base64 data URL.
 */
export function isBase64Image(value) {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/i.test(trimmed);
}

/**
 * Checks if a value is an absolute HTTP/HTTPS URL.
 */
export function isHttpUrl(value) {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return /^https?:\/\/.+/i.test(trimmed);
}

/**
 * Checks if a value is a relative URL (starts with /).
 */
export function isRelativeImageUrl(value) {
  if (!value || typeof value !== 'string') return false;
  return value.trim().startsWith('/');
}

/**
 * Safely appends a cache-busting version parameter (?v=...) to HTTP or relative URLs.
 * GUARANTEE: Base64 data strings and Blob URLs are returned 100% UNTOUCHED.
 */
export function withCacheBust(url, version) {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (
    !trimmed ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed === '[object Object]'
  ) {
    return null;
  }

  // CRITICAL RULE: BASE64 AND BLOB URLS MUST NEVER BE APPENDED WITH QUERY PARAMETERS
  if (trimmed.startsWith('data:')) {
    if (isBase64Image(trimmed)) return trimmed;
    return null;
  }
  if (trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Reject invalid non-URL values
  if (!isHttpUrl(trimmed) && !isRelativeImageUrl(trimmed)) {
    return null;
  }

  const effectiveVersion = version !== undefined && version !== null ? String(version) : String(Date.now());
  const vParam = encodeURIComponent(effectiveVersion);

  // If the url already has a v= parameter, replace it
  const urlObj = new URL(trimmed, 'http://localhost'); // dummy base for parsing relative
  if (urlObj.searchParams.has('v')) {
    if (urlObj.searchParams.get('v') === String(vParam)) {
      return trimmed; // already has exact version
    }
    // Remove old v= param via regex to preserve relative nature
    const cleanUrl = trimmed.replace(/([?&])v=[^&]+(&|$)/, (match, p1, p2) => {
      return p2 ? p1 : ''; // If there are subsequent params, keep the separator
    }).replace(/[?&]$/, ''); // Clean up trailing ? or &
    const separator = cleanUrl.includes('?') ? '&' : '?';
    return `${cleanUrl}${separator}v=${vParam}`;
  }

  const separator = trimmed.includes('?') ? '&' : '?';
  return `${trimmed}${separator}v=${vParam}`;
}

/**
 * Resolves a raw image input to a fully qualified browser-ready URL or Base64 data string.
 *
 * @param {string} value - Raw image value from API or state.
 * @param {Object} [options] - Options.
 * @param {boolean} [options.cacheBust] - Whether to append cache busting parameter to HTTP/relative URLs.
 * @param {string|number} [options.version] - Explicit version timestamp for cache busting.
 * @returns {string|null} Resolved image URL, Base64 string, or null for fallback avatar.
 */
export function resolveImageUrl(value, options = {}) {
  // Alias for backward compatibility
  return resolveProfileImage(value, options);
}

export function resolveProfileImage(value, options = {}) {
  if (!value || typeof value !== 'string') return null;

  const trimmed = value.trim();
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

  // Determine active backend origin
  let backendOrigin = 'http://localhost:8082';
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    try {
      const parsed = new URL(import.meta.env.VITE_API_BASE_URL);
      backendOrigin = parsed.origin;
    } catch {
      // Fallback to default origin
    }
  }

  // 1. Base64 & Blob URLs -> Return EXACTLY as-is (NO cache busting query string EVER)
  if (trimmed.startsWith('data:')) {
    if (isBase64Image(trimmed)) return trimmed;
    return null; // Malformed Base64 -> immediately use initials
  }
  if (trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 2. Absolute HTTP/HTTPS URLs
  if (isHttpUrl(trimmed)) {
    let targetUrl = trimmed;
    try {
      const parsed = new URL(trimmed);
      if ((parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') && parsed.pathname.includes('/uploads/')) {
        targetUrl = `${backendOrigin}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      // Keep original url
    }
    return options.cacheBust ? withCacheBust(targetUrl, options.version) : targetUrl;
  }

  // 3. Relative Upload Paths (/uploads/...) -> Convert to full backend origin URL
  if (isRelativeImageUrl(trimmed)) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const fullUrl = `${backendOrigin}${cleanPath}`;
    return options.cacheBust ? withCacheBust(fullUrl, options.version) : fullUrl;
  }

  return null;
}

/**
 * Backward-compatible helper used throughout the frontend components.
 */
export const getImageUrl = (path, options) => resolveProfileImage(path, options);
