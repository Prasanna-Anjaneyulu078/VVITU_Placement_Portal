const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../src/app');
const StudentService = require('../src/services/student.service');
const { sanitizeUploadPath, resolveResumeFilePath } = require('../src/utils/file.utils');

describe('File Persistence Regression & Integrity Tests', () => {
  describe('1. sanitizeUploadPath Utility', () => {
    it('should strip query parameters and hash fragments from file URLs', () => {
      const input = '/uploads/images/photo.jpg?v=1787030904712#top';
      const clean = sanitizeUploadPath(input);
      expect(clean).toBe('/uploads/images/photo.jpg');
    });

    it('should handle full HTTP URLs with /uploads/ path', () => {
      const input = 'http://localhost:8082/uploads/documents/resume.pdf?v=123';
      const clean = sanitizeUploadPath(input);
      expect(clean).toBe('/uploads/documents/resume.pdf');
    });

    it('should normalize bare filenames into relative upload paths', () => {
      const input = 'images/avatar.png';
      const clean = sanitizeUploadPath(input);
      expect(clean).toBe('/uploads/images/avatar.png');
    });

    it('should return null for invalid/empty inputs', () => {
      expect(sanitizeUploadPath('')).toBeNull();
      expect(sanitizeUploadPath(null)).toBeNull();
      expect(sanitizeUploadPath(undefined)).toBeNull();
      expect(sanitizeUploadPath('null')).toBeNull();
    });
  });

  describe('2. Path Resolution & Fallbacks', () => {
    it('should resolve files across candidate folders even with query params', () => {
      const fileName = `reg-test-${Date.now()}.pdf`;
      const env = require('../src/config/env');
      const targetDir = path.join(env.uploadDir, 'documents');
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      const targetPath = path.join(targetDir, fileName);
      fs.writeFileSync(targetPath, '%PDF-1.4 mock document');

      try {
        const resolved = resolveResumeFilePath(`/uploads/resumes/${fileName}?v=999`);
        expect(resolved).not.toBeNull();
        expect(resolved).toBe(path.resolve(targetPath));
      } finally {
        if (fs.existsSync(targetPath)) {
          try { fs.unlinkSync(targetPath); } catch (e) {}
        }
      }
    });
  });
});
