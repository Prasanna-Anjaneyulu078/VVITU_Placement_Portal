const prisma = require('../config/db');

/**
 * Calculates computed Job Status based on Spring Boot rules:
 * - CLOSED -> stays CLOSED
 * - REJECTED -> stays REJECTED
 * - PENDING -> stays PENDING
 * - If today > applicationDeadline -> EXPIRED
 * - If current is EXPIRED but deadline extended (today <= applicationDeadline) -> APPROVED
 */
const calculateJobStatus = (currentStatus, applicationDeadline) => {
  if (currentStatus === 'CLOSED') return 'CLOSED';
  if (currentStatus === 'REJECTED') return 'REJECTED';
  if (currentStatus === 'PENDING') return 'PENDING';

  if (applicationDeadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(applicationDeadline);
    deadline.setHours(0, 0, 0, 0);

    // Inclusive on deadline date: today > deadline triggers EXPIRED
    if (today.getTime() > deadline.getTime()) {
      return 'EXPIRED';
    }

    if (currentStatus === 'EXPIRED') {
      return 'APPROVED';
    }
  }

  return currentStatus || 'APPROVED';
};

const runJobExpiryCheck = async () => {
  try {
    const jobs = await prisma.job.findMany({
      where: { deletedAt: null }
    });

    let updatedCount = 0;

    for (const job of jobs) {
      const current = job.status;
      const deadline = job.applicationDeadline;
      const computed = calculateJobStatus(current, deadline);

      if (computed !== current) {
        await prisma.job.update({
          where: { id: job.id },
          data: { status: computed }
        });
        updatedCount++;
        console.log(`[JOB-EXPIRY-SCHEDULER] Job ID ${job.id} ("${job.title}") status updated from ${current} to ${computed}`);
      }
    }

    if (updatedCount > 0) {
      console.log(`[JOB-EXPIRY-SCHEDULER] Updated ${updatedCount} job statuses.`);
    }
  } catch (err) {
    console.warn('[JOB-EXPIRY-SCHEDULER] Job expiry check:', err.message);
  }
};

const initJobExpiryScheduler = () => {
  // Initial run after 5 seconds
  setTimeout(() => {
    runJobExpiryCheck();
  }, 5000);

  // Periodic run every 15 minutes (900000ms)
  const timer = setInterval(() => {
    runJobExpiryCheck();
  }, 900000);

  if (timer.unref) {
    timer.unref(); // Prevents timer from keeping Node process alive in tests
  }
};

module.exports = {
  calculateJobStatus,
  runJobExpiryCheck,
  initJobExpiryScheduler
};
