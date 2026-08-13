const prisma = require('../src/config/db');

async function test() {
  await prisma.$queryRaw`SELECT 1`;
  const u = await prisma.user.count();
  const s = await prisma.student.count();
  const j = await prisma.job.count();
  const sk = await prisma.studentSkill.count();
  const r = await prisma.resume.count();
  const al = await prisma.alumni.count();
  const al_log = await prisma.auditLog.count();
  const ocr = await prisma.ocrAuditLog.count();

  console.log('[PostgreSQL] ✅ Connected successfully');
  console.log(`  users:         ${u}`);
  console.log(`  students:      ${s}`);
  console.log(`  alumni:        ${al}`);
  console.log(`  jobs:          ${j}`);
  console.log(`  skills:        ${sk}`);
  console.log(`  resumes:       ${r}`);
  console.log(`  audit_logs:    ${al_log}`);
  console.log(`  ocr_logs:      ${ocr}`);

  // Verify the admin user exists
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (admin) {
    console.log(`\n[AUTH] Admin user found: ${admin.email} (id=${admin.id})`);
  } else {
    console.log('\n[AUTH] ⚠️  No admin user found');
  }

  // Verify password hash is preserved
  if (admin && admin.password) {
    console.log(`[AUTH] Password hash present: ${admin.password.substring(0, 20)}...`);
  }

  await prisma.$disconnect();
  console.log('\n[RESULT] ✅ PostgreSQL connection verified');
}

test().catch(e => {
  console.error('[FAIL]', e.message);
  process.exit(1);
});
