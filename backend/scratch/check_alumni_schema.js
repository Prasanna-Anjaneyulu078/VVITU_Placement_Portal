const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const cols = await prisma.$queryRawUnsafe('DESCRIBE alumni;');
    console.log('--- ALUMNI TABLE COLUMNS ---');
    console.log(cols);
  } catch (err) {
    console.error('Error describing alumni table:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
