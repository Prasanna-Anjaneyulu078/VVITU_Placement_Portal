const prisma = require('../src/config/db');

async function main() {
  try {
    const cols = await prisma.$queryRawUnsafe('DESCRIBE projects;');
    console.log('--- PROJECTS TABLE COLUMNS ---');
    console.log(cols);
  } catch (err) {
    console.error('Error describing projects table:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
