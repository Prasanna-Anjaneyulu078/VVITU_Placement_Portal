const request = require('supertest');
const app = require('../src/app');
const { generateAccessToken } = require('../src/utils/jwt.utils');
const AdminService = require('../src/services/admin.service');

jest.mock('../src/config/db', () => ({
  user: {
    findUnique: jest.fn().mockImplementation(async ({ where }) => {
      if (where.id === 1n || where.id === 1 || where.email === 'admin@example.test') return { id: 1, email: 'admin@example.test', role: 'ADMIN', accountStatus: 'ACTIVE' };
      if (where.id === 2n || where.id === 2 || where.email === 'student@example.test') return { id: 2, email: 'student@example.test', role: 'STUDENT', accountStatus: 'ACTIVE' };
      if (where.id === 3n || where.id === 3 || where.email === 'alumni@example.test') return { id: 3, email: 'alumni@example.test', role: 'ALUMNI', accountStatus: 'ACTIVE' };
      return null;
    })
  }
}));

describe('Admin Alumni Verification API Endpoints', () => {
  let adminToken;
  let studentToken;
  let alumniToken;

  beforeAll(() => {
    adminToken = generateAccessToken({ id: 1, email: 'admin@example.test', role: 'ADMIN' });
    studentToken = generateAccessToken({ id: 2, email: 'student@example.test', role: 'STUDENT' });
    alumniToken = generateAccessToken({ id: 3, email: 'alumni@example.test', role: 'ALUMNI' });

    jest.spyOn(AdminService, 'verifyAlumni').mockImplementation(async (id, status) => {
      if (id === '999') {
        throw { statusCode: 404, message: 'Alumni account not found.' };
      }
      return { success: true, message: `Alumni verification status updated to ${status}`, alumni: { id, verificationStatus: status } };
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('POST /api/admin/alumni/verify/:id should return 401 when unauthenticated', async () => {
    const res = await request(app).post('/api/admin/alumni/verify/1').send({ status: 'APPROVE' });
    expect(res.statusCode).toEqual(401);
  });

  it('POST /api/admin/alumni/verify/:id should return 403 when accessed by STUDENT role', async () => {
    const res = await request(app)
      .post('/api/admin/alumni/verify/1')
      .set('Cookie', [`accessToken=${studentToken}`])
      .send({ status: 'APPROVE' });
    expect(res.statusCode).toEqual(403);
  });

  it('POST /api/admin/alumni/verify/:id should return 403 when accessed by ALUMNI role', async () => {
    const res = await request(app)
      .post('/api/admin/alumni/verify/1')
      .set('Cookie', [`accessToken=${alumniToken}`])
      .send({ status: 'APPROVE' });
    expect(res.statusCode).toEqual(403);
  });

  it('POST /api/admin/alumni/verify/:id should return 400 for invalid action', async () => {
    const res = await request(app)
      .post('/api/admin/alumni/verify/1')
      .set('Cookie', [`accessToken=${adminToken}`])
      .send({ status: 'INVALID_ACTION' });
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toEqual('Invalid alumni verification action.');
  });

  it('POST /api/admin/alumni/verify/:id should return 404 for invalid alumni ID', async () => {
    const res = await request(app)
      .post('/api/admin/alumni/verify/999')
      .set('Cookie', [`accessToken=${adminToken}`])
      .send({ status: 'APPROVE' });
    expect(res.statusCode).toEqual(404);
  });

  it('POST /api/admin/alumni/verify/:id should return 200 on Admin approve', async () => {
    const res = await request(app)
      .post('/api/admin/alumni/verify/1')
      .set('Cookie', [`accessToken=${adminToken}`])
      .send({ status: 'APPROVE' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.alumni.verificationStatus).toEqual('VERIFIED');
  });

  it('POST /api/admin/alumni/verify/:id should return 200 on Admin reject', async () => {
    const res = await request(app)
      .post('/api/admin/alumni/verify/1')
      .set('Cookie', [`accessToken=${adminToken}`])
      .send({ status: 'REJECT' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.alumni.verificationStatus).toEqual('REJECTED');
  });
});
