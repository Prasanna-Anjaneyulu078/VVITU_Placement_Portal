const request = require('supertest');
const app = require('../src/app');
const JobService = require('../src/services/job.service');
const jwtUtils = require('../src/utils/jwt.utils');
const prisma = require('../src/config/db');

describe('Student Job Details — GET /api/student/jobs/:jobId', () => {
  let studentToken;
  let alumniToken;

  beforeAll(() => {
    studentToken = jwtUtils.generateAccessToken({ id: 999, email: 'student_test@example.test', role: 'STUDENT' });
    alumniToken = jwtUtils.generateAccessToken({ id: 888, email: 'alumni_test@example.test', role: 'ALUMNI' });
  });

  beforeEach(() => {
    jest.spyOn(prisma.user, 'findUnique').mockImplementation(async (args) => {
      if (args.where.id === 999) {
        return {
          id: 999,
          email: 'student_test@example.test',
          name: 'Test Student',
          role: 'STUDENT',
          accountStatus: 'ACTIVE',
          deletedAt: null
        };
      }
      if (args.where.id === 888) {
        return {
          id: 888,
          email: 'alumni_test@example.test',
          name: 'Test Alumni',
          role: 'ALUMNI',
          accountStatus: 'ACTIVE',
          deletedAt: null
        };
      }
      return null;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Test 1 — 200 OK: Authenticated student fetches valid job details', async () => {
    jest.spyOn(JobService, 'getStudentJobDetails').mockResolvedValue({
      id: 4,
      title: 'Software Engineer',
      company: 'TechCorp',
      companyName: 'TechCorp',
      location: 'Bengaluru',
      jobType: 'Full-time',
      packageDetails: '12 LPA',
      description: 'Role overview...',
      requiredSkills: 'React, Node.js',
      status: 'APPROVED',
      hasApplied: false,
      applicationStatus: null,
      skillMatchPercentage: 100,
      isEligible: true
    });

    const res = await request(app)
      .get('/api/student/jobs/4')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(4);
    expect(res.body.title).toBe('Software Engineer');
    expect(res.body.company).toBe('TechCorp');
    expect(res.body.hasApplied).toBe(false);
    expect(res.body.skillMatchPercentage).toBe(100);
    expect(JobService.getStudentJobDetails).toHaveBeenCalledWith(999, '4');
  });

  it('Test 2 — 400 Bad Request: Invalid job ID format', async () => {
    jest.spyOn(JobService, 'getStudentJobDetails').mockRejectedValue({
      statusCode: 400,
      message: 'Invalid job ID.'
    });

    const res = await request(app)
      .get('/api/student/jobs/abc')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid job ID.');
  });

  it('Test 3 — 401 Unauthorized: Unauthenticated request', async () => {
    const res = await request(app).get('/api/student/jobs/4');

    expect(res.statusCode).toBe(401);
  });

  it('Test 4 — 403 Forbidden: Non-student role', async () => {
    const res = await request(app)
      .get('/api/student/jobs/4')
      .set('Authorization', `Bearer ${alumniToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('Test 5 — 404 Not Found: Non-existent job', async () => {
    jest.spyOn(JobService, 'getStudentJobDetails').mockRejectedValue({
      statusCode: 404,
      message: 'Job not found.'
    });

    const res = await request(app)
      .get('/api/student/jobs/999999')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Job not found.');
  });
});
