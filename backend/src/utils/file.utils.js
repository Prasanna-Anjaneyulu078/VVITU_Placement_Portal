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

  // Normalize slashes and extract basename
  const normalized = String(storedPath).replace(/\\/g, '/');
  const baseName = path.basename(normalized);
  if (!baseName) {
    return null;
  }

  const uploadRoot = path.resolve(env.uploadDir);

  // 1. Primary canonical location: backend/uploads/resumes/<baseName>
  const canonicalPath = path.join(env.uploadDir, 'resumes', baseName);
  const resolvedCanonical = path.resolve(canonicalPath);

  // Security check: ensure path does not escape upload root
  if (!resolvedCanonical.startsWith(uploadRoot)) {
    throw { statusCode: 403, message: 'Forbidden: Invalid or unauthorized file path' };
  }

  if (fs.existsSync(resolvedCanonical)) {
    return resolvedCanonical;
  }

  // 2. Fallback location: backend/uploads/documents/<baseName>
  const docPath = path.join(env.uploadDir, 'documents', baseName);
  const resolvedDoc = path.resolve(docPath);
  if (resolvedDoc.startsWith(uploadRoot) && fs.existsSync(resolvedDoc)) {
    return resolvedDoc;
  }

  // 3. Direct upload root fallback: backend/uploads/<baseName>
  const directPath = path.join(env.uploadDir, baseName);
  const resolvedDirect = path.resolve(directPath);
  if (resolvedDirect.startsWith(uploadRoot) && fs.existsSync(resolvedDirect)) {
    return resolvedDirect;
  }

  // 4. Absolute path check
  if (path.isAbsolute(storedPath) && fs.existsSync(storedPath)) {
    const resolvedAbsolute = path.resolve(storedPath);
    if (resolvedAbsolute.startsWith(uploadRoot)) {
      return resolvedAbsolute;
    }
  }

  return null;
}

module.exports = {
  resolveResumeFilePath
};
