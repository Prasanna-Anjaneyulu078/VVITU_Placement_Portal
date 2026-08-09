const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const cols = await prisma.$queryRawUnsafe('DESCRIBE jobs;');
    console.log('--- JOBS TABLE COLUMNS ---');
    console.log(cols);
  } catch (err) {
    console.error('Error describing jobs table:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
