const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  console.log('--- Testing Login ---');
  
  // 1. Temporarily create a test admin user
  const hash = await bcrypt.hash('TestPass123!', 10);
  const testAdmin = await prisma.user.create({
    data: {
      name: 'Test Admin',
      email: 'testadmin@vvit.edu.in',
      password: hash,
      role: 'ADMIN',
      accountStatus: 'ACTIVE'
    }
  });

  try {
    // 2. Attempt login via AuthService
    const AuthService = require('../src/services/auth.service');
    const result = await AuthService.login('testadmin@vvit.edu.in', 'TestPass123!');
    console.log('Login successful! User ID:', result.user.id, 'Token:', result.accessToken ? 'exists' : 'missing');
  } catch (err) {
    console.log('Login failed with error:', err.statusCode, err.message);
  }

  // 3. Cleanup
  await prisma.user.delete({ where: { id: testAdmin.id } });
  await prisma.$disconnect();
}

testLogin();
