const prisma = require('../src/config/db');
const AdminService = require('../src/services/admin.service');

async function testAlumniSorting() {
  console.log('--- TESTING ALUMNI SORTING & PRISMA ORDERBY ---');
  try {
    console.log('\n1. Testing getAllAlumni() default sorting...');
    const defaultList = await AdminService.getAllAlumni();
    console.log(`SUCCESS fetched ${defaultList.length} alumni with default sorting.`);

    console.log('\n2. Testing sortBy=company&sortOrder=asc...');
    const companyList = await AdminService.getAllAlumni({ sortBy: 'company', sortOrder: 'asc' });
    console.log(`SUCCESS fetched ${companyList.length} alumni sorted by company asc.`);

    console.log('\n3. Testing sortBy=department&sortOrder=desc...');
    const deptList = await AdminService.getAllAlumni({ sortBy: 'department', sortOrder: 'desc' });
    console.log(`SUCCESS fetched ${deptList.length} alumni sorted by department desc.`);

    console.log('\n4. Testing sortBy=passingYear&sortOrder=asc...');
    const yearList = await AdminService.getAllAlumni({ sortBy: 'passingYear', sortOrder: 'asc' });
    console.log(`SUCCESS fetched ${yearList.length} alumni sorted by passingYear asc.`);

    console.log('\n5. Testing sortBy=invalidField&sortOrder=asc (Invalid Field Fallback)...');
    const fallbackList = await AdminService.getAllAlumni({ sortBy: 'invalidField', sortOrder: 'asc' });
    console.log(`SUCCESS fetched ${fallbackList.length} alumni with invalid field fallback.`);
  } catch (err) {
    console.error('FAILED alumni sorting test:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testAlumniSorting();
