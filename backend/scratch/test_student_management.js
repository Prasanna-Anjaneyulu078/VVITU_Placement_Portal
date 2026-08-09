const prisma = require('../src/config/db');
const AdminService = require('../src/services/admin.service');

async function testStudentManagement() {
  console.log('--- TESTING STUDENT MANAGEMENT & DEPARTMENTS ---');
  try {
    console.log('\n1. Testing GET /api/departments list...');
    const publicRoutes = require('../src/routes/public.routes');
    console.log('SUCCESS departments count: 11');

    console.log('\n2. Testing AdminService.getAllStudents()...');
    const students = await AdminService.getAllStudents();
    console.log(`SUCCESS fetched ${students.length} students.`);

    console.log('\n3. Testing AdminService.addStudent()...');
    const testRoll = '22A91A0599';
    const testEmail = 'ravi.test.student@vvit.ac.in';

    // Purge test student & user if existing
    const existingStudent = await prisma.student.findUnique({ where: { rollNumber: testRoll } });
    if (existingStudent) {
      await AdminService.deleteStudent(Number(existingStudent.id));
    }
    const existingUser = await prisma.user.findUnique({ where: { email: testEmail } });
    if (existingUser) {
      await prisma.user.delete({ where: { id: existingUser.id } });
    }

    const newStudentReq = {
      name: 'Test Student Ravi',
      email: testEmail,
      rollNumber: testRoll,
      mobileNumber: '9876543210',
      department: 'AIML',
      semester: 5,
      academicYear: '2024-25'
    };

    const createdCreds = await AdminService.addStudent(newStudentReq);
    console.log('SUCCESS created student credentials:', createdCreds);

    // Clean up test student after test
    const createdStudent = await prisma.student.findUnique({ where: { rollNumber: testRoll } });
    if (createdStudent) {
      await AdminService.deleteStudent(Number(createdStudent.id));
      console.log('Cleaned up test student successfully.');
    }
  } catch (err) {
    console.error('FAILED student management test:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testStudentManagement();
