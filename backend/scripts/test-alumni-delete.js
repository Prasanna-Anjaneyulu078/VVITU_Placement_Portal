const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function testDelete() {
  console.log('--- Creating Dummy Alumni ---');
  const user = await prisma.user.create({
    data: {
      name: 'Dummy Alumni',
      email: 'dummyalumni@vvit.edu.in',
      password: await bcrypt.hash('password123', 10),
      role: 'ALUMNI',
      accountStatus: 'ACTIVE'
    }
  });

  const alumni = await prisma.alumni.create({
    data: {
      userId: user.id,
      rollNumber: 'DUMMY123',
      company: 'Dummy Inc',
      designation: 'SDE',
      verificationStatus: 'PENDING'
    }
  });

  console.log(`Created Alumni ID: ${alumni.id}`);
  
  console.log('--- Testing Deletion Service ---');
  const AdminService = require('../src/services/admin.service');
  try {
    const result = await AdminService.deleteAlumni(alumni.id, 'admin@vvit.edu.in', '127.0.0.1');
    console.log('Delete successful:', result);
  } catch (err) {
    console.error('Delete failed:', err.statusCode, err.message);
  }

  // Verify deletion
  const checkUser = await prisma.user.findUnique({ where: { id: user.id } });
  const checkAlumni = await prisma.alumni.findUnique({ where: { id: alumni.id } });
  console.log(`User exists? ${!!checkUser}`);
  console.log(`Alumni exists? ${!!checkAlumni}`);
}

testDelete().finally(() => prisma.$disconnect());
