/**
 * Reset admin password for testing.
 * Run: node scripts/reset-admin-password.js
 * This sets admin@vvit.edu.in password to: AdminVVIT@2024
 */
const prisma = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function main() {
  const newPassword = 'AdminVVIT@2024';
  const hash = await bcrypt.hash(newPassword, 10);

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.error('No admin user found!');
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: admin.id },
    data: { password: hash }
  });

  console.log(`✅ Admin password reset successfully`);
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Password: ${newPassword}`);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
