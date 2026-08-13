const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting DB cleanup script...');
  try {
    // Fix orphan jobs posted_by_id to allow Prisma to push schema changes
    console.log('Fixing orphan jobs...');
    await prisma.$executeRawUnsafe(`
      UPDATE jobs j 
      LEFT JOIN alumni a ON j.posted_by_id = a.id 
      SET j.posted_by_id = NULL 
      WHERE j.posted_by_id IS NOT NULL AND a.id IS NULL;
    `);

    // Wipe old seeded skills
    console.log('Wiping all StudentSkill records to start fresh...');
    await prisma.$executeRawUnsafe('DELETE FROM skills;');

    console.log('Cleanup successful!');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
