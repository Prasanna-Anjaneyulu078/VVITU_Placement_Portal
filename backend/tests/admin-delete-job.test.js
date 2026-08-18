const request = require('supertest');
const express = require('express');

const jobRoutes = require('../src/routes/job.routes');
const { errorHandler } = require('../src/middleware/error.middleware');
const prisma = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  job: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  alumni: {
    findUnique: jest.fn()
  }
}));

let mockUserRole = 'ADMIN';

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticateToken: (req, res, next) => {
    if (!mockUserRole) {
      return res.status(401).json({ message: 'Access token missing or invalid' });
    }
    req.user = { id: 99, email: 'admin@vvit.edu.in', role: mockUserRole };
    next();
  },
  authorizeRoles: (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient role permissions' });
    }
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/jobs', jobRoutes);
app.use(errorHandler);

describe('DELETE /api/jobs/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRole = 'ADMIN';
  });

  describe('Authorization checks', () => {
    it('should return 401 when unauthenticated', async () => {
      mockUserRole = null;
      const res = await request(app).delete('/api/jobs/10');
      expect(res.statusCode).toBe(401);
    });

    it('should return 403 when user is STUDENT', async () => {
      mockUserRole = 'STUDENT';
      const res = await request(app).delete('/api/jobs/10');
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should allow ADMIN to delete any job', async () => {
      mockUserRole = 'ADMIN';
      prisma.job.findUnique.mockResolvedValue({
        id: BigInt(10),
        title: 'Software Engineer',
        companyName: 'Tech Corp',
        deletedAt: null
      });
      prisma.job.update.mockResolvedValue({
        id: BigInt(10),
        deletedAt: new Date()
      });

      const res = await request(app).delete('/api/jobs/10');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Job deleted successfully');
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: BigInt(10) },
        data: { deletedAt: expect.any(Date) }
      });
    });

    it('should allow SUPER_ADMIN to delete any job', async () => {
      mockUserRole = 'SUPER_ADMIN';
      prisma.job.findUnique.mockResolvedValue({
        id: BigInt(15),
        title: 'Lead Architect',
        companyName: 'Global Inc',
        deletedAt: null
      });
      prisma.job.update.mockResolvedValue({
        id: BigInt(15),
        deletedAt: new Date()
      });

      const res = await request(app).delete('/api/jobs/15');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Job deleted successfully');
    });
  });

  describe('Input & Error checks', () => {
    it('should return 400 when job ID format is invalid', async () => {
      mockUserRole = 'ADMIN';
      const res = await request(app).delete('/api/jobs/invalid-id');
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid job ID format');
    });

    it('should return 404 when job does not exist', async () => {
      mockUserRole = 'ADMIN';
      prisma.job.findUnique.mockResolvedValue(null);

      const res = await request(app).delete('/api/jobs/999999');
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Job not found');
    });

    it('should return 404 when job is already soft-deleted', async () => {
      mockUserRole = 'ADMIN';
      prisma.job.findUnique.mockResolvedValue({
        id: BigInt(20),
        title: 'Old Job',
        deletedAt: new Date()
      });

      const res = await request(app).delete('/api/jobs/20');
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Job not found');
    });
  });
});
