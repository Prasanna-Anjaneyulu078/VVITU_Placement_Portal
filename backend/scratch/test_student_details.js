const prisma = require('../src/config/db');
const AdminService = require('../src/services/admin.service');

async function testStudentDetails() {
  console.log('--- TESTING STUDENT DETAILS DRAWER API ---');
  try {
    // Fetch first active student
    const student = await prisma.student.findFirst({ where: { deletedAt: null } });
    if (!student) {
      console.log('No student found in DB for testing.');
      return;
    }

    const testId = Number(student.id);
    console.log(`\n1. Testing AdminService.getStudentDetails(${testId})...`);
    const details = await AdminService.getStudentDetails(testId);
    console.log('SUCCESS student details:', {
      studentId: details.studentId,
      studentName: details.studentName,
      email: details.email,
      rollNumber: details.rollNumber,
      department: details.department,
      skillsCount: details.skills?.length,
      projectsCount: details.projects?.length,
      resumeFileName: details.resumeFileName,
      resumeUrl: details.resumeUrl
    });

    console.log('\n2. Testing missing student ID 999999...');
    try {
      await AdminService.getStudentDetails(999999);
      console.error('FAILED: Should have thrown 404 for non-existent student');
    } catch (e) {
      console.log('SUCCESS expected 404 error:', e.message);
    }

    console.log('\n3. Testing invalid student ID format...');
    try {
      await AdminService.getStudentDetails('invalid-id');
      console.error('FAILED: Should have thrown 400 for invalid ID format');
    } catch (e) {
      console.log('SUCCESS expected 400 error:', e.message);
    }
  } catch (err) {
    console.error('FAILED student details test:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testStudentDetails();
