const request = require('supertest');
const app = require('../src/app');
const JobService = require('../src/services/job.service');
const ApplicationService = require('../src/services/application.service');
const jwtUtils = require('../src/utils/jwt.utils');
const prisma = require('../src/config/db');

describe('Student Endpoints — GET /api/student/jobs/open, GET /api/student/jobs/closed, GET /api/applications/my', () => {
  let studentToken;

  beforeAll(() => {
    studentToken = jwtUtils.generateAccessToken({ id: 999, email: 'student_test@example.test', role: 'STUDENT' });
  });

  beforeEach(() => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 999,
      email: 'student_test@example.test',
      name: 'Test Student',
      role: 'STUDENT',
      accountStatus: 'ACTIVE',
      deletedAt: null
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GET /api/student/jobs/open — returns 200 and open jobs list for authenticated student', async () => {
    const mockJobs = [
      { id: 101, title: 'Frontend Developer', companyName: 'TechCorp', status: 'APPROVED', openings: 5 }
    ];
    jest.spyOn(JobService, 'getOpenJobs').mockResolvedValue(mockJobs);

    const res = await request(app)
      .get('/api/student/jobs/open')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Frontend Developer');
  });

  it('GET /api/student/jobs/closed — returns 200 and closed jobs list', async () => {
    const mockJobs = [
      { id: 102, title: 'Backend Developer', companyName: 'DevCorp', status: 'CLOSED' }
    ];
    jest.spyOn(JobService, 'getClosedJobs').mockResolvedValue(mockJobs);

    const res = await request(app)
      .get('/api/student/jobs/closed')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].status).toBe('CLOSED');
  });

  it('GET /api/applications/my — returns 200 and student applications list', async () => {
    const mockApps = [
      { id: 1, jobId: 101, jobTitle: 'Frontend Developer', companyName: 'TechCorp', status: 'APPLIED' }
    ];
    jest.spyOn(ApplicationService, 'getStudentApplications').mockResolvedValue(mockApps);

    const res = await request(app)
      .get('/api/applications/my')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].jobTitle).toBe('Frontend Developer');
  });

  it('Unauthenticated requests return 401 Unauthorized', async () => {
    const resOpen = await request(app).get('/api/student/jobs/open');
    expect(resOpen.statusCode).toBe(401);

    const resApps = await request(app).get('/api/applications/my');
    expect(resApps.statusCode).toBe(401);
  });
});
