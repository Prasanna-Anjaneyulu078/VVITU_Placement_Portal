const prisma = require('../src/config/db');

async function main() {
  try {
    const cols = await prisma.$queryRawUnsafe('DESCRIBE students;');
    console.log('--- STUDENTS TABLE COLUMNS ---');
    console.log(cols);
  } catch (err) {
    console.error('Error describing students table:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
