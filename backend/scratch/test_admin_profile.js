const prisma = require('../src/config/db');
const AdminService = require('../src/services/admin.service');

async function testAdminProfile() {
  console.log('Testing AdminService.getAdminProfile...');
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      include: { adminProfile: true }
    });
    console.log('Found admin user:', adminUser);

    if (adminUser) {
      const profile = await AdminService.getAdminProfile(adminUser.id);
      console.log('Admin profile result:', profile);
    } else {
      console.log('No ADMIN user in database');
    }
  } catch (err) {
    console.error('FAILED AdminService.getAdminProfile:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminProfile();
