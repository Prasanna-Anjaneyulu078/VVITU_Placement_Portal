const ApplicationService = require('../src/services/application.service');
const EligibilityService = require('../src/services/eligibility.service');
const prisma = require('../src/config/db');

describe('ApplicationService.applyForJob Direct Unit Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws 400 for invalid jobId (non-numeric)', async () => {
    await expect(ApplicationService.applyForJob(1, 'abc', [])).rejects.toEqual({
      statusCode: 400,
      message: 'Invalid job ID'
    });
  });

  it('throws 404 if student profile is missing', async () => {
    jest.spyOn(prisma.student, 'findUnique').mockResolvedValue(null);

    await expect(ApplicationService.applyForJob(99, 4, [])).rejects.toEqual({
      statusCode: 404,
      message: 'Student profile not found'
    });
  });

  it('throws 404 if job posting does not exist', async () => {
    jest.spyOn(prisma.student, 'findUnique').mockResolvedValue({ id: 10, userId: 99 });
    jest.spyOn(prisma.job, 'findUnique').mockResolvedValue(null);

    await expect(ApplicationService.applyForJob(99, 999, [])).rejects.toEqual({
      statusCode: 404,
      message: 'Job posting not found'
    });
  });

  it('throws 400 if job is not APPROVED', async () => {
    jest.spyOn(prisma.student, 'findUnique').mockResolvedValue({ id: 10, userId: 99 });
    jest.spyOn(prisma.job, 'findUnique').mockResolvedValue({ id: 4n, status: 'PENDING', deletedAt: null });

    await expect(ApplicationService.applyForJob(99, 4, [])).rejects.toEqual({
      statusCode: 400,
      message: 'Applications are not currently accepted for this job'
    });
  });

  it('throws 400 if job deadline has passed', async () => {
    const pastDate = new Date(Date.now() - 86400000);
    jest.spyOn(prisma.student, 'findUnique').mockResolvedValue({ id: 10, userId: 99 });
    jest.spyOn(prisma.job, 'findUnique').mockResolvedValue({ id: 4n, status: 'APPROVED', applicationDeadline: pastDate, deletedAt: null });

    await expect(ApplicationService.applyForJob(99, 4, [])).rejects.toEqual({
      statusCode: 400,
      message: 'Application deadline for this job has passed'
    });
  });

  it('throws 400 if student is ineligible', async () => {
    jest.spyOn(prisma.student, 'findUnique').mockResolvedValue({ id: 10, userId: 99 });
    jest.spyOn(prisma.job, 'findUnique').mockResolvedValue({ id: 4n, status: 'APPROVED', applicationDeadline: null, deletedAt: null });
    jest.spyOn(EligibilityService, 'validateEligibility').mockResolvedValue({
      isEligible: false,
      status: 'NOT_ELIGIBLE',
      rejectionReason: 'Not eligible due to: CGPA low'
    });

    await expect(ApplicationService.applyForJob(99, 4, [])).rejects.toEqual({
      statusCode: 400,
      message: 'Not eligible due to: CGPA low'
    });
  });

  it('throws 409 if student has already applied for this job', async () => {
    jest.spyOn(prisma.student, 'findUnique').mockResolvedValue({ id: 10, userId: 99 });
    jest.spyOn(prisma.job, 'findUnique').mockResolvedValue({ id: 4n, status: 'APPROVED', applicationDeadline: null, deletedAt: null });
    jest.spyOn(EligibilityService, 'validateEligibility').mockResolvedValue({
      isEligible: true,
      status: 'ELIGIBLE'
    });
    jest.spyOn(prisma.application, 'findFirst').mockResolvedValue({ id: 100n, jobId: 4n, studentId: 10n });

    await expect(ApplicationService.applyForJob(99, 4, [])).rejects.toEqual({
      statusCode: 409,
      message: 'You have already applied for this job.'
    });
  });

  it('creates application and processes screening answers correctly', async () => {
    jest.spyOn(prisma.student, 'findUnique').mockResolvedValue({ id: 10n, userId: 99n });
    jest.spyOn(prisma.job, 'findUnique').mockResolvedValue({ id: 4n, status: 'APPROVED', applicationDeadline: null, deletedAt: null });
    jest.spyOn(EligibilityService, 'validateEligibility').mockResolvedValue({
      isEligible: true,
      status: 'ELIGIBLE'
    });
    jest.spyOn(prisma.application, 'findFirst').mockResolvedValue(null);

    const mockTxApp = { id: 50n, jobId: 4n, studentId: 10n, status: 'APPLIED', appliedAt: new Date() };
    jest.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
      const tx = {
        application: {
          create: jest.fn().mockResolvedValue(mockTxApp)
        },
        applicationScreeningAnswer: {
          createMany: jest.fn().mockResolvedValue({ count: 2 })
        }
      };
      return await callback(tx);
    });

    const screeningAnswers = [
      { questionKey: 'Q1', questionText: 'Available immediately?', answer: 'Yes' },
      { questionKey: 'Q2', questionText: 'Willing to relocate?', answer: 'Yes' }
    ];

    const result = await ApplicationService.applyForJob(99, 4, screeningAnswers);

    expect(result.success).toBe(true);
    expect(result.applicationId).toBe(50);
    expect(result.application.status).toBe('APPLIED');
  });
});
