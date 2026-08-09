const prisma = require('../src/config/db');

async function main() {
  try {
    const cols = await prisma.$queryRawUnsafe('DESCRIBE admin_profiles;');
    console.log('--- ADMIN_PROFILES TABLE COLUMNS ---');
    console.log(cols);
  } catch (err) {
    console.error('Error describing admin_profiles table:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
