const request = require('supertest');
const app = require('../src/app');
const { generateAccessToken } = require('../src/utils/jwt.utils');
const { matchSkills, normalizeSkill } = require('../src/utils/skillMatcher');
const { matchDepartment, normalizeDepartment } = require('../src/utils/departmentMatcher');
const MatchingService = require('../src/services/matching.service');
const prisma = require('../src/config/db');

describe('Job–Student Deterministic Matching Engine Tests', () => {
  let studentToken;

  beforeAll(() => {
    studentToken = generateAccessToken({ id: 100, email: 'matching.student@vvit.net', role: 'STUDENT' });
  });

  describe('Skill Normalization & Alias Matcher', () => {
    it('should normalize React variants to canonical react.js', () => {
      const v1 = normalizeSkill('React');
      const v2 = normalizeSkill('React.js');
      const v3 = normalizeSkill('ReactJS');
      const v4 = normalizeSkill('react js');

      expect(v1.canonical).toEqual('react.js');
      expect(v2.canonical).toEqual('react.js');
      expect(v3.canonical).toEqual('react.js');
      expect(v4.canonical).toEqual('react.js');
    });

    it('should normalize Node variants to canonical node.js', () => {
      const n1 = normalizeSkill('Node');
      const n2 = normalizeSkill('Node.js');
      const n3 = normalizeSkill('NodeJS');

      expect(n1.canonical).toEqual('node.js');
      expect(n2.canonical).toEqual('node.js');
      expect(n3.canonical).toEqual('node.js');
    });

    it('should keep Java and JavaScript strictly distinct', () => {
      const java = normalizeSkill('Java');
      const js = normalizeSkill('JavaScript');

      expect(java.canonical).toEqual('java');
      expect(js.canonical).toEqual('javascript');
      expect(java.canonical).not.toEqual(js.canonical);
    });

    it('should calculate partial skill match percentage accurately', () => {
      const studentSkills = ['Java', 'Spring Boot', 'React', 'PostgreSQL', 'Docker'];
      const requiredSkills = 'Java, Spring Boot, React.js, PostgreSQL, Docker, AWS';

      const result = matchSkills(studentSkills, requiredSkills);
      expect(result.skillMatchPercentage).toEqual(83); // 5/6 * 100 = 83.33 -> 83
      expect(result.matchedSkills.length).toEqual(5);
      expect(result.missingSkills).toEqual(['AWS']);
    });
  });

  describe('Department Normalization & Matcher', () => {
    it('should normalize Artificial Intelligence and Data Science to AI & DS', () => {
      expect(normalizeDepartment('Artificial Intelligence and Data Science')).toEqual('AI & DS');
      expect(normalizeDepartment('AI & DS')).toEqual('AI & DS');
      expect(normalizeDepartment('AIDS')).toEqual('AI & DS');
    });

    it('should match student department against job eligible departments', () => {
      const res = matchDepartment('Artificial Intelligence and Data Science', 'CSE, IT, AI & DS, ECE');
      expect(res.passed).toBe(true);
      expect(res.score).toEqual(100);
      expect(res.studentDept).toEqual('AI & DS');
    });
  });

  describe('MatchingService Integration & Deterministic Scores', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    it('should calculate deterministic score for eligible student with 100% skill match', async () => {
      const mockStudent = {
        id: BigInt(100),
        userId: BigInt(100),
        rollNumber: '21NB1A0501',
        department: 'Computer Science and Engineering',
        cgpa: 8.5,
        semester: 8,
        backlogs: 0,
        academicStatus: 'PURSUING',
        verificationStatus: 'VERIFIED',
        user: { accountStatus: 'ACTIVE' },
        skills: [
          { skillName: 'Java' },
          { skillName: 'React.js' },
          { skillName: 'PostgreSQL' }
        ],
        projects: [
          { title: 'Placement Portal', techStack: 'React.js, Node.js, PostgreSQL' }
        ],
        resumes: [{ id: 1, fileName: 'resume.pdf' }]
      };

      const mockJob = {
        id: BigInt(10),
        title: 'Full Stack Engineer',
        companyName: 'TechCorp',
        requiredSkills: 'Java, React, PostgreSQL',
        requiredCgpa: 7.5,
        maxBacklogs: 0,
        eligibleSemester: 6,
        eligibleDepartments: 'CSE, IT, ECE',
        experienceRequired: '0-2 years'
      };

      jest.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockStudent);
      jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(mockJob);

      const result1 = await MatchingService.calculateJobMatch(100, 10);
      const result2 = await MatchingService.calculateJobMatch(100, 10);

      // Deterministic check: repeated calls MUST return identical score
      expect(result1.overallScore).toEqual(result2.overallScore);
      expect(result1.isEligible).toBe(true);
      expect(result1.status).toEqual('ELIGIBLE');
      expect(result1.overallScore).toBeGreaterThanOrEqual(90);
      expect(result1.category).toEqual('Excellent Match');
      expect(result1.breakdown.skills).toEqual(100);
      expect(result1.matchedSkills).toContain('Java');
    });

    it('should set isEligible=false and status=NOT_ELIGIBLE when CGPA is below job requirement', async () => {
      const mockStudent = {
        id: BigInt(100),
        userId: BigInt(100),
        rollNumber: '21NB1A0502',
        department: 'CSE',
        cgpa: 6.8, // Below required 7.5
        semester: 8,
        backlogs: 0,
        user: { accountStatus: 'ACTIVE' },
        skills: [{ skillName: 'Java' }],
        projects: [],
        resumes: [{ id: 1 }]
      };

      const mockJob = {
        id: BigInt(20),
        title: 'Software Engineer',
        requiredSkills: 'Java',
        requiredCgpa: 7.5,
        maxBacklogs: 0,
        eligibleDepartments: 'CSE'
      };

      jest.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockStudent);
      jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(mockJob);

      const result = await MatchingService.calculateJobMatch(100, 20);
      expect(result.isEligible).toBe(false);
      expect(result.status).toEqual('NOT_ELIGIBLE');
      expect(result.rejectionReason).toContain('Student CGPA');
    });
  });

  describe('API Endpoint GET /api/student/skills/job-match/:jobId', () => {
    it('should return 200 with match breakdown payload for authenticated student', async () => {
      jest.spyOn(MatchingService, 'calculateJobMatch').mockResolvedValue({
        jobId: 1,
        studentId: 100,
        isEligible: true,
        eligible: true,
        status: 'ELIGIBLE',
        overallScore: 87,
        category: 'Strong Match',
        matchScore: 87,
        rejectionReason: null,
        breakdown: {
          skills: 92,
          education: 100,
          branch: 100,
          experience: 80,
          eligibility: 100,
          certifications: 80
        },
        matchedSkills: ['Java', 'React.js', 'PostgreSQL'],
        missingSkills: ['Docker', 'AWS'],
        checks: [],
        explanations: ['✓ 3 of 5 required skills matched']
      });

      const res = await request(app)
        .get('/api/student/skills/job-match/1')
        .set('Cookie', [`accessToken=${studentToken}`]);

      expect(res.statusCode).toEqual(200);
      expect(res.body.overallScore).toEqual(87);
      expect(res.body.category).toEqual('Strong Match');
      expect(res.body.breakdown.skills).toEqual(92);
      expect(res.body.matchedSkills).toEqual(['Java', 'React.js', 'PostgreSQL']);
      expect(res.body.missingSkills).toEqual(['Docker', 'AWS']);
    });
  });
});
