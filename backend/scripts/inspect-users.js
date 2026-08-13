const prisma = require('../src/config/db');

async function inspectUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        student: true,
        alumni: true,
        adminProfile: true
      }
    });

    console.log('--- CURRENT DATABASE USERS ---');
    console.log(`Total Users: ${users.length}`);

    users.forEach(u => {
      console.log(`ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Status: ${u.accountStatus}`);
    });

    const admin = users.find(u => u.email.toLowerCase() === 'admin@vvit.edu.in');
    const student = users.find(u => u.email.toLowerCase() === 'prasannaanjaneyulu078@gmail.com');

    console.log('\n--- PROTECTED ACCOUNTS CHECK ---');
    console.log('Admin (admin@vvit.edu.in):', admin ? `FOUND (ID: ${admin.id}, Role: ${admin.role})` : 'NOT FOUND!');
    console.log('Student (prasannaanjaneyulu078@gmail.com):', student ? `FOUND (ID: ${student.id}, Role: ${student.role})` : 'NOT FOUND!');

  } catch (err) {
    console.error('Error inspecting users:', err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectUsers();
