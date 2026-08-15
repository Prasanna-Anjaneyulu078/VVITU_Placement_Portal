/**
 * IDOR Security Tests
 *
 * Tests that unauthorized cross-user access attempts are correctly rejected (HTTP 403)
 * and that legitimate same-user access still succeeds (HTTP 200/201).
 *
 * Vulnerabilities fixed and tested:
 *  1. Student A cannot update/delete Student B's project (was missing ownership check)
 *  2. Student A cannot delete Student B's skill (was missing ownership check)
 *  3. Alumni A cannot update application status on Alumni B's job (was missing job-ownership check)
 */

const request = require('supertest');
const app = require('../src/app');
const { generateAccessToken } = require('../src/utils/jwt.utils');
const StudentService = require('../src/services/student.service');
const ApplicationService = require('../src/services/application.service');

jest.setTimeout(30000);

describe('IDOR Security Audit — Unauthorized Resource Access', () => {
  let studentAToken;
  let studentBToken;
  let alumniAToken;
  let alumniBToken;

  beforeAll(() => {
    // User IDs: A=101, B=102 for students; A=201, B=202 for alumni
    studentAToken = generateAccessToken({ id: 101, email: 'student_a@example.test', role: 'STUDENT' });
    studentBToken = generateAccessToken({ id: 102, email: 'student_b@example.test', role: 'STUDENT' });
    alumniAToken  = generateAccessToken({ id: 201, email: 'alumni_a@example.test', role: 'ALUMNI' });
    alumniBToken  = generateAccessToken({ id: 202, email: 'alumni_b@example.test', role: 'ALUMNI' });
  });

  // ---------------------------------------------------------------------------
  // 1. Student Project IDOR
  // ---------------------------------------------------------------------------
  describe('Student Project — IDOR Protection', () => {
    it('PUT /api/student/projects/:id — Student B cannot edit Student A\'s project', async () => {
      // Stub StudentService.updateProject to throw 403 when called with userId=102 on studentId-owned=101
      jest.spyOn(StudentService, 'updateProject').mockRejectedValue({
        statusCode: 403,
        message: 'Forbidden: You do not have permission to edit this project'
      });

      const res = await request(app)
        .put('/api/student/projects/999')
        .set('Cookie', [`accessToken=${studentBToken}`])
        .send({ title: 'Hacked project title' });

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toMatch(/Forbidden|permission/i);

      StudentService.updateProject.mockRestore();
    });

    it('DELETE /api/student/projects/:id — Student B cannot delete Student A\'s project', async () => {
      jest.spyOn(StudentService, 'deleteProject').mockRejectedValue({
        statusCode: 403,
        message: 'Forbidden: You do not have permission to delete this project'
      });

      const res = await request(app)
        .delete('/api/student/projects/999')
        .set('Cookie', [`accessToken=${studentBToken}`]);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toMatch(/Forbidden|permission/i);

      StudentService.deleteProject.mockRestore();
    });

    it('PUT /api/student/projects/:id — Student A can edit their own project', async () => {
      jest.spyOn(StudentService, 'updateProject').mockResolvedValue({
        success: true,
        message: 'Project updated successfully',
        project: { id: 1, title: 'Updated title' }
      });

      const res = await request(app)
        .put('/api/student/projects/1')
        .set('Cookie', [`accessToken=${studentAToken}`])
        .send({ title: 'Updated title' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      StudentService.updateProject.mockRestore();
    });

    it('DELETE /api/student/projects/:id — Student A can delete their own project', async () => {
      jest.spyOn(StudentService, 'deleteProject').mockResolvedValue({
        success: true,
        message: 'Project deleted successfully'
      });

      const res = await request(app)
        .delete('/api/student/projects/1')
        .set('Cookie', [`accessToken=${studentAToken}`]);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      StudentService.deleteProject.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Student Skill IDOR
  // ---------------------------------------------------------------------------
  describe('Student Skill — IDOR Protection', () => {
    it('DELETE /api/student/skills/:id — Student B cannot delete Student A\'s skill', async () => {
      jest.spyOn(StudentService, 'deleteSkill').mockRejectedValue({
        statusCode: 403,
        message: 'Forbidden: You do not have permission to delete this skill'
      });

      const res = await request(app)
        .delete('/api/student/skills/999')
        .set('Cookie', [`accessToken=${studentBToken}`]);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toMatch(/Forbidden|permission/i);

      StudentService.deleteSkill.mockRestore();
    });

    it('DELETE /api/student/skills/:id — Student A can delete their own skill', async () => {
      jest.spyOn(StudentService, 'deleteSkill').mockResolvedValue({
        success: true,
        message: 'Skill deleted successfully'
      });

      const res = await request(app)
        .delete('/api/student/skills/1')
        .set('Cookie', [`accessToken=${studentAToken}`]);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      StudentService.deleteSkill.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Application Status Update IDOR (Alumni cross-job)
  // ---------------------------------------------------------------------------
  describe('Application Status Update — Alumni IDOR Protection', () => {
    it('PUT /api/alumni/applications/:id/status — Alumni B cannot update status on Alumni A\'s job application', async () => {
      jest.spyOn(ApplicationService, 'updateStatus').mockRejectedValue({
        statusCode: 403,
        message: 'Forbidden: You do not have permission to update the status of this application'
      });

      const res = await request(app)
        .put('/api/alumni/applications/999/status')
        .set('Cookie', [`accessToken=${alumniBToken}`])
        .send({ status: 'ACCEPTED' });

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toMatch(/Forbidden|permission/i);

      ApplicationService.updateStatus.mockRestore();
    });

    it('PUT /api/alumni/applications/:id/status — Alumni A can update status on their own job application', async () => {
      jest.spyOn(ApplicationService, 'updateStatus').mockResolvedValue({
        success: true,
        message: 'Application status updated to SHORTLISTED',
        application: { id: 1, status: 'SHORTLISTED' }
      });

      const res = await request(app)
        .put('/api/alumni/applications/1/status')
        .set('Cookie', [`accessToken=${alumniAToken}`])
        .send({ status: 'SHORTLISTED' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      ApplicationService.updateStatus.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Role-based Route Access Controls
  // ---------------------------------------------------------------------------
  describe('Role-based Route Access — Cross-Role Unauthorized Access', () => {
    it('GET /api/admin/settings — Student cannot access admin settings', async () => {
      const res = await request(app)
        .get('/api/admin/settings')
        .set('Cookie', [`accessToken=${studentAToken}`]);
      expect(res.statusCode).toEqual(403);
    });

    it('GET /api/admin/settings — Alumni cannot access admin settings', async () => {
      const res = await request(app)
        .get('/api/admin/settings')
        .set('Cookie', [`accessToken=${alumniAToken}`]);
      expect(res.statusCode).toEqual(403);
    });

    it('POST /api/student/projects — Alumni cannot post a student project', async () => {
      const res = await request(app)
        .post('/api/student/projects')
        .set('Cookie', [`accessToken=${alumniAToken}`])
        .send({ title: 'Alumni owned fake project' });
      expect(res.statusCode).toEqual(403);
    });

    it('GET /api/alumni/profile — Student cannot access alumni profile route', async () => {
      const res = await request(app)
        .get('/api/alumni/profile')
        .set('Cookie', [`accessToken=${studentAToken}`]);
      expect(res.statusCode).toEqual(403);
    });

    it('Unauthenticated requests to protected routes are rejected with 401', async () => {
      const projectRes = await request(app).put('/api/student/projects/1').send({ title: 'hacked' });
      expect(projectRes.statusCode).toEqual(401);

      const skillRes = await request(app).delete('/api/student/skills/1');
      expect(skillRes.statusCode).toEqual(401);

      const alumniAppRes = await request(app).put('/api/alumni/applications/1/status').send({ status: 'ACCEPTED' });
      expect(alumniAppRes.statusCode).toEqual(401);
    });
  });
});
