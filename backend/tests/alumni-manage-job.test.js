const request = require('supertest');
const app = require('../src/app');
const JobService = require('../src/services/job.service');
const ApplicationService = require('../src/services/application.service');
const jwtUtils = require('../src/utils/jwt.utils');
const prisma = require('../src/config/db');

describe('Alumni Manage Job Endpoints — GET /api/alumni/jobs/:jobId/statistics & GET /api/applications/job/:jobId', () => {
  let alumniToken;
  let otherAlumniToken;

  beforeAll(() => {
    alumniToken = jwtUtils.generateAccessToken({ id: 50, email: 'alumni_owner@example.test', role: 'ALUMNI' });
    otherAlumniToken = jwtUtils.generateAccessToken({ id: 51, email: 'alumni_other@example.test', role: 'ALUMNI' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GET /api/alumni/jobs/:jobId/statistics — returns 200 and statistics for authorized alumni owner', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 50,
      email: 'alumni_owner@example.test',
      role: 'ALUMNI',
      accountStatus: 'ACTIVE',
      deletedAt: null
    });

    jest.spyOn(prisma.alumni, 'findUnique').mockResolvedValue({
      id: 10,
      userId: 50
    });

    jest.spyOn(prisma.job, 'findUnique').mockResolvedValue({
      id: 4,
      postedByAlumniId: 10,
      openings: 5,
      deletedAt: null
    });

    jest.spyOn(JobService, 'getJobStatistics').mockResolvedValue({
      jobId: 4,
      total: 10,
      eligible: 7,
      shortlisted: 3,
      selected: 1,
      rejected: 2
    });

    const res = await request(app)
      .get('/api/alumni/jobs/4/statistics')
      .set('Authorization', `Bearer ${alumniToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(10);
    expect(res.body.eligible).toBe(7);
  });

  it('GET /api/alumni/jobs/:jobId/statistics — returns 403 Forbidden when requested by another alumni', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 51,
      email: 'alumni_other@example.test',
      role: 'ALUMNI',
      accountStatus: 'ACTIVE',
      deletedAt: null
    });

    jest.spyOn(prisma.alumni, 'findUnique').mockResolvedValue({
      id: 11,
      userId: 51
    });

    jest.spyOn(prisma.job, 'findUnique').mockResolvedValue({
      id: 4,
      postedByAlumniId: 10, // Owned by alumni ID 10
      deletedAt: null
    });

    const res = await request(app)
      .get('/api/alumni/jobs/4/statistics')
      .set('Authorization', `Bearer ${otherAlumniToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('GET /api/applications/job/:jobId — returns 200 and applicants for authorized alumni owner', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 50,
      email: 'alumni_owner@example.test',
      role: 'ALUMNI',
      accountStatus: 'ACTIVE',
      deletedAt: null
    });

    const mockApps = [
      { id: 1, studentId: 100, studentName: 'John Doe', rollNumber: '20BQ1A0501', status: 'APPLIED' }
    ];
    jest.spyOn(ApplicationService, 'getJobApplicationsForAlumni').mockResolvedValue(mockApps);

    const res = await request(app)
      .get('/api/applications/job/4')
      .set('Authorization', `Bearer ${alumniToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].studentName).toBe('John Doe');
  });

  it('Unauthenticated requests return 401 Unauthorized', async () => {
    const resStats = await request(app).get('/api/alumni/jobs/4/statistics');
    expect(resStats.statusCode).toBe(401);

    const resApps = await request(app).get('/api/applications/job/4');
    expect(resApps.statusCode).toBe(401);
  });
});
