const prisma = require('../src/config/db');
const AdminService = require('../src/services/admin.service');

async function testAdminEndpoints() {
  console.log('--- TESTING ALL ADMIN DASHBOARD ENDPOINTS ---');
  try {
    console.log('\n1. Testing AdminService.getStats()...');
    const stats = await AdminService.getStats();
    console.log('SUCCESS stats:', stats);

    console.log('\n2. Testing AdminService.getAdminProfile()...');
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    if (adminUser) {
      const profile = await AdminService.getAdminProfile(adminUser.id);
      console.log('SUCCESS profile:', profile);
    } else {
      console.log('No ADMIN user in database for profile test.');
    }

    console.log('\n3. Testing AdminService.getShortlistedApplications()...');
    const shortlisted = await AdminService.getShortlistedApplications();
    console.log(`SUCCESS shortlisted applications count: ${shortlisted.length}`);
    if (shortlisted.length > 0) {
      console.log('Sample shortlisted application:', shortlisted[0]);
    }
  } catch (err) {
    console.error('FAILED admin endpoints test:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminEndpoints();
