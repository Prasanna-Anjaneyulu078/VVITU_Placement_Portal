const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

const adminRoutes = require('../src/routes/admin.routes');
const { errorHandler } = require('../src/middleware/error.middleware');
const prisma = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  student: {
    findUnique: jest.fn()
  },
  resume: {
    findFirst: jest.fn()
  }
}));

let mockUserRole = 'ADMIN';

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticateToken: (req, res, next) => {
    if (!mockUserRole) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = { id: 99, email: 'admin@example.com', role: mockUserRole };
    next();
  },
  authorizeRoles: (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

describe('Admin Student Resume View & Download', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRole = 'ADMIN';
  });

  describe('Authorization checks', () => {
    it('should return 401 when unauthenticated', async () => {
      mockUserRole = null;
      const res = await request(app).get('/api/admin/users/students/10/resume/view');
      expect(res.statusCode).toBe(401);
    });

    it('should return 403 for STUDENT role', async () => {
      mockUserRole = 'STUDENT';
      const res = await request(app).get('/api/admin/users/students/10/resume/view');
      expect(res.statusCode).toBe(403);
    });

    it('should return 403 for ALUMNI role', async () => {
      mockUserRole = 'ALUMNI';
      const res = await request(app).get('/api/admin/users/students/10/resume/view');
      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/admin/users/students/:id/resume/view', () => {
    it('should return 404 when student does not exist', async () => {
      prisma.student.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/admin/users/students/999/resume/view');
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Student not found');
    });

    it('should return 404 when student has not uploaded a resume', async () => {
      prisma.student.findUnique.mockResolvedValue({ id: BigInt(10), userId: BigInt(1), rollNumber: '21VV1A0501' });
      prisma.resume.findFirst.mockResolvedValue(null);

      const res = await request(app).get('/api/admin/users/students/10/resume/view');
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Student has not uploaded a resume');
    });

    it('should return 404 when resume database record exists but physical file is missing', async () => {
      prisma.student.findUnique.mockResolvedValue({ id: BigInt(10), userId: BigInt(1), rollNumber: '21VV1A0501' });
      prisma.resume.findFirst.mockResolvedValue({
        id: BigInt(50),
        studentId: BigInt(10),
        filePath: '/uploads/resumes/non_existent_file_9999.pdf',
        fileName: 'Missing.pdf',
        fileType: 'application/pdf'
      });

      const res = await request(app).get('/api/admin/users/students/10/resume/view');
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Resume file is missing from storage');
    });
  });
});
