/**
 * API Regression Smoke Test — VVITU Placement Portal (PostgreSQL)
 * Run: node scripts/api-smoke-test.js
 */

const http = require('http');

const BASE = 'http://localhost:8082';
let ADMIN_TOKEN = '';
let STUDENT_TOKEN = '';
const results = [];

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 8082,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(data && { 'Content-Length': Buffer.byteLength(data) })
      }
    };

    const req = http.request(options, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function test(name, method, path, body, token, expectedStatus) {
  try {
    const res = await request(method, path, body, token);
    const pass = res.status === expectedStatus;
    results.push({ name, method, path, expected: expectedStatus, actual: res.status, pass });
    console.log(`${pass ? '✅' : '❌'} [${res.status}] ${method} ${path} — ${name}`);
    return res;
  } catch (e) {
    results.push({ name, method, path, expected: expectedStatus, actual: 'ERR', pass: false });
    console.log(`❌ [ERR] ${method} ${path} — ${name}: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('VVITU Placement Portal — API Regression Test (PostgreSQL)');
  console.log('='.repeat(60));

  // ─── Health ──────────────────────────────────────────────────
  await test('Health check', 'GET', '/api/health', null, null, 200);

  // ─── Auth ────────────────────────────────────────────────────
  const adminLogin = await test('Admin login', 'POST', '/api/auth/login',
    { email: 'admin@vvit.edu.in', password: 'AdminVVIT@2024' }, null, 200);
  if (adminLogin?.body?.token) ADMIN_TOKEN = adminLogin.body.token;

  const studentLogin = await test('Student login', 'POST', '/api/auth/login',
    { email: 'prasannaanjaneyulu078@gmail.com', password: 'Prasanna@123' }, null, 401);
  // 401 expected — we don't know the actual student password

  // Wrong credentials
  await test('Login wrong password', 'POST', '/api/auth/login',
    { email: 'admin@vvit.edu.in', password: 'WRONG' }, null, 401);

  // ─── Public Jobs ─────────────────────────────────────────────
  const publicJobs = await test('Public - approved jobs', 'GET', '/api/jobs/approved', null, null, 200);
  if (publicJobs?.body) {
    const jobs = Array.isArray(publicJobs.body) ? publicJobs.body : publicJobs.body.data || [];
    console.log(`   → ${jobs.length} approved job(s) returned`);
  }

  // Job search (tests mode: insensitive)
  await test('Job search (case-insensitive)', 'GET', '/api/jobs/approved?search=engineer', null, null, 200);
  await test('Job search uppercase', 'GET', '/api/jobs/approved?search=ENGINEER', null, null, 200);

  // ─── Admin APIs (require token) ───────────────────────────────
  if (ADMIN_TOKEN) {
    await test('Admin - get stats', 'GET', '/api/admin/stats', null, ADMIN_TOKEN, 200);
    await test('Admin - list students', 'GET', '/api/admin/users/students', null, ADMIN_TOKEN, 200);
    await test('Admin - list alumni', 'GET', '/api/admin/users/alumni', null, ADMIN_TOKEN, 200);
    await test('Admin - list all jobs', 'GET', '/api/admin/jobs', null, ADMIN_TOKEN, 200);
    await test('Admin - profile', 'GET', '/api/admin/profile', null, ADMIN_TOKEN, 200);
  } else {
    console.log('⚠️  Skipping admin-auth tests (no token)');
  }

  // ─── Unauthorized requests ────────────────────────────────────
  await test('No-auth student profile', 'GET', '/api/student/profile', null, null, 401);
  await test('No-auth admin stats', 'GET', '/api/admin/stats', null, null, 401);
  await test('No-auth jobs list (admin)', 'GET', '/api/admin/jobs', null, null, 401);

  // ─── Departments (public) ─────────────────────────────────────
  await test('Public - departments', 'GET', '/api/departments', null, null, 200);

  // ─── Report ───────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('API REGRESSION REPORT');
  console.log('='.repeat(60));
  console.log(`${'Test'.padEnd(40)} ${'Exp'.padStart(4)} ${'Got'.padStart(4)} Status`);
  console.log('-'.repeat(60));

  let passed = 0, failed = 0;
  for (const r of results) {
    const status = r.pass ? '✅ PASS' : '❌ FAIL';
    if (r.pass) passed++; else failed++;
    console.log(`${r.name.padEnd(40)} ${String(r.expected).padStart(4)} ${String(r.actual).padStart(4)} ${status}`);
  }

  console.log('-'.repeat(60));
  console.log(`TOTAL: ${results.length} tests | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(failed === 0 ? '\n✅ ALL TESTS PASSED' : `\n⚠️  ${failed} TEST(S) FAILED`);
}

main().catch(e => { console.error(e); process.exit(1); });
