const request = require('supertest');
const app = require('../src/app');
const { generateAccessToken } = require('../src/utils/jwt.utils');
const SuperAdminService = require('../src/services/superAdmin.service');

describe('SuperAdmin Management API Endpoints (/api/super-admin/admins)', () => {
  let superAdminToken;
  let adminToken;
  let studentToken;

  beforeAll(() => {
    superAdminToken = generateAccessToken({ id: 100, email: 'superadmin@vvit.edu.in', role: 'SUPER_ADMIN' });
    adminToken = generateAccessToken({ id: 1, email: 'admin@example.test', role: 'ADMIN' });
    studentToken = generateAccessToken({ id: 2, email: 'student@example.test', role: 'STUDENT' });

    jest.spyOn(SuperAdminService, 'getAllAdmins').mockResolvedValue([
      { id: 1, name: 'System Admin', email: 'admin@example.test', role: 'ADMIN', accountStatus: 'ACTIVE' }
    ]);

    jest.spyOn(SuperAdminService, 'getAdminById').mockImplementation(async (id) => {
      if (id === '999') throw { statusCode: 404, message: 'Admin profile not found with ID: 999' };
      return { id: 1, name: 'System Admin', email: 'admin@example.test', role: 'ADMIN', accountStatus: 'ACTIVE' };
    });

    jest.spyOn(SuperAdminService, 'createAdmin').mockResolvedValue({
      name: 'New Admin',
      email: 'newadmin@example.test',
      password: 'VVIT@Admin123',
      role: 'ADMIN'
    });

    jest.spyOn(SuperAdminService, 'toggleAdminStatus').mockResolvedValue({
      id: 1,
      name: 'System Admin',
      accountStatus: 'BLOCKED'
    });

    jest.spyOn(SuperAdminService, 'resetAdminPassword').mockResolvedValue({
      name: 'System Admin',
      email: 'admin@example.test',
      password: 'VVIT@Admin456'
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('GET /api/super-admin/admins should return 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/super-admin/admins');
    expect(res.statusCode).toEqual(401);
  });

  it('GET /api/super-admin/admins should return 403 when accessed by regular ADMIN role (prevents privilege escalation)', async () => {
    const res = await request(app)
      .get('/api/super-admin/admins')
      .set('Cookie', [`accessToken=${adminToken}`]);
    expect(res.statusCode).toEqual(403);
  });

  it('GET /api/super-admin/admins should return 403 when accessed by STUDENT role', async () => {
    const res = await request(app)
      .get('/api/super-admin/admins')
      .set('Cookie', [`accessToken=${studentToken}`]);
    expect(res.statusCode).toEqual(403);
  });

  it('GET /api/super-admin/admins should return 200 and list when accessed by SUPER_ADMIN role', async () => {
    const res = await request(app)
      .get('/api/super-admin/admins')
      .set('Cookie', [`accessToken=${superAdminToken}`]);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].email).toEqual('admin@example.test');
  });

  it('POST /api/super-admin/admins should return 200 and created admin credentials when called by SUPER_ADMIN', async () => {
    const res = await request(app)
      .post('/api/super-admin/admins')
      .set('Cookie', [`accessToken=${superAdminToken}`])
      .send({ name: 'New Admin', email: 'newadmin@example.test' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.email).toEqual('newadmin@example.test');
  });

  it('PUT /api/super-admin/admins/1/status should return 200 and updated status', async () => {
    const res = await request(app)
      .put('/api/super-admin/admins/1/status?status=BLOCKED')
      .set('Cookie', [`accessToken=${superAdminToken}`]);
    expect(res.statusCode).toEqual(200);
    expect(res.body.accountStatus).toEqual('BLOCKED');
  });

  it('POST /api/super-admin/admins/1/reset-password should return 200 and new temporary password', async () => {
    const res = await request(app)
      .post('/api/super-admin/admins/1/reset-password')
      .set('Cookie', [`accessToken=${superAdminToken}`]);
    expect(res.statusCode).toEqual(200);
    expect(res.body.password).toEqual('VVIT@Admin456');
  });
});
