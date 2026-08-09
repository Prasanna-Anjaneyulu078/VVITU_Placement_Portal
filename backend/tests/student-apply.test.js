const request = require('supertest');
const app = require('../src/app');
const ApplicationService = require('../src/services/application.service');
const jwtUtils = require('../src/utils/jwt.utils');
const prisma = require('../src/config/db');

describe('Student Job Application — POST /api/student/jobs/:jobId/apply', () => {
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

  it('Test 1 — Successful application: Authenticated student + valid open job + not previously applied = 201 success', async () => {
    jest.spyOn(ApplicationService, 'applyForJob').mockResolvedValue({
      success: true,
      message: 'Application submitted successfully',
      applicationId: 10
    });

    const res = await request(app)
      .post('/api/student/jobs/4/apply')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ screeningAnswers: [{ question: 'Why?', answer: 'Because' }] });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.applicationId).toBe(10);
    expect(ApplicationService.applyForJob).toHaveBeenCalledWith(999, '4', [{ question: 'Why?', answer: 'Because' }]);
  });

  it('Test 2 — Unauthenticated: No valid JWT = 401', async () => {
    const res = await request(app)
      .post('/api/student/jobs/4/apply')
      .send({ screeningAnswers: [] });

    expect(res.statusCode).toBe(401);
  });

  it('Test 3 — Non-student: Authenticated admin/alumni = 403', async () => {
    const res = await request(app)
      .post('/api/student/jobs/4/apply')
      .set('Authorization', `Bearer ${alumniToken}`)
      .send({ screeningAnswers: [] });

    expect(res.statusCode).toBe(403);
  });

  it('Test 4 — Job does not exist: Invalid jobId = 404', async () => {
    jest.spyOn(ApplicationService, 'applyForJob').mockRejectedValue({
      statusCode: 404,
      message: 'Job posting not found'
    });

    const res = await request(app)
      .post('/api/student/jobs/999/apply')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({});

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Job posting not found');
  });

  it('Test 5 — Duplicate application: Same student + same job = 409 (or 400)', async () => {
    jest.spyOn(ApplicationService, 'applyForJob').mockRejectedValue({
      statusCode: 400,
      message: 'You have already applied for this job'
    });

    const res = await request(app)
      .post('/api/student/jobs/4/apply')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('You have already applied for this job');
  });

  it('Test 6 — Closed/expired job: Closed/expired job = rejection (400)', async () => {
    jest.spyOn(ApplicationService, 'applyForJob').mockRejectedValue({
      statusCode: 400,
      message: 'Applications are not currently accepted for this job'
    });

    const res = await request(app)
      .post('/api/student/jobs/4/apply')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Applications are not currently accepted for this job');
  });
});
