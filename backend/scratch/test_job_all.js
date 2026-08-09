const express = require('express');
const jobRouter = require('../src/routes/job.routes');
const { errorHandler } = require('../src/middleware/error.middleware');

const app = express();
app.use(express.json());
app.use('/api/jobs', jobRouter);
app.use(errorHandler);

const http = require('http');
const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log(`Test server running on port ${port}`);

  http.get(`http://localhost:${port}/api/jobs/all`, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`STATUS: ${res.statusCode}`);
      console.log(`RESPONSE: ${data}`);
      server.close();
      process.exit(0);
    });
  }).on('error', (err) => {
    console.error('HTTP Error:', err.message);
    server.close();
    process.exit(1);
  });
});
