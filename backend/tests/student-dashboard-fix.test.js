const request = require('supertest');
const app = require('../src/app');
const StudentService = require('../src/services/student.service');
const JobService = require('../src/services/job.service');
const jwtUtils = require('../src/utils/jwt.utils');
const prisma = require('../src/config/db');

describe('Student Dashboard Fix — GET /api/student/profile, /skills, /projects, /jobs/closed', () => {
  let studentToken;

  beforeAll(() => {
    studentToken = jwtUtils.generateAccessToken({ id: 888, email: 'student_dash@vvit.net', role: 'STUDENT' });
  });

  beforeEach(() => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 888,
      email: 'student_dash@vvit.net',
      name: 'Venkata Prasanna',
      role: 'STUDENT',
      accountStatus: 'ACTIVE',
      deletedAt: null
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GET /api/student/profile — returns 200 with serialized user object and profile fields', async () => {
    const mockProfile = {
      id: 1,
      userId: 888,
      name: 'Venkata Prasanna',
      studentName: 'Venkata Prasanna',
      email: 'student_dash@vvit.net',
      rollNumber: '20BQ1A0501',
      department: 'CSE',
      cgpa: 8.9,
      verificationStatus: 'VERIFIED',
      user: { id: 888, name: 'Venkata Prasanna', email: 'student_dash@vvit.net', role: 'STUDENT' },
      skills: [],
      projects: []
    };
    jest.spyOn(StudentService, 'getProfile').mockResolvedValue(mockProfile);

    const res = await request(app)
      .get('/api/student/profile')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.name).toBe('Venkata Prasanna');
    expect(res.body.rollNumber).toBe('20BQ1A0501');
    expect(res.body.verificationStatus).toBe('VERIFIED');
  });

  it('GET /api/student/skills — returns 200 with skill categories', async () => {
    const mockSkills = [
      {
        categoryName: 'Technical Skills',
        skills: [{ id: 1, skillName: 'Java', name: 'Java' }]
      }
    ];
    jest.spyOn(StudentService, 'getSkills').mockResolvedValue(mockSkills);

    const res = await request(app)
      .get('/api/student/skills')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].categoryName).toBe('Technical Skills');
  });

  it('GET /api/student/projects — returns 200 with student projects list', async () => {
    const mockProjects = [
      { id: 1, title: 'Placement System', description: 'Web app', techStack: 'Node.js', githubLink: 'http://github.com' }
    ];
    jest.spyOn(StudentService, 'getProjects').mockResolvedValue(mockProjects);

    const res = await request(app)
      .get('/api/student/projects')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('Placement System');
  });

  it('GET /api/student/jobs/closed — returns 200 without throwing 500 enum error', async () => {
    const mockClosedJobs = [
      { id: 10, title: 'Closed Software Engineer', status: 'CLOSED' }
    ];
    jest.spyOn(JobService, 'getClosedJobs').mockResolvedValue(mockClosedJobs);

    const res = await request(app)
      .get('/api/student/jobs/closed')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('Closed Software Engineer');
  });
});
