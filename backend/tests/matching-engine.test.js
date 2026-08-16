const request = require('supertest');
const app = require('../src/app');
const { generateAccessToken } = require('../src/utils/jwt.utils');
const { matchSkills, normalizeSkill } = require('../src/utils/skillMatcher');
const { matchDepartment, normalizeDepartment } = require('../src/utils/departmentMatcher');
const MatchingService = require('../src/services/matching.service');
const prisma = require('../src/config/db');

describe('Universal Job–Student Deterministic Matching Engine Tests', () => {
  let studentToken;

  beforeAll(() => {
    studentToken = generateAccessToken({ id: 100, email: 'matching.student@vvit.net', role: 'STUDENT' });
  });

  describe('Skill Normalization & Universal Matcher', () => {
    it('should normalize React variants to canonical react.js', () => {
      expect(normalizeSkill('React').canonical).toEqual('react.js');
      expect(normalizeSkill('React.js').canonical).toEqual('react.js');
      expect(normalizeSkill('ReactJS').canonical).toEqual('react.js');
      expect(normalizeSkill('react js').canonical).toEqual('react.js');
    });

    it('should normalize Node variants to canonical node.js', () => {
      expect(normalizeSkill('Node').canonical).toEqual('node.js');
      expect(normalizeSkill('Node.js').canonical).toEqual('node.js');
      expect(normalizeSkill('NodeJS').canonical).toEqual('node.js');
    });

    it('should keep Java and JavaScript strictly distinct', () => {
      const java = normalizeSkill('Java');
      const js = normalizeSkill('JavaScript');

      expect(java.canonical).toEqual('java');
      expect(js.canonical).toEqual('javascript');
      expect(java.canonical).not.toEqual(js.canonical);
    });

    it('should evaluate Required (80%) vs Preferred (20%) skills correctly', () => {
      const studentSkills = ['Python', 'SQL', 'Pandas'];
      const requiredSkills = 'Python, SQL, Machine Learning, Statistics'; // 2/4 matched -> 0.5 * 80 = 40
      const preferredSkills = 'Pandas, Scikit-learn';                       // 1/2 matched -> 0.5 * 20 = 10

      const result = matchSkills(studentSkills, requiredSkills, preferredSkills);
      expect(result.skillMatchPercentage).toEqual(50); // 40 + 10 = 50
      expect(result.matchedSkills).toEqual(['Python', 'SQL']);
      expect(result.missingSkills).toEqual(['Machine Learning', 'Statistics']);
      expect(result.matchedPreferredSkills).toEqual(['Pandas']);
      expect(result.missingPreferredSkills).toEqual(['Scikit-learn']);
    });
  });

  describe('Universal Multi-Job Evaluation for Single Student', () => {
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
        { skillName: 'Node.js' },
        { skillName: 'Express.js' },
        { skillName: 'PostgreSQL' },
        { skillName: 'Git' }
      ],
      projects: [
        { title: 'Full Stack App', techStack: 'React.js, Node.js, Express.js, PostgreSQL' }
      ],
      resumes: [{ id: 1, fileName: 'resume.pdf' }]
    };

    beforeEach(() => {
      jest.restoreAllMocks();
      jest.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockStudent);
    });

    it('should calculate DIFFERENT, logically explainable scores for 5 distinct job categories', async () => {
      // Job 1: Full Stack Developer (Strong match for student profile)
      const fullStackJob = {
        id: BigInt(101),
        title: 'Full Stack Developer',
        requiredSkills: 'React.js, Node.js, Express.js, PostgreSQL',
        requiredCgpa: 7.5,
        maxBacklogs: 0,
        eligibleDepartments: 'CSE, IT'
      };

      // Job 2: Java Backend Developer (Partial match: student has Java & PostgreSQL, missing Spring Boot & REST)
      const javaJob = {
        id: BigInt(102),
        title: 'Java Backend Developer',
        requiredSkills: 'Java, Spring Boot, REST APIs, PostgreSQL',
        requiredCgpa: 7.5,
        maxBacklogs: 0,
        eligibleDepartments: 'CSE, IT'
      };

      // Job 3: Data Scientist (Low skill match: missing Python, ML, Stats)
      const dataScienceJob = {
        id: BigInt(103),
        title: 'Data Scientist',
        requiredSkills: 'Python, SQL, Machine Learning, Statistics',
        requiredCgpa: 7.5,
        maxBacklogs: 0,
        eligibleDepartments: 'CSE, IT, AI & DS'
      };

      // Job 4: QA Engineer (Low skill match: has Java, missing Selenium, TestNG)
      const qaJob = {
        id: BigInt(104),
        title: 'QA Engineer',
        requiredSkills: 'Selenium, Java, TestNG, API Testing',
        requiredCgpa: 7.5,
        maxBacklogs: 0,
        eligibleDepartments: 'CSE, IT'
      };

      // Job 5: Future Category - Blockchain Developer (No skills match)
      const blockchainJob = {
        id: BigInt(105),
        title: 'Blockchain Developer',
        requiredSkills: 'Solidity, Ethereum, Web3.js, Smart Contracts',
        requiredCgpa: 7.5,
        maxBacklogs: 0,
        eligibleDepartments: 'CSE, IT'
      };

      jest.spyOn(prisma.job, 'findUnique')
        .mockResolvedValueOnce(fullStackJob)
        .mockResolvedValueOnce(javaJob)
        .mockResolvedValueOnce(dataScienceJob)
        .mockResolvedValueOnce(qaJob)
        .mockResolvedValueOnce(blockchainJob);

      const resFullStack = await MatchingService.calculateJobMatch(100, 101);
      const resJava = await MatchingService.calculateJobMatch(100, 102);
      const resDataScience = await MatchingService.calculateJobMatch(100, 103);
      const resQA = await MatchingService.calculateJobMatch(100, 104);
      const resBlockchain = await MatchingService.calculateJobMatch(100, 105);

      // Verify Full Stack score > Java score > Data Science score > Blockchain score
      expect(resFullStack.overallScore).toBeGreaterThan(resJava.overallScore);
      expect(resJava.overallScore).toBeGreaterThan(resDataScience.overallScore);
      expect(resDataScience.overallScore).toBeGreaterThanOrEqual(resBlockchain.overallScore);

      // Verify specific skill scores
      expect(resFullStack.breakdown.skills).toEqual(100);
      expect(resJava.breakdown.skills).toEqual(50); // 2 of 4 skills (Java, PostgreSQL) matched
      expect(resBlockchain.breakdown.skills).toEqual(0); // 0 of 4 skills matched

      // All 5 jobs return identical canonical payload structure
      [resFullStack, resJava, resDataScience, resQA, resBlockchain].forEach(res => {
        expect(res).toHaveProperty('jobId');
        expect(res).toHaveProperty('overallScore');
        expect(res).toHaveProperty('category');
        expect(res).toHaveProperty('skillMatch');
        expect(res.skillMatch).toHaveProperty('matchedSkills');
        expect(res.skillMatch).toHaveProperty('missingSkills');
        expect(res).toHaveProperty('breakdown');
        expect(res).toHaveProperty('eligibilityFailures');
      });
    });
  });

  describe('API Endpoint GET /api/student/skills/job-match/:jobId', () => {
    it('should return 200 with canonical match breakdown payload for authenticated student', async () => {
      jest.spyOn(MatchingService, 'calculateJobMatch').mockResolvedValue({
        jobId: 101,
        jobTitle: 'Data Scientist',
        studentId: 100,
        isEligible: true,
        eligible: true,
        status: 'ELIGIBLE',
        overallScore: 82,
        category: 'Strong Match',
        matchScore: 82,
        rejectionReason: null,
        skillMatch: {
          percentage: 80,
          skillMatchPercentage: 80,
          requiredSkills: ['Python', 'SQL', 'Machine Learning', 'Statistics'],
          matchedSkills: ['Python', 'SQL', 'Machine Learning'],
          missingSkills: ['Statistics'],
          preferredSkills: ['Pandas', 'Scikit-learn'],
          matchedPreferredSkills: ['Pandas'],
          missingPreferredSkills: ['Scikit-learn']
        },
        breakdown: {
          skills: 80,
          education: 100,
          department: 100,
          experience: 80,
          eligibility: 100,
          certifications: 100
        },
        eligibilityFailures: [],
        matchedSkills: ['Python', 'SQL', 'Machine Learning'],
        missingSkills: ['Statistics'],
        checks: [],
        explanations: ['✓ 3 of 4 required skills matched']
      });

      const res = await request(app)
        .get('/api/student/skills/job-match/101')
        .set('Cookie', [`accessToken=${studentToken}`]);

      expect(res.statusCode).toEqual(200);
      expect(res.body.overallScore).toEqual(82);
      expect(res.body.category).toEqual('Strong Match');
      expect(res.body.skillMatch.percentage).toEqual(80);
      expect(res.body.matchedSkills).toEqual(['Python', 'SQL', 'Machine Learning']);
      expect(res.body.missingSkills).toEqual(['Statistics']);
    });
  });
});
