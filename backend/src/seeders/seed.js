const prisma = require('../config/db');
const { hashPassword } = require('../utils/password.utils');

async function main() {
  console.log('🌱 Seeding database default accounts...');

  const adminPassword = await hashPassword('Admin@123');
  const alumniPassword = await hashPassword('Alumni@123');

  // 1. Seed System Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@vvit.ac.in' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@vvit.ac.in',
      password: adminPassword,
      role: 'ADMIN',
      accountStatus: 'ACTIVE'
    }
  });

  await prisma.adminProfile.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      department: 'Administration',
      designation: 'System Admin'
    }
  });

  // 2. Seed Default Alumni
  const alumniUser = await prisma.user.upsert({
    where: { email: 'alumni@vvit.ac.in' },
    update: {},
    create: {
      name: 'Jane Smith',
      email: 'alumni@vvit.ac.in',
      password: alumniPassword,
      role: 'ALUMNI',
      accountStatus: 'ACTIVE'
    }
  });

  await prisma.alumni.upsert({
    where: { userId: alumniUser.id },
    update: {},
    create: {
      userId: alumniUser.id,
      company: 'Tech Corp',
      designation: 'Software Engineer',
      passingYear: 2019,
      verificationStatus: 'VERIFIED'
    }
  });

  console.log('✅ Seeding completed successfully!');
  console.log('👤 ADMIN:  admin@vvit.ac.in / Admin@123');
  console.log('🏢 ALUMNI: alumni@vvit.ac.in / Alumni@123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
