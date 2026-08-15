const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');
const prisma = require('../src/config/db');
const JobService = require('../src/services/job.service');

jest.setTimeout(30000);

describe('Job Poster Identity Service Tests', () => {
  let testAdminUser;
  let testAlumniUser;
  let testAlumniProfile;

  beforeAll(async () => {
    // Create test Admin user
    testAdminUser = await prisma.user.create({
      data: {
        name: 'Satish Kumar',
        email: `satish.admin.${Date.now()}@vvit.net`,
        role: 'ADMIN',
        accountStatus: 'ACTIVE'
      }
    });

    // Create test Alumni user & profile
    testAlumniUser = await prisma.user.create({
      data: {
        name: 'Venkata Prasanna',
        email: `prasanna.alumni.${Date.now()}@vvit.net`,
        role: 'ALUMNI',
        accountStatus: 'ACTIVE'
      }
    });

    testAlumniProfile = await prisma.alumni.create({
      data: {
        userId: testAlumniUser.id,
        verificationStatus: 'VERIFIED',
        company: 'Microsoft',
        designation: 'SDE'
      }
    });
  });

  afterAll(async () => {
    // Cleanup created jobs and users
    const userIds = [testAdminUser?.id, testAlumniUser?.id].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.job.deleteMany({
        where: {
          createdById: { in: userIds }
        }
      });
    }
    if (testAlumniProfile) await prisma.alumni.delete({ where: { id: testAlumniProfile.id } });
    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  });

  it('1. Should display actual Admin user name when Admin creates a job', async () => {
    const jobPayload = {
      title: 'Senior Backend Engineer',
      company: 'Google',
      location: 'Hyderabad',
      jobType: 'Full-Time'
    };

    const newJob = await JobService.createJob(Number(testAdminUser.id), 'ADMIN', jobPayload);
    expect(newJob).toBeDefined();

    const fetchedJob = await JobService.getJobById(newJob.id);
    expect(fetchedJob.postedBy).toBeDefined();
    expect(fetchedJob.postedBy.name).toBe('Satish Kumar');
    expect(fetchedJob.postedBy.role).toBe('ADMIN');
  });

  it('2. Should display actual Alumni user name when Alumni creates a job', async () => {
    const jobPayload = {
      title: 'Full Stack Developer',
      company: 'Microsoft',
      location: 'Bangalore',
      jobType: 'Full-Time'
    };

    const newJob = await JobService.createJob(Number(testAlumniUser.id), 'ALUMNI', jobPayload);
    expect(newJob).toBeDefined();

    const fetchedJob = await JobService.getJobById(newJob.id);
    expect(fetchedJob.postedBy).toBeDefined();
    expect(fetchedJob.postedBy.name).toBe('Venkata Prasanna');
    expect(fetchedJob.postedBy.role).toBe('ALUMNI');
  });

  it('3. Should ignore spoofed poster fields sent in request body and use authenticated user name', async () => {
    const spoofedPayload = {
      title: 'Cybersecurity Analyst',
      company: 'Amazon',
      postedBy: 'Fake Admin Name',
      postedByName: 'Spoofed User',
      createdByName: 'Imposter'
    };

    const newJob = await JobService.createJob(Number(testAdminUser.id), 'ADMIN', spoofedPayload);
    const fetchedJob = await JobService.getJobById(newJob.id);

    expect(fetchedJob.postedBy.name).toBe('Satish Kumar');
    expect(fetchedJob.postedBy.name).not.toBe('Fake Admin Name');
    expect(fetchedJob.postedBy.name).not.toBe('Spoofed User');
  });

  it('4. Should fallback safely to VVIT Placement Cell for legacy jobs missing creator info', async () => {
    const legacyJob = await prisma.job.create({
      data: {
        title: 'Legacy Engineering Role',
        companyName: 'Legacy Corp',
        status: 'APPROVED'
      }
    });

    const fetchedJob = await JobService.getJobById(Number(legacyJob.id));
    expect(fetchedJob.postedBy.name).toBe('VVIT Placement Cell');
    expect(fetchedJob.postedBy.role).toBe('ADMIN');

    // Cleanup legacy job
    await prisma.job.delete({ where: { id: legacyJob.id } });
  });
});
