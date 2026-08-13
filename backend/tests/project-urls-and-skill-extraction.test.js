const request = require('supertest');
const express = require('express');

const studentRoutes = require('../src/routes/student.routes');
const { errorHandler } = require('../src/middleware/error.middleware');
const prisma = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  student: {
    findUnique: jest.fn()
  },
  studentProject: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  resume: {
    findFirst: jest.fn()
  },
  studentSkill: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1, email: 'student@example.com', role: 'STUDENT' };
    next();
  },
  authorizeRoles: () => (req, res, next) => next()
}));

const app = express();
app.use(express.json());
app.use('/api/student', studentRoutes);
app.use(errorHandler);

describe('Project View URLs & Resume Skill Extraction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/student/projects and GET /api/student/projects/:id', () => {
    it('should return project details with all Git and Live Demo URL alias field names', async () => {
      prisma.student.findUnique.mockResolvedValue({ id: BigInt(10), userId: BigInt(1) });
      prisma.studentProject.findMany.mockResolvedValue([
        {
          id: BigInt(1),
          studentId: BigInt(10),
          title: 'Placement Portal',
          description: 'Web Application for placements',
          techStack: 'React.js, Node.js, Express.js, MySQL',
          sourceUrl: 'https://github.com/example/placement-portal',
          demoUrl: 'https://placement-portal-demo.com'
        }
      ]);
      prisma.studentProject.findFirst.mockResolvedValue({
        id: BigInt(1),
        studentId: BigInt(10),
        title: 'Placement Portal',
        description: 'Web Application for placements',
        techStack: 'React.js, Node.js, Express.js, MySQL',
        sourceUrl: 'https://github.com/example/placement-portal',
        demoUrl: 'https://placement-portal-demo.com'
      });

      const listRes = await request(app).get('/api/student/projects');
      expect(listRes.statusCode).toBe(200);
      expect(listRes.body[0].githubUrl).toBe('https://github.com/example/placement-portal');
      expect(listRes.body[0].liveDemoUrl).toBe('https://placement-portal-demo.com');
      expect(listRes.body[0].gitUrl).toBe('https://github.com/example/placement-portal');

      const detailRes = await request(app).get('/api/student/projects/1');
      expect(detailRes.statusCode).toBe(200);
      expect(detailRes.body.githubUrl).toBe('https://github.com/example/placement-portal');
      expect(detailRes.body.liveDemoUrl).toBe('https://placement-portal-demo.com');
    });
  });

  describe('POST & PUT /api/student/projects', () => {
    it('should persist and return Git & Live Demo URLs when creating or updating project', async () => {
      prisma.student.findUnique.mockResolvedValue({ id: BigInt(10), userId: BigInt(1) });
      prisma.studentProject.create.mockResolvedValue({
        id: BigInt(2),
        studentId: BigInt(10),
        title: 'AI Resume Screener',
        description: 'AI-based resume screener',
        techStack: 'Python, FastAPI, React.js',
        sourceUrl: 'https://github.com/example/ai-screener',
        demoUrl: 'https://ai-screener.demo.app'
      });

      const createRes = await request(app)
        .post('/api/student/projects')
        .send({
          title: 'AI Resume Screener',
          description: 'AI-based resume screener',
          technologies: 'Python, FastAPI, React.js',
          githubUrl: 'https://github.com/example/ai-screener',
          liveDemoUrl: 'https://ai-screener.demo.app'
        });

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.project.githubUrl).toBe('https://github.com/example/ai-screener');
      expect(createRes.body.project.liveDemoUrl).toBe('https://ai-screener.demo.app');
    });
  });
});
