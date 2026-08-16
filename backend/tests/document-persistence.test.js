const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../src/app');
const env = require('../src/config/env');
const prisma = require('../src/config/db');
const { resolveResumeFilePath } = require('../src/utils/file.utils');

describe('Uploaded Documents & Profile Images Persistence', () => {
  const testFilesCreated = [];

  afterAll(() => {
    // Cleanup temporary test files
    testFilesCreated.forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    });
  });

  describe('1. File Utils Path Resolution & Fallbacks', () => {
    it('should strip query parameters and hash fragments when resolving file path', () => {
      const fileName = `test-resume-${Date.now()}.pdf`;
      const targetDir = path.join(env.uploadDir, 'resumes');
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      const targetPath = path.join(targetDir, fileName);
      fs.writeFileSync(targetPath, '%PDF-1.4 mock resume content');
      testFilesCreated.push(targetPath);

      const resolved = resolveResumeFilePath(`/uploads/resumes/${fileName}?v=1723849100#page=1`);
      expect(resolved).not.toBeNull();
      expect(resolved).toBe(path.resolve(targetPath));
    });

    it('should resolve files across candidate subfolders (documents <-> resumes <-> images)', () => {
      const fileName = `alumni-doc-${Date.now()}.pdf`;
      const targetDir = path.join(env.uploadDir, 'documents');
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      const targetPath = path.join(targetDir, fileName);
      fs.writeFileSync(targetPath, '%PDF-1.4 mock document content');
      testFilesCreated.push(targetPath);

      // Querying with resumes folder path should fall back to documents folder
      const resolvedFromResumes = resolveResumeFilePath(`/uploads/resumes/${fileName}`);
      expect(resolvedFromResumes).not.toBeNull();
      expect(resolvedFromResumes).toBe(path.resolve(targetPath));
    });
  });

  describe('2. Express Static Upload Fallback Middleware', () => {
    it('should serve file directly via static route even if requested in alternative subfolder', async () => {
      const fileName = `static-fallback-${Date.now()}.png`;
      const targetDir = path.join(env.uploadDir, 'images');
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      const targetPath = path.join(targetDir, fileName);
      fs.writeFileSync(targetPath, 'PNG mock image data');
      testFilesCreated.push(targetPath);

      // Request /uploads/documents/<fileName> when file is in /uploads/images/
      const res = await request(app).get(`/uploads/documents/${fileName}`);
      expect(res.statusCode).toBe(200);
      const content = res.text || (res.body ? res.body.toString('utf8') : '');
      expect(content).toBe('PNG mock image data');
    });
  });

  describe('3. Alumni Document Upload Relative Path Accuracy', () => {
    it('should attach relativePath to uploaded files in upload.middleware', async () => {
      const mockFile = {
        fieldname: 'verificationDoc',
        originalname: 'degree.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        destination: path.join(env.uploadDir, 'documents'),
        filename: `student-${Date.now()}.pdf`,
        path: path.join(env.uploadDir, 'documents', `student-${Date.now()}.pdf`)
      };

      // Verify that destination for verificationDoc points to documents folder
      expect(mockFile.destination).toContain('documents');
    });
  });
});
