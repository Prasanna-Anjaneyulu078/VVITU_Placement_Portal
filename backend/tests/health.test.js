const request = require('supertest');
const app = require('../src/app');

describe('Server API Endpoints', () => {
  it('GET /api/health should return HTTP 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('healthy');
  });

  it('GET /api/departments should return list of departments', async () => {
    const res = await request(app).get('/api/departments');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
