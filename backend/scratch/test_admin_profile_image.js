const express = require('express');
const adminRouter = require('../src/routes/admin.routes');
const { errorHandler } = require('../src/middleware/error.middleware');
const prisma = require('../src/config/db');

const app = express();
app.use(express.json());

// Mock auth middleware for testing
app.use((req, res, next) => {
  req.user = { id: 1, email: 'admin@vvit.net', role: 'ADMIN' };
  next();
});

app.use('/api/admin', adminRouter);
app.use(errorHandler);

async function testUpload() {
  const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`--- TESTING POST /api/admin/profile/image on port ${port} ---`);

    try {
      const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } }) || await prisma.user.findFirst();
      if (!user) {
        console.log('No user in database');
        return;
      }

      console.log('Using test user:', user.email, 'ID:', user.id);

      const req = {
        user: { id: Number(user.id), email: user.email },
        file: {
          fieldname: 'image',
          originalname: 'test.png',
          filename: 'image-12345.png',
          mimetype: 'image/png',
          size: 1024
        },
        body: {}
      };

      const AdminController = require('../src/controllers/admin.controller');
      const res = {
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          console.log(`STATUS: ${this.statusCode || 200}`);
          console.log('RESPONSE:', data);
        }
      };

      await AdminController.uploadProfileImage(req, res, (err) => {
        console.error('ERROR IN CONTROLLER:', err);
      });

    } catch (err) {
      console.error('TEST ERROR:', err);
    } finally {
      server.close();
      await prisma.$disconnect();
      process.exit(0);
    }
  });
}

testUpload();
