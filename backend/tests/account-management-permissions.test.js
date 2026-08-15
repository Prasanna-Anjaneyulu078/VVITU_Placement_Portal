const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');
const request = require('supertest');
const express = require('express');
const prisma = require('../src/config/db');
const jwtUtils = require('../src/utils/jwt.utils');
const superAdminRoutes = require('../src/routes/superAdmin.routes');
const adminRoutes = require('../src/routes/admin.routes');
const authRoutes = require('../src/routes/auth.routes');
const { errorHandler } = require('../src/middleware/error.middleware');

jest.setTimeout(30000);

const app = express();
app.use(express.json());
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Role-Based Account Management Permission Matrix Tests', () => {
  let superAdminUser;
  let superAdminToken;
  let adminUser;
  let adminToken;
  let studentUser;
  let studentToken;

  beforeAll(async () => {
    // 1. Create SUPER_ADMIN test user & token
    superAdminUser = await prisma.user.create({
      data: {
        name: 'Test SuperAdmin',
        email: `superadmin.${Date.now()}@vvit.net`,
        role: 'SUPER_ADMIN',
        accountStatus: 'ACTIVE'
      }
    });
    superAdminToken = jwtUtils.generateAccessToken({ id: Number(superAdminUser.id), email: superAdminUser.email, role: 'SUPER_ADMIN' });

    // 2. Create ADMIN test user & token
    adminUser = await prisma.user.create({
      data: {
        name: 'Test NormalAdmin',
        email: `admin.${Date.now()}@vvit.net`,
        role: 'ADMIN',
        accountStatus: 'ACTIVE'
      }
    });
    adminToken = jwtUtils.generateAccessToken({ id: Number(adminUser.id), email: adminUser.email, role: 'ADMIN' });

    // 3. Create STUDENT test user & token
    studentUser = await prisma.user.create({
      data: {
        name: 'Test Student',
        email: `student.${Date.now()}@vvit.net`,
        role: 'STUDENT',
        accountStatus: 'ACTIVE'
      }
    });
    studentToken = jwtUtils.generateAccessToken({ id: Number(studentUser.id), email: studentUser.email, role: 'STUDENT' });
  });

  afterAll(async () => {
    // Cleanup created test accounts
    const testEmails = [superAdminUser?.email, adminUser?.email, studentUser?.email].filter(Boolean);
    const createdUsers = await prisma.user.findMany({ where: { email: { in: testEmails } }, select: { id: true } });
    const userIds = createdUsers.map(u => u.id);

    if (userIds.length > 0) {
      await prisma.student.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.adminProfile.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  });

  it('1. SUPER_ADMIN can create an Admin account', async () => {
    const newAdminEmail = `created.admin.${Date.now()}@vvit.net`;
    const res = await request(app)
      .post('/api/superadmin/admins')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'New Created Admin',
        email: newAdminEmail,
        department: 'CSE',
        designation: 'Assistant Admin'
      });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(newAdminEmail);

    // Cleanup created admin
    const createdUser = await prisma.user.findUnique({ where: { email: newAdminEmail } });
    if (createdUser) {
      await prisma.adminProfile.deleteMany({ where: { userId: createdUser.id } });
      await prisma.user.delete({ where: { id: createdUser.id } });
    }
  });

  it('2. SUPER_ADMIN can create a Student account', async () => {
    const rollNumber = `22BQ1A${Math.floor(1000 + Math.random() * 9000)}`;
    const newStudentEmail = `student.${rollNumber.toLowerCase()}@vvit.net`;

    const res = await request(app)
      .post('/api/admin/users/students')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'SuperAdmin Created Student',
        email: newStudentEmail,
        rollNumber: rollNumber,
        department: 'CSE'
      });

    expect(res.status).toBe(200);
    expect(res.body.identifier).toBe(rollNumber);

    // Cleanup
    const createdUser = await prisma.user.findUnique({ where: { email: newStudentEmail } });
    if (createdUser) {
      await prisma.student.deleteMany({ where: { userId: createdUser.id } });
      await prisma.user.delete({ where: { id: createdUser.id } });
    }
  });

  it('3. ADMIN can create a Student account', async () => {
    const rollNumber = `22BQ1A${Math.floor(1000 + Math.random() * 9000)}`;
    const newStudentEmail = `student.${rollNumber.toLowerCase()}@vvit.net`;

    const res = await request(app)
      .post('/api/admin/users/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'NormalAdmin Created Student',
        email: newStudentEmail,
        rollNumber: rollNumber,
        department: 'ECE'
      });

    expect(res.status).toBe(200);
    expect(res.body.identifier).toBe(rollNumber);

    // Cleanup
    const createdUser = await prisma.user.findUnique({ where: { email: newStudentEmail } });
    if (createdUser) {
      await prisma.student.deleteMany({ where: { userId: createdUser.id } });
      await prisma.user.delete({ where: { id: createdUser.id } });
    }
  });

  it('4. ADMIN attempting to create an Admin account returns HTTP 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/admin/users/admins')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Unauthorized Admin',
        email: `unauth.${Date.now()}@vvit.net`
      });

    expect(res.status).toBe(403);
  });

  it('5. STUDENT attempting to create a Student account returns HTTP 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/admin/users/students')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Student Trying To Create Student',
        email: `illegal.${Date.now()}@vvit.net`,
        rollNumber: '22BQ1A0999'
      });

    expect(res.status).toBe(403);
  });
});
