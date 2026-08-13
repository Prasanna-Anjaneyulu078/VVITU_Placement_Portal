const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

const studentRoutes = require('../src/routes/student.routes');
const resumeRoutes = require('../src/routes/resume.routes');
const { errorHandler } = require('../src/middleware/error.middleware');
const prisma = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  student: {
    findUnique: jest.fn()
  },
  resume: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  studentSkill: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1, email: 'student@example.com', role: 'STUDENT' };
    next();
  },
  authorizeRoles: () => (req, res, next) => next()
}));

const app = express();
app.use(express.json());
app.use('/api/student', studentRoutes);
app.use('/api/resumes', resumeRoutes);
app.use(errorHandler);

describe('Resume / CV Module End-to-End Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/student/resume/upload', () => {
    it('should reject invalid file types with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/student/resume/upload')
        .attach('file', Buffer.from('console.log("bad")'), 'malicious.exe');

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Unsupported file type');
    });

    it('should upload resume successfully when valid PDF file provided', async () => {
      prisma.student.findUnique.mockResolvedValue({
        id: BigInt(10),
        userId: BigInt(1),
        rollNumber: '21VV1A0501'
      });
      prisma.resume.findFirst.mockResolvedValue(null);
      prisma.resume.create.mockResolvedValue({
        id: BigInt(100),
        studentId: BigInt(10),
        filePath: '/uploads/resumes/student-test.pdf',
        fileName: 'My_Resume.pdf',
        fileType: 'application/pdf',
        uploadedAt: new Date()
      });
      prisma.studentSkill.findFirst.mockResolvedValue(null);
      prisma.studentSkill.findMany.mockResolvedValue([]);

      const fakePdfBuffer = Buffer.from('%PDF-1.4 Fake PDF Content for test JavaScript React Node.js SQL');
      const res = await request(app)
        .post('/api/student/resume/upload')
        .attach('file', fakePdfBuffer, 'My_Resume.pdf');

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.resume.fileName).toBe('My_Resume.pdf');
    });

    it('should upload resume successfully when valid DOCX file provided', async () => {
      prisma.student.findUnique.mockResolvedValue({
        id: BigInt(10),
        userId: BigInt(1),
        rollNumber: '21VV1A0501'
      });
      prisma.resume.findFirst.mockResolvedValue(null);
      prisma.resume.create.mockResolvedValue({
        id: BigInt(101),
        studentId: BigInt(10),
        filePath: '/uploads/resumes/student-test.docx',
        fileName: 'My_Resume.docx',
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadedAt: new Date()
      });
      prisma.studentSkill.findFirst.mockResolvedValue(null);
      prisma.studentSkill.findMany.mockResolvedValue([]);

      const fakeDocxBuffer = Buffer.from('PK123 Fake DOCX Content Python Java React Express SQL');
      const res = await request(app)
        .post('/api/student/resume/upload')
        .attach('file', fakeDocxBuffer, 'My_Resume.docx');

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.resume.fileName).toBe('My_Resume.docx');
    });
  });

  describe('GET /api/student/resume/details', () => {
    it('should return resume details when student has resume', async () => {
      prisma.student.findUnique.mockResolvedValue({
        id: BigInt(10),
        userId: BigInt(1)
      });
      prisma.resume.findFirst.mockResolvedValue({
        id: BigInt(100),
        studentId: BigInt(10),
        filePath: '/uploads/resumes/student-test.pdf',
        fileName: 'My_Resume.pdf',
        fileType: 'application/pdf',
        uploadedAt: new Date()
      });

      const res = await request(app).get('/api/student/resume/details');

      expect(res.statusCode).toBe(200);
      expect(res.body.hasResume).toBe(true);
      expect(res.body.fileName).toBe('My_Resume.pdf');
    });
  });

  describe('GET /api/student/resume/view 404 behavior', () => {
    it('should return 404 when no resume record exists in database', async () => {
      prisma.student.findUnique.mockResolvedValue({
        id: BigInt(10),
        userId: BigInt(1)
      });
      prisma.resume.findFirst.mockResolvedValue(null);

      const res = await request(app).get('/api/student/resume/view');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('No resume uploaded');
    });

    it('should return 404 when database record exists but physical file is missing', async () => {
      prisma.student.findUnique.mockResolvedValue({
        id: BigInt(10),
        userId: BigInt(1),
        rollNumber: '21VV1A0501'
      });
      prisma.resume.findFirst.mockResolvedValue({
        id: BigInt(100),
        studentId: BigInt(10),
        filePath: '/uploads/resumes/non_existent_file_99999.pdf',
        fileName: 'Missing.pdf',
        fileType: 'application/pdf'
      });

      const res = await request(app).get('/api/student/resume/view');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Resume file missing from storage');
    });
  });
});
