const prisma = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function main() {
  const email = 'super.admin@vvit.edu.in';
  const password = 'AdminVVIT@2024';

  const hash = await bcrypt.hash(password, 10);

  const existingAdmin = await prisma.user.findFirst({ where: { email } });
  
  if (existingAdmin) {
    console.log(`Super Admin ${email} already exists!`);
  } else {
    const admin = await prisma.user.create({
      data: {
        name: 'VVIT Super Admin',
        email: email,
        password: hash,
        role: 'SUPER_ADMIN',
        accountStatus: 'ACTIVE',
        adminProfile: {
          create: {
            mobileNumber: '9999999999',
            designation: 'Super Administrator'
          }
        }
      }
    });
    console.log(`✅ Super Admin account created successfully!`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
