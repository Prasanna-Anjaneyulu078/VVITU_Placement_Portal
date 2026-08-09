const prisma = require('../src/config/db');

async function main() {
  try {
    const cols = await prisma.$queryRawUnsafe('DESCRIBE skills;');
    console.log('--- SKILLS TABLE COLUMNS ---');
    console.log(cols);
  } catch (err) {
    console.error('Error describing skills table:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
