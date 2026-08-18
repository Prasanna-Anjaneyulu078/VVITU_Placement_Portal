const path = require('path');
const fs = require('fs');
const env = require('../config/env');

/**
 * Safely resolves a stored resume file path to a verified physical file on disk.
 * Prevents path traversal and checks fallback locations.
 */
function resolveResumeFilePath(storedPath) {
  if (!storedPath) {
    return null;
  }

  // Strip query parameters and hash before extracting basename or resolving disk path
  const pathOnly = String(storedPath).split('?')[0].split('#')[0];
  const normalized = pathOnly.replace(/\\/g, '/');
  const baseName = path.basename(normalized);
  if (!baseName || baseName === '.' || baseName === '/') {
    return null;
  }

  const uploadRoot = path.resolve(env.uploadDir);

  // 1. Check preferred folder if specified in path (resumes, documents, images, job-logos)
  const subMatch = normalized.match(/(?:\/|^)(?:uploads\/)?(resumes|documents|images|job-logos)\//i);
  if (subMatch) {
    const preferredFolder = subMatch[1].toLowerCase();
    const preferredPath = path.join(env.uploadDir, preferredFolder, baseName);
    const resolvedPreferred = path.resolve(preferredPath);
    if (!resolvedPreferred.startsWith(uploadRoot)) {
      throw { statusCode: 403, message: 'Forbidden: Invalid or unauthorized file path' };
    }
    if (fs.existsSync(resolvedPreferred)) {
      return resolvedPreferred;
    }
  }

  // 2. Fallback search across all subdirectories: resumes, documents, images, job-logos
  const candidateFolders = ['resumes', 'documents', 'images', 'job-logos'];
  for (const folder of candidateFolders) {
    const candidatePath = path.join(env.uploadDir, folder, baseName);
    const resolvedCandidate = path.resolve(candidatePath);
    if (resolvedCandidate.startsWith(uploadRoot) && fs.existsSync(resolvedCandidate)) {
      return resolvedCandidate;
    }
  }

  // 3. Direct upload root fallback: backend/uploads/<baseName>
  const directPath = path.join(env.uploadDir, baseName);
  const resolvedDirect = path.resolve(directPath);
  if (resolvedDirect.startsWith(uploadRoot) && fs.existsSync(resolvedDirect)) {
    return resolvedDirect;
  }

  // 4. Absolute path check
  if (path.isAbsolute(pathOnly) && fs.existsSync(pathOnly)) {
    const resolvedAbsolute = path.resolve(pathOnly);
    if (resolvedAbsolute.startsWith(uploadRoot)) {
      return resolvedAbsolute;
    }
  }

  return null;
}

/**
 * Sanitizes an upload file path or URL for persistent DB storage.
 * Strips query strings, hashes, and ensures clean forward-slash relative paths.
 */
function sanitizeUploadPath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return null;
  const trimmed = rawPath.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const pathOnly = trimmed.split('?')[0].split('#')[0];
  const normalized = pathOnly.replace(/\\/g, '/');

  if (/^https?:\/\//i.test(normalized)) {
    try {
      const parsed = new URL(normalized);
      if (parsed.pathname.includes('/uploads/')) {
        return parsed.pathname;
      }
    } catch {}
    return normalized;
  }

  const clean = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return clean.startsWith('/uploads/') ? clean : `/uploads${clean}`;
}

module.exports = {
  resolveResumeFilePath,
  sanitizeUploadPath
};

