const request = require('supertest');
const app = require('../src/app');
const { generateAccessToken } = require('../src/utils/jwt.utils');
const AdminImportService = require('../src/services/adminImport.service');
const AdminExportService = require('../src/services/adminExport.service');

describe('Admin Student Import & Export API Endpoints', () => {
  let adminToken;
  let studentToken;

  beforeAll(() => {
    adminToken = generateAccessToken({ id: 1, email: 'admin@example.test', role: 'ADMIN' });
    studentToken = generateAccessToken({ id: 2, email: 'student@example.test', role: 'STUDENT' });

    jest.spyOn(AdminExportService, 'exportStudents').mockImplementation(async (data) => {
      const format = (data.format || 'CSV').toUpperCase();
      if (format === 'EXCEL') {
        return {
          fileBuffer: Buffer.from('mock excel data'),
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          filename: 'Students_Export_2026-08-08.xlsx'
        };
      } else if (format === 'PDF') {
        return {
          fileBuffer: Buffer.from('mock pdf data'),
          contentType: 'application/pdf',
          filename: 'Students_Export_2026-08-08.pdf'
        };
      }
      return {
        fileBuffer: Buffer.from('Roll Number,Name,Email\n218X1A0501,John,john@example.test'),
        contentType: 'text/csv',
        filename: 'Students_Export_2026-08-08.csv'
      };
    });

    jest.spyOn(AdminImportService, 'importStudents').mockResolvedValue({
      created: 1,
      skipped: 0,
      failed: 0,
      importedStudents: [
        { name: 'Jane Doe', email: 'jane@example.test', password: 'TEST_PASSWORD_123', rollNumber: '218X1A0502' }
      ]
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('POST /api/admin/users/students/export should return 401 when unauthenticated', async () => {
    const res = await request(app).post('/api/admin/users/students/export').send({ studentIds: [1] });
    expect(res.statusCode).toEqual(401);
  });

  it('POST /api/admin/users/students/export should return 403 when accessed by STUDENT role', async () => {
    const res = await request(app)
      .post('/api/admin/users/students/export')
      .set('Cookie', [`accessToken=${studentToken}`])
      .send({ studentIds: [1] });
    expect(res.statusCode).toEqual(403);
  });

  it('POST /api/admin/users/students/export (CSV) should return 200 and text/csv file', async () => {
    const res = await request(app)
      .post('/api/admin/users/students/export')
      .set('Cookie', [`accessToken=${adminToken}`])
      .send({ studentIds: [1], format: 'CSV' });
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
  });

  it('POST /api/admin/users/students/export (EXCEL) should return 200 and excel spreadsheet header', async () => {
    const res = await request(app)
      .post('/api/admin/users/students/export')
      .set('Cookie', [`accessToken=${adminToken}`])
      .send({ studentIds: [1], format: 'EXCEL' });
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });

  it('POST /api/admin/users/students/export (PDF) should return 200 and application/pdf file', async () => {
    const res = await request(app)
      .post('/api/admin/users/students/export')
      .set('Cookie', [`accessToken=${adminToken}`])
      .send({ studentIds: [1], format: 'PDF' });
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  it('POST /api/admin/users/students/import should process file upload and return ImportSummaryResponse', async () => {
    const res = await request(app)
      .post('/api/admin/users/students/import')
      .set('Cookie', [`accessToken=${adminToken}`])
      .attach('file', Buffer.from('Roll Number,Name,Email\n218X1A0502,Jane Doe,jane@example.test'), 'students.csv');
    expect(res.statusCode).toEqual(200);
    expect(res.body.created).toEqual(1);
    expect(res.body.importedStudents.length).toEqual(1);
    expect(res.body.importedStudents[0].rollNumber).toEqual('218X1A0502');
  });
});
