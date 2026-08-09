const request = require('supertest');
const app = require('../src/app');
const { generateAccessToken } = require('../src/utils/jwt.utils');
const AdminSettingService = require('../src/services/adminSetting.service');

describe('Admin Settings API Endpoints (/api/admin/settings)', () => {
  let adminToken;
  let studentToken;
  let mockSettings;

  beforeAll(() => {
    adminToken = generateAccessToken({ id: 1, email: 'admin@example.test', role: 'ADMIN' });
    studentToken = generateAccessToken({ id: 2, email: 'student@example.test', role: 'STUDENT' });

    mockSettings = {
      emailNotifications: 'true',
      autoApproval: 'false',
      maintenanceMode: 'false'
    };

    jest.spyOn(AdminSettingService, 'getAllSettings').mockImplementation(async () => mockSettings);
    jest.spyOn(AdminSettingService, 'updateSettings').mockImplementation(async (newSettings) => {
      mockSettings = { ...mockSettings, ...newSettings };
      return mockSettings;
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('GET /api/admin/settings should return 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/admin/settings');
    expect(res.statusCode).toEqual(401);
  });

  it('GET /api/admin/settings should return 403 when accessed by STUDENT role', async () => {
    const res = await request(app)
      .get('/api/admin/settings')
      .set('Cookie', [`accessToken=${studentToken}`]);
    expect(res.statusCode).toEqual(403);
  });

  it('GET /api/admin/settings should return 200 and settings map when accessed by ADMIN role', async () => {
    const res = await request(app)
      .get('/api/admin/settings')
      .set('Cookie', [`accessToken=${adminToken}`]);
    expect(res.statusCode).toEqual(200);
    expect(res.body.emailNotifications).toEqual('true');
    expect(res.body.autoApproval).toEqual('false');
  });

  it('PUT /api/admin/settings should update settings and return updated settings map', async () => {
    const res = await request(app)
      .put('/api/admin/settings')
      .set('Cookie', [`accessToken=${adminToken}`])
      .send({ autoApproval: 'true', maintenanceMode: 'true' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.autoApproval).toEqual('true');
    expect(res.body.maintenanceMode).toEqual('true');
  });

  it('PUT /api/admin/settings should return 400 when payload is an array or invalid', async () => {
    const res = await request(app)
      .put('/api/admin/settings')
      .set('Cookie', [`accessToken=${adminToken}`])
      .send(['invalid']);
    expect(res.statusCode).toEqual(400);
  });

  it('GET /api/admin/settings after update should reflect persisted changes', async () => {
    const res = await request(app)
      .get('/api/admin/settings')
      .set('Cookie', [`accessToken=${adminToken}`]);
    expect(res.statusCode).toEqual(200);
    expect(res.body.autoApproval).toEqual('true');
  });
});
