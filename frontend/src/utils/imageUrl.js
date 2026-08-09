/**
 * Resolves a raw image path/URL from the backend to a fully qualified browser URL.
 * Supports absolute URLs (http://, https://, blob:, data:) and relative upload paths (/uploads/...).
 *
 * @param {string} path - The image path or URL from the API/file input.
 * @returns {string|null} The resolved absolute URL, or null if empty.
 */
export const getImageUrl = (path) => {
  if (!path || typeof path !== 'string') return null;

  const trimmed = path.trim();
  if (!trimmed) return null;

  // If already absolute or a blob/data URL, return as-is
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // Prepend backend base URL if relative path
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  
  // Use VITE_API_BASE_URL origin if available, otherwise default to http://localhost:8082
  let backendOrigin = 'http://localhost:8082';
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl) {
    try {
      const parsed = new URL(envApiUrl);
      backendOrigin = parsed.origin;
    } catch {
      // Keep default backendOrigin if URL parsing fails
    }
  }

  return `${backendOrigin}${cleanPath}`;
};
