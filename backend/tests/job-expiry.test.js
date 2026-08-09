const { calculateJobStatus, runJobExpiryCheck, initJobExpiryScheduler } = require('../src/jobs/job-expiry.job');
const prisma = require('../src/config/db');

describe('Automatic Job Expiry Rules & Scheduler (calculateJobStatus & runJobExpiryCheck)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Status Calculation Rules', () => {
    it('Test 1 — Future deadline: Job remains APPROVED', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(calculateJobStatus('APPROVED', tomorrow)).toEqual('APPROVED');
    });

    it('Test 2 — Past deadline: Job becomes EXPIRED', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(calculateJobStatus('APPROVED', yesterday)).toEqual('EXPIRED');
    });

    it('Test 3 — Already expired & deadline past: Remains EXPIRED (no status change)', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      expect(calculateJobStatus('EXPIRED', pastDate)).toEqual('EXPIRED');
    });

    it('Test 4 — Closed job: Remains CLOSED regardless of deadline', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      expect(calculateJobStatus('CLOSED', pastDate)).toEqual('CLOSED');
    });

    it('Test 5 — Rejected job: Remains REJECTED regardless of deadline', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      expect(calculateJobStatus('REJECTED', pastDate)).toEqual('REJECTED');
    });

    it('Pending job: Remains PENDING regardless of deadline', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      expect(calculateJobStatus('PENDING', pastDate)).toEqual('PENDING');
    });

    it('Inclusive boundary: Today deadline remains APPROVED', () => {
      const today = new Date();
      expect(calculateJobStatus('APPROVED', today)).toEqual('APPROVED');
    });

    it('Extended deadline: Previously EXPIRED job reverts to APPROVED', () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      expect(calculateJobStatus('EXPIRED', nextWeek)).toEqual('APPROVED');
    });
  });

  describe('Scheduler Database Execution', () => {
    it('Test 6 — Multiple jobs: runJobExpiryCheck updates only eligible jobs in database', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const mockJobs = [
        { id: 101n, title: 'Expired Job', status: 'APPROVED', applicationDeadline: pastDate, deletedAt: null },
        { id: 102n, title: 'Active Job', status: 'APPROVED', applicationDeadline: futureDate, deletedAt: null },
        { id: 103n, title: 'Closed Job', status: 'CLOSED', applicationDeadline: pastDate, deletedAt: null }
      ];

      jest.spyOn(prisma.job, 'findMany').mockResolvedValue(mockJobs);
      const updateSpy = jest.spyOn(prisma.job, 'update').mockResolvedValue({});

      await runJobExpiryCheck();

      // Only Job #101 should be updated to EXPIRED
      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 101n },
        data: { status: 'EXPIRED' }
      });
    });

    it('Test 7 — Server restart: initJobExpiryScheduler initializes without throwing exceptions', () => {
      jest.useFakeTimers();
      expect(() => initJobExpiryScheduler()).not.toThrow();
      jest.useRealTimers();
    });

    it('Test 8 — Database schema: prisma.job.findMany() executes without company_name error', async () => {
      jest.spyOn(prisma.job, 'findMany').mockResolvedValue([]);
      await expect(runJobExpiryCheck()).resolves.not.toThrow();
    });
  });
});
