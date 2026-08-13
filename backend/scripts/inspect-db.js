const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log('--- Checking Admin Users ---');
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  for (const admin of admins) {
    console.log(`ID: ${admin.id}, Email: ${admin.email}, Status: ${admin.accountStatus}`);
    console.log(`Hash: ${admin.password}`);
    const isMatch = await bcrypt.compare('admin123', admin.password);
    console.log(`  Password 'admin123' match: ${isMatch}`);
  }
  
  console.log('\n--- Checking Alumni 21 ---');
  const alumni = await prisma.alumni.findUnique({ where: { id: 21 } });
  if (alumni) {
    console.log(`ID: ${alumni.id}, Doc URL: ${alumni.verificationDocumentUrl}, Doc Name: ${alumni.verificationDocumentName}`);
  } else {
    console.log('Alumni 21 not found!');
  }
}
main().finally(() => prisma.$disconnect());
