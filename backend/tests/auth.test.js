const request = require('supertest');
const app = require('../src/app');
const AuthService = require('../src/services/auth.service');

describe('Authentication API Endpoints - POST /api/auth/login', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Test 1 — Valid login returns 200, correct contract fields, and cookies', async () => {
    jest.spyOn(AuthService, 'login').mockResolvedValue({
      accessToken: 'mock_access_token_123',
      refreshToken: 'mock_refresh_token_123',
      user: {
        id: 1,
        name: 'Student User',
        email: 'student@vvit.net',
        role: 'STUDENT',
        verificationStatus: 'VERIFIED'
      }
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@vvit.net', password: 'Password@123' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.role).toBe('STUDENT');
    expect(res.body.name).toBe('Student User');
    expect(res.body.email).toBe('student@vvit.net');
    expect(res.body.verificationStatus).toBe('VERIFIED');
    expect(res.body.id).toBe(1);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'].some(c => c.includes('accessToken'))).toBe(true);
  });

  it('Test 2 — Wrong password returns 401', async () => {
    jest.spyOn(AuthService, 'login').mockRejectedValue({
      statusCode: 401,
      message: 'Invalid email or password. Please check your credentials and try again.'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@vvit.net', password: 'WrongPassword' });

    expect(res.statusCode).toEqual(401);
  });

  it('Test 3 — Unknown user returns 401', async () => {
    jest.spyOn(AuthService, 'login').mockRejectedValue({
      statusCode: 401,
      message: 'Invalid email or password. Please check your credentials and try again.'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@vvit.net', password: 'Password@123' });

    expect(res.statusCode).toEqual(401);
  });

  it('Test 4 — Missing password returns 400', async () => {
    jest.spyOn(AuthService, 'login').mockRejectedValue({
      statusCode: 400,
      message: 'Email and password are required'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@vvit.net' });

    expect(res.statusCode).toEqual(400);
  });

  it('Test 5 — Missing email returns 400', async () => {
    jest.spyOn(AuthService, 'login').mockRejectedValue({
      statusCode: 400,
      message: 'Email and password are required'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Password@123' });

    expect(res.statusCode).toEqual(400);
  });

  it('Test 6 — Blocked/inactive user returns 401', async () => {
    jest.spyOn(AuthService, 'login').mockRejectedValue({
      statusCode: 401,
      message: 'Your account is disabled or blocked. Please contact admin.'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'blocked@vvit.net', password: 'Password@123' });

    expect(res.statusCode).toEqual(401);
  });

  it('Test 7 — Server/Database error returns 500 without leaking credentials or stack traces', async () => {
    jest.spyOn(AuthService, 'login').mockRejectedValue(new Error('Database connection failed'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@vvit.net', password: 'Password@123' });

    expect(res.statusCode).toEqual(500);
    expect(res.body.password).toBeUndefined();
    expect(res.body.stack).toBeUndefined();
  });

  it('Test 8 — comparePassword should correctly verify Spring Security {bcrypt} and {noop} prefixes', async () => {
    const { comparePassword, hashPassword } = require('../src/utils/password.utils');
    const plain = 'Secret@123';
    const standardHash = await hashPassword(plain);
    const springBcryptHash = `{bcrypt}${standardHash}`;
    const springNoopHash = `{noop}${plain}`;

    expect(await comparePassword(plain, standardHash)).toBe(true);
    expect(await comparePassword(plain, springBcryptHash)).toBe(true);
    expect(await comparePassword(plain, springNoopHash)).toBe(true);
    expect(await comparePassword('WrongPass', springBcryptHash)).toBe(false);
  });
});
