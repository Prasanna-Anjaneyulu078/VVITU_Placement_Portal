const prisma = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function main() {
  const newEmail = 'super.admin@vvit.edu.in';
  const oldEmail = 'admin@vvit.edu.in';
  const password = 'AdminVVIT@2024';
  const hash = await bcrypt.hash(password, 10);

  // Check if super.admin@vvit.edu.in already exists
  const existingNew = await prisma.user.findFirst({ where: { email: newEmail } });
  if (existingNew) {
    await prisma.user.update({
      where: { id: existingNew.id },
      data: {
        password: hash,
        role: 'SUPER_ADMIN',
        accountStatus: 'ACTIVE',
        passwordChanged: true
      }
    });
    console.log(`✅ Updated existing Super Admin user (${newEmail}) with password: ${password}`);
    await prisma.$disconnect();
    return;
  }

  // Check if admin@vvit.edu.in exists and update its email
  const existingOld = await prisma.user.findFirst({ where: { email: oldEmail } });
  if (existingOld) {
    await prisma.user.update({
      where: { id: existingOld.id },
      data: {
        email: newEmail,
        password: hash,
        role: 'SUPER_ADMIN',
        accountStatus: 'ACTIVE',
        passwordChanged: true
      }
    });
    console.log(`✅ Changed Super Admin email from ${oldEmail} to ${newEmail}`);
  } else {
    // Create new Super Admin user
    const newUser = await prisma.user.create({
      data: {
        name: 'VVIT Super Admin',
        email: newEmail,
        password: hash,
        role: 'SUPER_ADMIN',
        accountStatus: 'ACTIVE',
        passwordChanged: true,
        adminProfile: {
          create: {
            mobileNumber: '9999999999',
            designation: 'Super Administrator',
            department: 'Placement Cell'
          }
        }
      }
    });
    console.log(`✅ Created Super Admin account (${newUser.email}) with password: ${password}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error updating Super Admin credentials:', err);
  process.exit(1);
});
