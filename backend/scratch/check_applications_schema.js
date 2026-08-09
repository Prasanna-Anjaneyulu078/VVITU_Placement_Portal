const prisma = require('../src/config/db');

async function main() {
  try {
    const cols = await prisma.$queryRawUnsafe('DESCRIBE applications;');
    console.log('--- APPLICATIONS TABLE COLUMNS ---');
    console.log(cols);
  } catch (err) {
    console.error('Error describing applications table:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
