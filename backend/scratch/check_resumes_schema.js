const prisma = require('../src/config/db');

async function main() {
  try {
    const cols = await prisma.$queryRawUnsafe('DESCRIBE resumes;');
    console.log('--- RESUMES TABLE COLUMNS ---');
    console.log(cols);
  } catch (err) {
    console.error('Error describing resumes table:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
