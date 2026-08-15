const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');
const request = require('supertest');
const express = require('express');
const prisma = require('../src/config/db');
const jwtUtils = require('../src/utils/jwt.utils');
const jobRoutes = require('../src/routes/job.routes');
const studentRoutes = require('../src/routes/student.routes');
const { errorHandler } = require('../src/middleware/error.middleware');

jest.setTimeout(30000);

const app = express();
app.use(express.json());
app.use('/api/jobs', jobRoutes);
app.use('/api/student', studentRoutes);
app.use(errorHandler);

describe('Production-Grade Job Poster Resolution Tests', () => {
  let adminUser;
  let adminToken;
  let alumniUser;
  let alumniRecord;
  let alumniToken;
  let studentUser;
  let studentToken;
  let createdJobIds = [];

  beforeAll(async () => {
    // 1. Create Admin User
    adminUser = await prisma.user.create({
      data: {
        name: 'Satish Kumar',
        email: `satish.admin.${Date.now()}@vvit.edu.in`,
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
        adminProfile: {
          create: {
            mobileNumber: '9876543210',
            designation: 'Placement Officer',
            department: 'Placement Cell'
          }
        }
      }
    });
    adminToken = jwtUtils.generateAccessToken({ id: Number(adminUser.id), email: adminUser.email, role: 'ADMIN' });

    // 2. Create Alumni User
    alumniUser = await prisma.user.create({
      data: {
        name: 'Garikapati Ashritha',
        email: `ashritha.alumni.${Date.now()}@vvit.edu.in`,
        role: 'ALUMNI',
        accountStatus: 'ACTIVE',
        alumni: {
          create: {
            rollNumber: `20BQ1A${Math.floor(1000 + Math.random() * 9000)}`,
            company: 'Microsoft',
            designation: 'Software Engineer',
            passingYear: 2024,
            verificationStatus: 'VERIFIED'
          }
        }
      },
      include: { alumni: true }
    });
    alumniRecord = alumniUser.alumni;
    alumniToken = jwtUtils.generateAccessToken({ id: Number(alumniUser.id), email: alumniUser.email, role: 'ALUMNI' });

    // 3. Create Student User
    studentUser = await prisma.user.create({
      data: {
        name: 'Student Viewer',
        email: `student.viewer.${Date.now()}@vvit.edu.in`,
        role: 'STUDENT',
        accountStatus: 'ACTIVE',
        student: {
          create: {
            rollNumber: `22BQ1A${Math.floor(1000 + Math.random() * 9000)}`,
            department: 'CSE',
            semester: 6,
            cgpa: 8.5
          }
        }
      }
    });
    studentToken = jwtUtils.generateAccessToken({ id: Number(studentUser.id), email: studentUser.email, role: 'STUDENT' });
  });

  afterAll(async () => {
    if (createdJobIds.length > 0) {
      await prisma.job.deleteMany({ where: { id: { in: createdJobIds.map(BigInt) } } });
    }
    const testUserIds = [adminUser?.id, alumniUser?.id, studentUser?.id].filter(Boolean);
    if (testUserIds.length > 0) {
      await prisma.student.deleteMany({ where: { userId: { in: testUserIds } } });
      await prisma.alumni.deleteMany({ where: { userId: { in: testUserIds } } });
      await prisma.adminProfile.deleteMany({ where: { userId: { in: testUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
    }
  });

  it('1. Admin posting a job resolves actual Admin name & role', async () => {
    const res = await request(app)
      .post('/api/jobs/post')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Senior Cloud Engineer',
        company: 'CloudScale Software Solutions',
        description: 'Lead AWS infrastructure',
        postedBy: 'Spoofed Name' // Should be ignored by backend!
      });

    expect(res.status).toBe(201);
    const jobId = res.body.id;
    createdJobIds.push(jobId);

    // Update job status to APPROVED for public viewing
    await prisma.job.update({
      where: { id: BigInt(jobId) },
      data: { status: 'APPROVED' }
    });

    // Fetch created job details via student endpoint
    const fetchRes = await request(app)
      .get(`/api/student/jobs/${jobId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.postedBy).toBeDefined();
    expect(fetchRes.body.postedBy.name).toBe('Satish Kumar');
    expect(fetchRes.body.postedBy.role).toBe('ADMIN');
  });

  it('2. Alumni posting a job resolves actual Alumni name & role', async () => {
    const res = await request(app)
      .post('/api/jobs/post')
      .set('Authorization', `Bearer ${alumniToken}`)
      .send({
        title: 'Software Engineer II',
        company: 'Microsoft',
        description: 'Azure Cloud Platform'
      });

    expect(res.status).toBe(201);
    const jobId = res.body.id;
    createdJobIds.push(jobId);

    await prisma.job.update({
      where: { id: BigInt(jobId) },
      data: { status: 'APPROVED' }
    });

    const fetchRes = await request(app)
      .get(`/api/student/jobs/${jobId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.postedBy).toBeDefined();
    expect(fetchRes.body.postedBy.name).toBe('Garikapati Ashritha');
    expect(fetchRes.body.postedBy.role).toBe('ALUMNI');
  });

  it('3. Job poster identity remains constant regardless of which student views the job', async () => {
    // Create student 2
    const student2 = await prisma.user.create({
      data: {
        name: 'Another Student',
        email: `student2.${Date.now()}@vvit.edu.in`,
        role: 'STUDENT',
        accountStatus: 'ACTIVE',
        student: {
          create: {
            rollNumber: `22BQ1A${Math.floor(1000 + Math.random() * 9000)}`,
            department: 'ECE',
            semester: 6,
            cgpa: 8.0
          }
        }
      }
    });
    const student2Token = jwtUtils.generateAccessToken({ id: Number(student2.id), email: student2.email, role: 'STUDENT' });

    const adminJobId = createdJobIds[0];

    const view1 = await request(app)
      .get(`/api/student/jobs/${adminJobId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    const view2 = await request(app)
      .get(`/api/student/jobs/${adminJobId}`)
      .set('Authorization', `Bearer ${student2Token}`);

    expect(view1.body.postedBy.name).toBe('Satish Kumar');
    expect(view2.body.postedBy.name).toBe('Satish Kumar');

    // Cleanup student 2
    await prisma.student.deleteMany({ where: { userId: student2.id } });
    await prisma.user.delete({ where: { id: student2.id } });
  });
});
