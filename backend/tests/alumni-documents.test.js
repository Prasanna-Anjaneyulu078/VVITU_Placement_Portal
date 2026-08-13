const request = require('supertest');
const express = require('express');
const alumniRoutes = require('../src/routes/alumni.routes');
const prisma = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  alumni: { findUnique: jest.fn() },
}));

const fs = require('fs');
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  createReadStream: jest.fn()
}));

const fileUtils = require('../src/utils/file.utils');
jest.mock('../src/utils/file.utils', () => ({
  resolveResumeFilePath: jest.fn()
}));

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1, role: 'ALUMNI' };
    next();
  },
  authorizeRoles: (...roles) => (req, res, next) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden' });
    }
  }
}));

const app = express();
app.use(express.json());

app.use('/api/alumni', alumniRoutes);

describe('Alumni Document Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/alumni/documents/my-document', () => {
    it('should return 404 if alumni not found', async () => {
      prisma.alumni.findUnique.mockResolvedValue(null);
      const res = await request(app).get('/api/alumni/documents/my-document');
      expect(res.statusCode).toBe(404);
    });

    it('should return 404 if verificationDocumentUrl is missing', async () => {
      prisma.alumni.findUnique.mockResolvedValue({ id: 1, verificationDocumentUrl: null });
      const res = await request(app).get('/api/alumni/documents/my-document');
      expect(res.statusCode).toBe(404);
    });

    it('should return document metadata on success', async () => {
      prisma.alumni.findUnique.mockResolvedValue({ 
        id: 1, 
        verificationDocumentUrl: 'doc.pdf',
        verificationDocumentName: 'My_Doc.pdf',
        verificationDocumentUploadDate: '2026-08-12T12:17:08.903Z'
      });
      const res = await request(app).get('/api/alumni/documents/my-document');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.documentName).toBe('My_Doc.pdf');
      expect(res.body.url).toBe('/api/alumni/documents/my-document/file');
    });
  });

  describe('GET /api/alumni/documents/my-document/file', () => {
    it('should return 404 if verificationDocumentUrl is missing', async () => {
      prisma.alumni.findUnique.mockResolvedValue({ id: 1, verificationDocumentUrl: null });
      const res = await request(app).get('/api/alumni/documents/my-document/file');
      expect(res.statusCode).toBe(404);
    });

    it('should return 404 if file is missing from storage', async () => {
      prisma.alumni.findUnique.mockResolvedValue({ id: 1, verificationDocumentUrl: 'fake.pdf' });
      fileUtils.resolveResumeFilePath.mockReturnValue('C:\\uploads\\fake.pdf');
      fs.existsSync.mockReturnValue(false);

      const res = await request(app).get('/api/alumni/documents/my-document/file');
      expect(res.statusCode).toBe(404);
    });
  });
});
