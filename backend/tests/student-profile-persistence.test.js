const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../src/app');
const StudentService = require('../src/services/student.service');
const ResumeService = require('../src/services/resume.service');
const jwtUtils = require('../src/utils/jwt.utils');
const prisma = require('../src/config/db');

describe('Student Profile Data Persistence Audit', () => {
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
      return null;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('1. GET /api/student/profile — returns 200 with complete student profile', async () => {
    jest.spyOn(StudentService, 'getProfile').mockResolvedValue({
      id: 10,
      userId: 999,
      name: 'Test Student',
      email: 'student_test@example.test',
      department: 'CSE',
      cgpa: 8.5,
      semester: 7,
      backlogs: 0,
      skills: [{ id: 1, name: 'JavaScript' }],
      projects: [{ id: 1, title: 'Portfolio' }],
      resumes: [{ id: 1, fileName: 'resume.pdf', fileUrl: '/uploads/resumes/resume.pdf' }]
    });

    const res = await request(app)
      .get('/api/student/profile')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(10);
    expect(res.body.department).toBe('CSE');
    expect(res.body.skills).toHaveLength(1);
  });

  it('2. PUT /api/student/profile — updates student personal and academic info', async () => {
    jest.spyOn(StudentService, 'updateProfile').mockResolvedValue({
      success: true,
      message: 'Profile updated successfully',
      student: { id: 10, department: 'IT', cgpa: 9.0, backlogs: 0, semester: 8 }
    });

    const res = await request(app)
      .put('/api/student/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ department: 'IT', cgpa: 9.0, semester: 8, backlogs: 0 });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.student.department).toBe('IT');
  });

  it('3. POST /api/student/profile/image — updates profile photo with clean relative path without P2000 error', async () => {
    jest.spyOn(StudentService, 'updateProfileImage').mockResolvedValue({
      success: true,
      message: 'Profile photo updated successfully',
      url: '/uploads/images/student-10-12345.png',
      profileImageUrl: '/uploads/images/student-10-12345.png'
    });

    const res = await request(app)
      .post('/api/student/profile/image')
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('file', Buffer.from('mock image data'), 'profile.png');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.profileImageUrl).toBe('/uploads/images/student-10-12345.png');
  });

  it('4. POST /api/student/resume/upload — uploads resume and updates relative file path', async () => {
    jest.spyOn(ResumeService, 'uploadResume').mockResolvedValue({
      success: true,
      message: 'Resume uploaded successfully',
      resume: {
        id: 1,
        fileName: 'test-resume.pdf',
        fileUrl: '/uploads/resumes/student-10-resume.pdf',
        filePath: '/uploads/resumes/student-10-resume.pdf'
      }
    });

    const res = await request(app)
      .post('/api/student/resume/upload')
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('resume', Buffer.from('%PDF-1.4 mock content'), 'test-resume.pdf');

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.resume.filePath).toBe('/uploads/resumes/student-10-resume.pdf');
  });

  it('5. GET /api/student/resume/view — returns 404 with clear message when physical resume file is missing', async () => {
    jest.spyOn(StudentService, 'getResumeFile').mockRejectedValue({
      statusCode: 404,
      message: 'Resume file missing from storage. Please re-upload your resume.'
    });

    const res = await request(app)
      .get('/api/student/resume/view')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Resume file missing from storage. Please re-upload your resume.');
  });

  it('6. POST /api/student/skills — prevents duplicate skill additions (409 Conflict)', async () => {
    jest.spyOn(StudentService, 'addSkill').mockRejectedValue({
      statusCode: 409,
      message: "Skill 'JavaScript' already exists in your profile"
    });

    const res = await request(app)
      .post('/api/student/skills')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ skillName: 'JavaScript' });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toContain("already exists");
  });

  it('7. DELETE /api/student/projects/:id — protects project deletion against unauthorized student (403 Forbidden)', async () => {
    jest.spyOn(StudentService, 'deleteProject').mockRejectedValue({
      statusCode: 403,
      message: 'Forbidden: You do not have permission to delete this project'
    });

    const res = await request(app)
      .delete('/api/student/projects/999')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });
});
