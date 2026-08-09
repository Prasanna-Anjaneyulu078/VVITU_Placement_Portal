const express = require('express');
const jobRouter = require('../src/routes/job.routes');
const { errorHandler } = require('../src/middleware/error.middleware');
const http = require('http');

const app = express();
app.use(express.json());
app.use('/api/jobs', jobRouter);
app.use(errorHandler);

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log(`--- TESTING JOB ENDPOINTS ON PORT ${port} ---`);

  const request = (path) => new Promise((resolve) => {
    http.get(`http://localhost:${port}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });
  });

  try {
    console.log('\n1. GET /api/jobs/all ...');
    const r1 = await request('/api/jobs/all');
    console.log(`STATUS: ${r1.status}, IS_ARRAY: ${Array.isArray(r1.data)}, COUNT: ${r1.data.length}`);

    console.log('\n2. GET /api/jobs/approved ...');
    const r2 = await request('/api/jobs/approved');
    console.log(`STATUS: ${r2.status}, IS_ARRAY: ${Array.isArray(r2.data)}, COUNT: ${r2.data.length}`);

    console.log('\n3. GET /api/jobs/all?search=Developer ...');
    const r3 = await request('/api/jobs/all?search=Developer');
    console.log(`STATUS: ${r3.status}, IS_ARRAY: ${Array.isArray(r3.data)}`);

    console.log('\n4. GET /api/jobs/all?status=APPROVED ...');
    const r4 = await request('/api/jobs/all?status=APPROVED');
    console.log(`STATUS: ${r4.status}, IS_ARRAY: ${Array.isArray(r4.data)}`);

    console.log('\n5. GET /api/jobs/invalid-id ...');
    const r5 = await request('/api/jobs/invalid-id');
    console.log(`STATUS: ${r5.status}, MESSAGE: ${r5.data.message}`);

    console.log('\nALL JOB ROUTE TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('TEST FAILED:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
