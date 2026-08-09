const prisma = require('../src/config/db');

async function main() {
  try {
    const cols = await prisma.$queryRawUnsafe('DESCRIBE student_skills;');
    console.log('--- STUDENT SKILLS TABLE COLUMNS ---');
    console.log(cols);
  } catch (err) {
    console.error('Error describing student_skills table:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
