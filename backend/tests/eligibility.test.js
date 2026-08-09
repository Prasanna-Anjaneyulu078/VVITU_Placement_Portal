const request = require('supertest');
const app = require('../src/app');
const { generateAccessToken } = require('../src/utils/jwt.utils');
const EligibilityService = require('../src/services/eligibility.service');

describe('Job Eligibility Engine API Endpoints (/api/eligibility)', () => {
  let studentToken;

  beforeAll(() => {
    studentToken = generateAccessToken({ id: 10, email: 'eligible.student@example.test', role: 'STUDENT' });

    jest.spyOn(EligibilityService, 'validateEligibility').mockImplementation(async (userId, jobId) => {
      if (jobId === '999') {
        throw { statusCode: 404, message: 'Job not found with ID: 999' };
      }
      if (jobId === '50') {
        return {
          studentId: Number(userId),
          jobId: 50,
          isEligible: false,
          status: 'NOT_ELIGIBLE',
          matchScore: 43,
          rejectionReason: 'Not eligible due to: Student CGPA: 6.50, Required: 8.00',
          checks: [
            { criterion: 'Department', passed: true, detail: 'Department: CSE' },
            { criterion: 'CGPA', passed: false, detail: 'Student CGPA: 6.50, Required: 8.00' },
            { criterion: 'Backlogs', passed: true, detail: 'Student backlogs: 0, Maximum allowed: 0' },
            { criterion: 'Semester', passed: true, detail: 'No semester requirement' },
            { criterion: 'Resume', passed: true, detail: 'Resume uploaded' },
            { criterion: 'Account Status', passed: true, detail: 'Account is active' },
            { criterion: 'Verification', passed: false, detail: 'Student verification pending' }
          ],
          skillMatch: { skillMatchPercentage: 50, matchedSkills: ['React'], missingSkills: ['Node'] }
        };
      }
      return {
        studentId: Number(userId),
        jobId: Number(jobId),
        isEligible: true,
        status: 'ELIGIBLE',
        matchScore: 100,
        rejectionReason: null,
        checks: [
          { criterion: 'Department', passed: true, detail: 'Department: CSE' },
          { criterion: 'CGPA', passed: true, detail: 'Student CGPA: 8.50, Required: 7.00' },
          { criterion: 'Backlogs', passed: true, detail: 'Student backlogs: 0, Maximum allowed: 0' },
          { criterion: 'Semester', passed: true, detail: 'No semester requirement' },
          { criterion: 'Resume', passed: true, detail: 'Resume uploaded' },
          { criterion: 'Account Status', passed: true, detail: 'Account is active' },
          { criterion: 'Verification', passed: true, detail: 'Student is verified' }
        ],
        skillMatch: { skillMatchPercentage: 100, matchedSkills: ['Java', 'SQL'], missingSkills: [] }
      };
    });

    jest.spyOn(EligibilityService, 'getRecommendedJobs').mockResolvedValue([
      { job: { id: 1, title: 'Software Engineer', companyName: 'Google' }, eligibility: { matchScore: 100 } }
    ]);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('GET /api/eligibility/validate/1 should return 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/eligibility/validate/1');
    expect(res.statusCode).toEqual(401);
  });

  it('GET /api/eligibility/validate/1 should return 200 and full eligibility result for eligible student', async () => {
    const res = await request(app)
      .get('/api/eligibility/validate/1')
      .set('Cookie', [`accessToken=${studentToken}`]);
    expect(res.statusCode).toEqual(200);
    expect(res.body.isEligible).toBe(true);
    expect(res.body.status).toEqual('ELIGIBLE');
    expect(res.body.matchScore).toEqual(100);
    expect(res.body.checks.length).toEqual(7);
  });

  it('GET /api/eligibility/validate/50 should return 200 and NOT_ELIGIBLE status with rejectionReason for low CGPA', async () => {
    const res = await request(app)
      .get('/api/eligibility/validate/50')
      .set('Cookie', [`accessToken=${studentToken}`]);
    expect(res.statusCode).toEqual(200);
    expect(res.body.isEligible).toBe(false);
    expect(res.body.status).toEqual('NOT_ELIGIBLE');
    expect(res.body.rejectionReason).toContain('Student CGPA');
  });

  it('GET /api/eligibility/badge/1 should return badge status response', async () => {
    const res = await request(app)
      .get('/api/eligibility/badge/1')
      .set('Cookie', [`accessToken=${studentToken}`]);
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('ELIGIBLE');
    expect(res.body.eligible).toBe(true);
    expect(res.body.matchScore).toEqual(100);
  });

  it('GET /api/eligibility/score/1 should return match score and check list', async () => {
    const res = await request(app)
      .get('/api/eligibility/score/1')
      .set('Cookie', [`accessToken=${studentToken}`]);
    expect(res.statusCode).toEqual(200);
    expect(res.body.matchScore).toEqual(100);
    expect(Array.isArray(res.body.checks)).toBe(true);
  });

  it('GET /api/eligibility/recommendations should return recommended jobs list', async () => {
    const res = await request(app)
      .get('/api/eligibility/recommendations?limit=5')
      .set('Cookie', [`accessToken=${studentToken}`]);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].job.title).toEqual('Software Engineer');
  });
});
