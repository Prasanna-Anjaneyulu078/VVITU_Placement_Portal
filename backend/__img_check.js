const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const s = await p.student.findMany({ where: { profileImageUrl: { not: null } }, select: { id: true, rollNumber: true, profileImageUrl: true }, take: 5 });
  console.log('STUDENTS:', JSON.stringify(s));
  const a = await p.alumni.findMany({ where: { profileImageUrl: { not: null } }, select: { id: true, rollNumber: true, profileImageUrl: true }, take: 5 });
  console.log('ALUMNI:', JSON.stringify(a));
  const ad = await p.adminProfile.findMany({ where: { profileImageUrl: { not: null } }, select: { id: true, userId: true, profileImageUrl: true }, take: 5 });
  console.log('ADMINS:', JSON.stringify(ad));
  await p.();
}
run().catch(e => { console.error(e); p.(); });
