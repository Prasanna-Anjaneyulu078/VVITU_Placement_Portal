const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const s = await prisma.student.findMany({ select: { department: true }, distinct: ['department'] });
  console.log('Students:', s);
  const a = await prisma.alumni.findMany({ select: { department: true }, distinct: ['department'] });
  console.log('Alumni:', a);
  const p = await prisma.adminProfile.findMany({ select: { department: true }, distinct: ['department'] });
  console.log('Admins:', p);
}

run().catch(console.error).finally(() => prisma.$disconnect());
