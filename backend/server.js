const app = require('./src/app');
const env = require('./src/config/env');
const prisma = require('./src/config/db');

const PORT = env.port;

const { initJobExpiryScheduler } = require('./src/jobs/job-expiry.job');

const server = app.listen(PORT, async () => {
  console.log(`[SERVER] ========================================================`);
  console.log(`[SERVER] 🚀 VVIT Placement Portal — Node.js Express Server`);
  console.log(`[SERVER] 📡 Listening on http://localhost:${PORT}`);
  console.log(`[SERVER] 🔧 Environment: ${env.env}`);
  console.log(`[SERVER] ========================================================`);

  // Verify database connectivity at startup
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[DATABASE] ✅ Prisma connected to PostgreSQL successfully');
  } catch (err) {
    console.error('[DATABASE] ❌ Prisma connection failed:', err.message);
    console.error('[DATABASE] The server will remain running but database queries will fail.');
    console.error('[DATABASE] Check DATABASE_URL in server/.env');
  }

  // Verify PDF library at startup
  try {
    const pdfParse = require('pdf-parse');
    if (typeof pdfParse !== 'function') {
      throw new Error('pdf-parse is not a function (check version)');
    }
    console.log('[DEPENDENCY] ✅ pdf-parse API resolved correctly');
  } catch (err) {
    console.error('[DEPENDENCY] ❌ pdf-parse initialization failed:', err.message);
  }

  // Initialize Automatic Job Expiry Scheduler
  initJobExpiryScheduler();
});

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED-REJECTION]', err?.message || err);
  // Do NOT call process.exit — let the server keep running
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT-EXCEPTION]', err?.message || err);
  // Do NOT call process.exit — let the server keep running
});

module.exports = server;
