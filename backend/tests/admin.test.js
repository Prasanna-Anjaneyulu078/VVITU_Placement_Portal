const request = require('supertest');
const app = require('../src/app');
const { generateAccessToken } = require('../src/utils/jwt.utils');
const AdminService = require('../src/services/admin.service');

describe('Admin User Management API Endpoints', () => {
  let adminToken;
  let studentToken;

  beforeAll(() => {
    adminToken = generateAccessToken({ id: 1, email: 'admin@vvit.ac.in', role: 'ADMIN' });
    studentToken = generateAccessToken({ id: 2, email: 'student@vvit.ac.in', role: 'STUDENT' });

    jest.spyOn(AdminService, 'getAllStudents').mockResolvedValue([
      { id: 1, name: 'John Doe', email: 'john@vvit.ac.in', rollNumber: '218X1A0501' }
    ]);

    jest.spyOn(AdminService, 'deleteStudent').mockImplementation(async (id) => {
      if (id === '999') {
        throw { statusCode: 404, message: 'Student account not found.' };
      }
      return { success: true, message: 'Student account has been permanently deleted.' };
    });

    jest.spyOn(AdminService, 'resetStudentPassword').mockImplementation(async (id) => {
      if (id === '999') {
        throw { statusCode: 404, message: 'Student account not found.' };
      }
      return {
        name: 'John Doe',
        email: 'john@vvit.ac.in',
        password: 'vvitu@210501',
        temporaryPassword: 'vvitu@210501',
        rollNumber: '218X1A0501'
      };
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('GET /api/admin/users/students should return 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/admin/users/students');
    expect(res.statusCode).toEqual(401);
  });

  it('GET /api/admin/users/students should return 403 when accessed by STUDENT role', async () => {
    const res = await request(app)
      .get('/api/admin/users/students')
      .set('Cookie', [`accessToken=${studentToken}`]);
    expect(res.statusCode).toEqual(403);
  });

  it('GET /api/admin/users/students should return 200 and student list when accessed by ADMIN role', async () => {
    const res = await request(app)
      .get('/api/admin/users/students')
      .set('Cookie', [`accessToken=${adminToken}`]);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toEqual(1);
    expect(res.body[0].rollNumber).toEqual('218X1A0501');
  });

  it('DELETE /api/admin/users/students/:id should return 401 when unauthenticated', async () => {
    const res = await request(app).delete('/api/admin/users/students/1');
    expect(res.statusCode).toEqual(401);
  });

  it('DELETE /api/admin/users/students/:id should return 403 when accessed by non-admin STUDENT', async () => {
    const res = await request(app)
      .delete('/api/admin/users/students/1')
      .set('Cookie', [`accessToken=${studentToken}`]);
    expect(res.statusCode).toEqual(403);
  });

  it('DELETE /api/admin/users/students/:id should return 404 when student does not exist', async () => {
    const res = await request(app)
      .delete('/api/admin/users/students/999')
      .set('Cookie', [`accessToken=${adminToken}`]);
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual('Student account not found.');
  });

  it('DELETE /api/admin/users/students/:id should return 200 and success message when deleted by ADMIN', async () => {
    const res = await request(app)
      .delete('/api/admin/users/students/1')
      .set('Cookie', [`accessToken=${adminToken}`]);
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toEqual('Student account has been permanently deleted.');
  });

  it('DELETE /api/admin/students/:id (alias) should also return 200 when deleted by ADMIN', async () => {
    const res = await request(app)
      .delete('/api/admin/students/1')
      .set('Cookie', [`accessToken=${adminToken}`]);
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/admin/users/students/:id/reset-password should return 401 when unauthenticated', async () => {
    const res = await request(app).post('/api/admin/users/students/1/reset-password');
    expect(res.statusCode).toEqual(401);
  });

  it('POST /api/admin/users/students/:id/reset-password should return 403 when accessed by non-admin STUDENT', async () => {
    const res = await request(app)
      .post('/api/admin/users/students/1/reset-password')
      .set('Cookie', [`accessToken=${studentToken}`]);
    expect(res.statusCode).toEqual(403);
  });

  it('POST /api/admin/users/students/:id/reset-password should return 404 when student does not exist', async () => {
    const res = await request(app)
      .post('/api/admin/users/students/999/reset-password')
      .set('Cookie', [`accessToken=${adminToken}`]);
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual('Student account not found.');
  });

  it('POST /api/admin/users/students/:id/reset-password should return 200 and UserCredentialsResponse when reset by ADMIN', async () => {
    const res = await request(app)
      .post('/api/admin/users/students/1/reset-password')
      .set('Cookie', [`accessToken=${adminToken}`]);
    expect(res.statusCode).toEqual(200);
    expect(res.body.email).toEqual('john@vvit.ac.in');
    expect(res.body.password).toEqual('vvitu@210501');
    expect(res.body.rollNumber).toEqual('218X1A0501');
  });

  it('POST /api/admin/students/:id/reset-password (alias) should also return 200 when reset by ADMIN', async () => {
    const res = await request(app)
      .post('/api/admin/students/1/reset-password')
      .set('Cookie', [`accessToken=${adminToken}`]);
    expect(res.statusCode).toEqual(200);
    expect(res.body.password).toEqual('vvitu@210501');
  });
});
