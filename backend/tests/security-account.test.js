const request = require('supertest');
const express = require('express');
const authRoutes = require('../src/routes/auth.routes');
const studentRoutes = require('../src/routes/student.routes');
const alumniRoutes = require('../src/routes/alumni.routes');
const { errorHandler } = require('../src/middleware/error.middleware');
const prisma = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn()
  },
  student: {
    findUnique: jest.fn()
  },
  alumni: {
    findUnique: jest.fn()
  }
}));

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1, email: 'student@example.com', role: 'STUDENT' };
    next();
  },
  authorizeRoles: () => (req, res, next) => next()
}));

jest.mock('../src/utils/password.utils', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_new_password'),
  comparePassword: jest.fn().mockImplementation((raw) => Promise.resolve(raw === 'Current@123')),
  validatePasswordRequirements: jest.fn().mockReturnValue(true)
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/alumni', alumniRoutes);
app.use(errorHandler);

describe('Security & Account APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/change-email', () => {
    it('should change email address successfully when valid password and new email provided', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: BigInt(1),
        email: 'old.student@example.com',
        password: 'hashed_password'
      });
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.update.mockResolvedValue({
        id: BigInt(1),
        email: 'new.student@example.com'
      });

      const res = await request(app)
        .post('/api/auth/change-email')
        .send({
          newEmail: 'new.student@example.com',
          currentPassword: 'Current@123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.email).toBe('new.student@example.com');
    });

    it('should fail with 400 if current password is incorrect', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: BigInt(1),
        email: 'old.student@example.com',
        password: 'hashed_password'
      });

      const res = await request(app)
        .post('/api/auth/change-email')
        .send({
          newEmail: 'new.student@example.com',
          currentPassword: 'WrongPassword'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Current password is incorrect');
    });
  });

  describe('GET /api/student/profile and GET /api/alumni/profile account metadata', () => {
    it('should return Student createdAt and lastLogin timestamps', async () => {
      const mockDate = new Date('2026-07-19T00:00:00.000Z');
      prisma.student.findUnique.mockResolvedValue({
        id: BigInt(10),
        userId: BigInt(1),
        rollNumber: '21VV1A0501',
        department: 'CSE',
        mobileNumber: '9876543210',
        user: {
          id: BigInt(1),
          name: 'Test Student',
          email: 'student@example.com',
          role: 'STUDENT',
          accountStatus: 'ACTIVE',
          lastLogin: mockDate,
          createdAt: mockDate
        },
        skills: [],
        projects: [],
        resumes: []
      });

      const res = await request(app).get('/api/student/profile');

      expect(res.statusCode).toBe(200);
      expect(res.body.user.role).toBe('STUDENT');
      expect(res.body.account.status).toBe('ACTIVE');
      expect(res.body.account.email).toBe('student@example.com');
      expect(res.body.createdAt).toBeTruthy();
      expect(res.body.lastLogin).toBeTruthy();
    });

    it('should return Alumni createdAt and lastLogin timestamps', async () => {
      const mockDate = new Date('2026-07-19T00:00:00.000Z');
      prisma.alumni.findUnique.mockResolvedValue({
        id: BigInt(12),
        userId: BigInt(1),
        company: 'Google',
        designation: 'Software Engineer',
        user: {
          id: BigInt(1),
          name: 'Test Alumni',
          email: 'alumni@example.com',
          role: 'ALUMNI',
          accountStatus: 'ACTIVE',
          lastLogin: mockDate,
          createdAt: mockDate
        }
      });

      const res = await request(app).get('/api/alumni/profile');

      expect(res.statusCode).toBe(200);
      expect(res.body.role).toBe('ALUMNI');
      expect(res.body.accountStatus).toBe('ACTIVE');
      expect(res.body.createdAt).toBeTruthy();
      expect(res.body.lastLogin).toBeTruthy();
    });
  });
});
