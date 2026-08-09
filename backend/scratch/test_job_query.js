const { runJobExpiryCheck } = require('../src/jobs/job-expiry.job');
const prisma = require('../src/config/db');

async function testJobQuery() {
  console.log('Testing prisma.job.findMany()...');
  try {
    const jobs = await prisma.job.findMany({ where: { deletedAt: null } });
    console.log(`Successfully fetched ${jobs.length} jobs from MySQL database!`);
    console.log('Sample job:', jobs[0] || 'No jobs currently in database');

    console.log('\nTesting runJobExpiryCheck()...');
    await runJobExpiryCheck();
    console.log('runJobExpiryCheck executed successfully without errors!');
  } catch (err) {
    console.error('FAILED during job query:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testJobQuery();
