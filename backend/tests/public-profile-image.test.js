const request = require('supertest');
const express = require('express');
const publicRoutes = require('../src/routes/public.routes');
const prisma = require('../src/config/db');

// Mock prisma
jest.mock('../src/config/db', () => ({
  alumni: { findUnique: jest.fn() },
  student: { findUnique: jest.fn() },
  adminProfile: { findUnique: jest.fn() },
  user: { findUnique: jest.fn() }
}));

const app = express();
app.use(express.json());
app.use('/api/public', publicRoutes);

describe('Public Profile Image Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/public/alumni/:id/profile-image', () => {
    it('should return 404 if alumni not found', async () => {
      prisma.alumni.findUnique.mockResolvedValue(null);
      const res = await request(app).get('/api/public/alumni/1/profile-image');
      expect(res.statusCode).toBe(404);
    });

    it('should return 404 if no profile image exists', async () => {
      prisma.alumni.findUnique.mockResolvedValue({ id: 1, profileImageUrl: null, user: { name: 'John Doe' } });
      const res = await request(app).get('/api/public/alumni/1/profile-image');
      expect(res.statusCode).toBe(404);
    });

    it('should stream base64 data as binary if legacy data URI is in DB', async () => {
      const base64Data = Buffer.from('fake-image-data').toString('base64');
      const dataUri = `data:image/png;base64,${base64Data}`;
      prisma.alumni.findUnique.mockResolvedValue({ id: 1, profileImageUrl: dataUri, user: { name: 'John Doe' } });
      const res = await request(app).get('/api/public/alumni/1/profile-image');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('image/png');
      expect(res.body.toString()).toBe('fake-image-data');
    });
  });

  describe('GET /api/public/student/:id/profile-image', () => {
    it('should return 404 if student not found', async () => {
      prisma.student.findUnique.mockResolvedValue(null);
      const res = await request(app).get('/api/public/student/1/profile-image');
      expect(res.statusCode).toBe(404);
    });
    
    it('should return 404 if no profile image exists', async () => {
      prisma.student.findUnique.mockResolvedValue({ id: 1, profileImageUrl: null, user: { name: 'Jane Doe' } });
      const res = await request(app).get('/api/public/student/1/profile-image');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/public/admin/:id/profile-image', () => {
    it('should return 404 if admin not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const res = await request(app).get('/api/public/admin/1/profile-image');
      expect(res.statusCode).toBe(404);
    });
    
    it('should return 404 if no profile image exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, role: 'ADMIN' });
      prisma.adminProfile.findUnique.mockResolvedValue({ userId: 1, profileImageUrl: null });
      const res = await request(app).get('/api/public/admin/1/profile-image');
      expect(res.statusCode).toBe(404);
    });
  });
});
