const prisma = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
  // Reset admin to a known password for testing
  const testPassword = 'AdminVVIT@2024';
  const hash = await bcrypt.hash(testPassword, 10);

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) { console.log('No admin found!'); process.exit(1); }

  // Save original hash
  console.log('Original hash:', admin.password);
  console.log('Admin email:', admin.email);

  // Verify: can we make bcrypt work with a known password?
  const testHash = await bcrypt.hash('TestVerify123', 10);
  const verify = await bcrypt.compare('TestVerify123', testHash);
  console.log('bcrypt verify (sanity check):', verify ? '✅ WORKING' : '❌ BROKEN');

  await prisma.$disconnect();
  console.log('\nNote: Passwords are preserved from MySQL. Use your actual admin password to login.');
  console.log('If you need to reset, run: node scripts/reset-admin-password.js');
}

resetAdmin().catch(e => { console.error(e.message); process.exit(1); });
