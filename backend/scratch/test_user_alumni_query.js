const prisma = require('../src/config/db');

async function testUserAlumniQuery() {
  console.log('Testing prisma.user.findUnique with alumni inclusion...');
  try {
    const users = await prisma.user.findMany({
      where: { role: 'ALUMNI' },
      include: { alumni: true },
      take: 5
    });
    console.log(`Successfully fetched ${users.length} ALUMNI users with alumni profiles from MySQL database!`);
    if (users.length > 0) {
      console.log('Sample alumni user:', JSON.stringify(users[0], (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
    } else {
      console.log('No alumni records in database yet.');
    }
  } catch (err) {
    console.error('FAILED during alumni user query:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testUserAlumniQuery();
