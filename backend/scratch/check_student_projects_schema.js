const prisma = require('../src/config/db');

async function main() {
  try {
    const cols = await prisma.$queryRawUnsafe('DESCRIBE student_projects;');
    console.log('--- STUDENT PROJECTS TABLE COLUMNS ---');
    console.log(cols);
  } catch (err) {
    console.error('Error describing student_projects table:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
