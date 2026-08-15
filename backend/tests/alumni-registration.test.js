const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');

jest.mock('../src/services/ocr.service');
const OcrService = require('../src/services/ocr.service');

describe('Alumni Registration API - POST /api/auth/register/alumni', () => {
  jest.setTimeout(15000);
  const testEmail = `alumni_${Date.now()}@vvit.net`;
  const testRoll = `20BQ1A${Math.floor(1000 + Math.random() * 9000)}`;

  it('should return 400 when missing required fields (name, email, password, rollNumber)', async () => {
    const res = await request(app)
      .post('/api/auth/register/alumni')
      .field('email', testEmail)
      .attach('document', Buffer.from('Vasireddy Venkatadri Institute of Technology'), 'cert.pdf');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  }, 15000);

  it('should return 400 when verification document is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register/alumni')
      .field('name', 'Test Alumni')
      .field('email', testEmail)
      .field('password', 'Password@123')
      .field('rollNumber', testRoll);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Verification document is required');
  });

  it('should return 400 when document is not a valid document type', async () => {
    const res = await request(app)
      .post('/api/auth/register/alumni')
      .field('name', 'Test Alumni')
      .field('email', testEmail)
      .field('password', 'Password@123')
      .field('rollNumber', testRoll)
      .attach('document', Buffer.from('console.log("bad")'), 'script.exe');

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Unsupported file type');
  });

  it('should return 422 when uploaded document fails VVIT/VVITU college verification', async () => {
    OcrService.getFileBuffer = jest.fn().mockReturnValue(Buffer.from('fake'));
    OcrService.extractDocument = jest.fn().mockResolvedValue({
      text: 'ABC Engineering College Certificate\nFULL NAME: Test Alumni\nROLL NO: 20BQ1A0501',
      confidence: 100,
      pageCount: 1,
      source: 'TEXT'
    });

    const fakeNonVvitPdf = Buffer.from('dummy');
    const res = await request(app)
      .post('/api/auth/register/alumni')
      .field('name', 'Test Alumni')
      .field('email', `invalid_col_${Date.now()}@vvit.net`)
      .field('password', 'Password@123')
      .field('rollNumber', `20BQ1A${Math.floor(1000 + Math.random() * 9000)}`)
      .attach('document', fakeNonVvitPdf, 'cert.pdf');

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toMatch(/COLLEGE_MISMATCH/);
  }, 15000);

  it('should successfully register alumni when valid VVIT document provided', async () => {
    const validRoll = `20BQ1A${Math.floor(1000 + Math.random() * 9000)}`;
    const validEmail = `valid_alumni_${Date.now()}@vvit.net`;
    const pdfContent = `Vasireddy Venkatadri Institute of Technology\nFULL NAME: Valid Alumni\nROLL NO: ${validRoll}`;

    OcrService.getFileBuffer = jest.fn().mockReturnValue(Buffer.from('fake'));
    OcrService.extractDocument = jest.fn().mockResolvedValue({
      text: pdfContent,
      confidence: 100,
      pageCount: 1,
      source: 'TEXT'
    });

    const res = await request(app)
      .post('/api/auth/register/alumni')
      .field('name', 'Valid Alumni')
      .field('email', validEmail)
      .field('password', 'Password@123')
      .field('company', 'Tech Corp')
      .field('designation', 'Senior Software Engineer')
      .field('passingYear', '2024')
      .field('rollNumber', validRoll)
      .field('department', 'CSE')
      .field('degree', 'B.Tech')
      .field('mobileNumber', '9876543210')
      .field('gender', 'Male')
      .attach('document', Buffer.from(pdfContent), 'vvit_degree.pdf');

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Alumni registered successfully');

    // Verify database consistency
    const user = await prisma.user.findFirst({ where: { email: validEmail } });
    expect(user).not.toBeNull();
    expect(user.role).toBe('ALUMNI');

    const alumni = await prisma.alumni.findFirst({ where: { userId: user.id } });
    expect(alumni).not.toBeNull();
    expect(alumni.rollNumber).toBe(validRoll);
    expect(alumni.verificationDocumentUrl).toContain('/uploads/documents/');

    // Test duplicate email rejection
    const dupRes = await request(app)
      .post('/api/auth/register/alumni')
      .field('name', 'Valid Alumni')
      .field('email', validEmail)
      .field('password', 'Password@123')
      .field('rollNumber', `20BQ1A${Math.floor(1000 + Math.random() * 9000)}`)
      .attach('document', Buffer.from(pdfContent), 'vvit_degree.pdf');

    expect(dupRes.statusCode).toBe(400);
    expect(dupRes.body.message).toContain('already exists');

    // Cleanup test user
    await prisma.alumni.deleteMany({ where: { id: alumni.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    
    OcrService.extractDocument.mockRestore();
    OcrService.getFileBuffer.mockRestore();
  });
});
