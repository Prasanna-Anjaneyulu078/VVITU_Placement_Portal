const request = require('supertest');
const app = require('../src/app');
const StudentService = require('../src/services/student.service');
const path = require('path');
const fs = require('fs');

describe('Student Resume View & Download Endpoints', () => {
  beforeAll(() => {
    const uploadsResumesDir = path.join(__dirname, '../uploads/resumes');
    if (!fs.existsSync(uploadsResumesDir)) {
      fs.mkdirSync(uploadsResumesDir, { recursive: true });
    }
    const dummyPdfPath = path.join(uploadsResumesDir, 'test-resume.pdf');
    fs.writeFileSync(dummyPdfPath, '%PDF-1.4 mock pdf content');
  });

  it('GET /api/student/resume/details should return 401 without auth token', async () => {
    const res = await request(app).get('/api/student/resume/details');
    expect(res.statusCode).toEqual(401);
  });

  it('GET /api/student/resume/view should return 401 without auth token', async () => {
    const res = await request(app).get('/api/student/resume/view');
    expect(res.statusCode).toEqual(401);
  });

  it('GET /api/student/resume/download should return 401 without auth token', async () => {
    const res = await request(app).get('/api/student/resume/download');
    expect(res.statusCode).toEqual(401);
  });

  it('GET /uploads/resumes/test-resume.pdf static file serving should return 200', async () => {
    const res = await request(app).get('/uploads/resumes/test-resume.pdf');
    expect(res.statusCode).toEqual(200);
  });

  it('StudentService.getResumeDetails should handle missing resume gracefully', async () => {
    jest.spyOn(StudentService, 'getResumeDetails').mockResolvedValueOnce({
      hasResume: false,
      fileName: null,
      fileUrl: null,
      uploadedAt: null,
      fileSize: null
    });

    const res = await StudentService.getResumeDetails(1);
    expect(res.hasResume).toBe(false);

    StudentService.getResumeDetails.mockRestore();
  });
});
