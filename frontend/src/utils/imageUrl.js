/**
 * Centralized Image Resolution & Cache Busting Utility
 * Ensures Base64 image data is NEVER appended with query parameters or corrupted.
 */

/**
 * Checks if a value is a Base64 data URL.
 */
export function isBase64Image(value) {
  if (!value || typeof value !== 'string') return false;
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(value.trim());
}

/**
 * Checks if a value is an absolute HTTP/HTTPS URL.
 */
export function isHttpUrl(value) {
  if (!value || typeof value !== 'string') return false;
  return /^https?:\/\//i.test(value.trim());
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
  if (isBase64Image(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Reject invalid non-URL values
  if (!isHttpUrl(trimmed) && !isRelativeImageUrl(trimmed)) {
    return null;
  }

  const vParam = version ? encodeURIComponent(String(version)) : Date.now();

  // Avoid duplicate ?v= if already contains exact version
  if (trimmed.includes(`v=${vParam}`)) {
    return trimmed;
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
  if (!value || typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (
    !trimmed ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed === '[object Object]' ||
    trimmed === 'data:'
  ) {
    return null;
  }

  // 1. Base64 & Blob URLs -> Return EXACTLY as-is (NO cache busting query string EVER)
  if (isBase64Image(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 2. Absolute HTTP/HTTPS URLs
  if (isHttpUrl(trimmed)) {
    return options.cacheBust ? withCacheBust(trimmed, options.version) : trimmed;
  }

  // 3. Relative Upload Paths (/uploads/...) -> Convert to full backend origin URL
  if (isRelativeImageUrl(trimmed)) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    let backendOrigin = 'http://localhost:8082';

    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
      try {
        const parsed = new URL(import.meta.env.VITE_API_BASE_URL);
        backendOrigin = parsed.origin;
      } catch {
        // Fallback to default origin
      }
    }

    const fullUrl = `${backendOrigin}${cleanPath}`;
    return options.cacheBust ? withCacheBust(fullUrl, options.version) : fullUrl;
  }

  return null;
}

/**
 * Backward-compatible helper used throughout the frontend components.
 */
export const getImageUrl = (path, options) => resolveImageUrl(path, options);
