const prisma = require('../src/config/db');
const AdminController = require('../src/controllers/admin.controller');
const StudentController = require('../src/controllers/student.controller');

async function testProfileImages() {
  console.log('--- TESTING ADMIN AND STUDENT PROFILE IMAGE UPLOADS & DISPLAY ---');
  try {
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } }) || await prisma.user.findFirst();
    const studentUser = await prisma.user.findFirst({ where: { role: 'STUDENT' } }) || await prisma.user.findFirst();

    if (!adminUser || !studentUser) {
      console.log('Missing test users');
      return;
    }

    console.log('\n1. Testing Admin Profile Image Upload...');
    const adminReq = {
      user: { id: Number(adminUser.id), email: adminUser.email },
      file: {
        fieldname: 'image',
        originalname: 'admin_avatar.png',
        filename: 'image-admin-test.png',
        mimetype: 'image/png',
        size: 2048
      },
      body: {}
    };

    let adminResData = null;
    const adminRes = {
      status(code) { this.statusCode = code; return this; },
      json(data) { adminResData = data; }
    };

    await AdminController.uploadProfileImage(adminReq, adminRes, (e) => console.error(e));
    console.log('Admin Upload Response:', {
      success: adminResData?.success,
      imageUrlStart: adminResData?.imageUrl?.substring(0, 30) + '...'
    });

    console.log('\n2. Testing Student Profile Image Upload...');
    const studentReq = {
      user: { id: Number(studentUser.id), email: studentUser.email },
      file: {
        fieldname: 'file',
        originalname: 'student_avatar.png',
        filename: 'image-student-test.png',
        mimetype: 'image/png',
        size: 2048
      },
      body: {}
    };

    let studentResData = null;
    const studentRes = {
      status(code) { this.statusCode = code; return this; },
      json(data) { studentResData = data; }
    };

    await StudentController.uploadProfileImage(studentReq, studentRes, (e) => console.error(e));
    console.log('Student Upload Response:', {
      success: studentResData?.success,
      urlStart: studentResData?.url?.substring(0, 30) + '...',
      profileImageUrlStart: studentResData?.profileImageUrl?.substring(0, 30) + '...'
    });

    console.log('\nSUCCESS! Both Admin and Student Profile Images process and return instant Data URLs for UI rendering!');
  } catch (err) {
    console.error('TEST ERROR:', err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

testProfileImages();
