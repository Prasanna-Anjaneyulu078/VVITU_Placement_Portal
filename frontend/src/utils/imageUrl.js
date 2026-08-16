/**
 * Centralized Image Resolution & Cache Busting Utility
 * Re-exports canonical implementation from fileUrlResolver.js for full backward compatibility.
 */
import { 
  getFileUrl, 
  getProfileImageUrl, 
  getDocumentUrl, 
  getInitials, 
  isBase64, 
  withCacheBust,
  getBackendOrigin
} from './fileUrlResolver';

export {
  getFileUrl,
  getProfileImageUrl,
  getDocumentUrl,
  getInitials,
  isBase64,
  withCacheBust,
  getBackendOrigin
};

export function isBase64Image(value) {
  return isBase64(value);
}

export function isHttpUrl(value) {
  if (!value || typeof value !== 'string') return false;
  return /^https?:\/\/.+/i.test(value.trim());
}

export function isRelativeImageUrl(value) {
  if (!value || typeof value !== 'string') return false;
  return value.trim().startsWith('/');
}

export function resolveImageUrl(value, options = {}) {
  return getProfileImageUrl(value, options);
}

export function resolveProfileImage(value, options = {}) {
  return getProfileImageUrl(value, options);
}

export const getImageUrl = (path, options) => getProfileImageUrl(path, options);
