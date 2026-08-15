const prisma = require('../src/config/db');

async function main() {
  console.log('ℹ️ Running production cleanup for test/mock job records...');

  // Identify test/mock job records by title pattern or legacy placeholder
  const testJobs = await prisma.job.findMany({
    where: {
      OR: [
        { title: { contains: 'Legacy Engineering Role', mode: 'insensitive' } },
        { companyName: { contains: 'Legacy Corp', mode: 'insensitive' } },
        { title: { contains: 'Test Job', mode: 'insensitive' } },
        { title: { contains: 'Spoofed', mode: 'insensitive' } }
      ]
    }
  });

  console.log(`ℹ️ Found ${testJobs.length} test/mock job record(s) for cleanup:`, testJobs.map(j => ({ id: Number(j.id), title: j.title, company: j.companyName })));

  if (testJobs.length > 0) {
    const testJobIds = testJobs.map(j => j.id);
    
    // Delete applications associated with test jobs first
    await prisma.application.deleteMany({
      where: { jobId: { in: testJobIds } }
    });

    // Delete test jobs
    const deleteResult = await prisma.job.deleteMany({
      where: { id: { in: testJobIds } }
    });

    console.log(`✅ Successfully cleaned up ${deleteResult.count} test/mock job record(s).`);
  } else {
    console.log('✅ No mock/test job records found in database.');
  }

  const remainingCount = await prisma.job.count();
  console.log(`ℹ️ Remaining legitimate user-created jobs in database: ${remainingCount}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Data cleanup failed:', err);
  process.exit(1);
});
