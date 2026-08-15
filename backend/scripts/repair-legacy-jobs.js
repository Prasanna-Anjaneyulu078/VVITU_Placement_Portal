const prisma = require('../src/config/db');

async function main() {
  // Find active SuperAdmin or Admin user
  let superAdminUser = await prisma.user.findFirst({
    where: { email: 'super.admin@vvit.edu.in' }
  });

  if (!superAdminUser) {
    superAdminUser = await prisma.user.findFirst({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } }
    });
  }

  if (!superAdminUser) {
    console.error('❌ No SuperAdmin or Admin user found in database for data repair.');
    process.exit(1);
  }

  const superAdminId = superAdminUser.id;
  console.log(`ℹ️ Using Admin/SuperAdmin user ID ${Number(superAdminId)} (${superAdminUser.name || 'Placement Cell Admin'}, ${superAdminUser.email}) for legacy job repairs.`);

  // Find legacy jobs with no creator relationship
  const legacyJobs = await prisma.job.findMany({
    where: {
      createdById: null,
      postedByAlumniId: null
    }
  });

  console.log(`ℹ️ Found ${legacyJobs.length} legacy job(s) requiring creator data repair.`);

  if (legacyJobs.length > 0) {
    const updatedResult = await prisma.job.updateMany({
      where: {
        createdById: null,
        postedByAlumniId: null
      },
      data: {
        createdById: superAdminId
      }
    });

    console.log(`✅ Repaired ${updatedResult.count} legacy job record(s). Assigned createdById = ${Number(superAdminId)}.`);
  } else {
    console.log('✅ All jobs already have valid creator relationships.');
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Legacy job repair failed:', err);
  process.exit(1);
});
