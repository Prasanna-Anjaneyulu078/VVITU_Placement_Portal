const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const env = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const alumniRoutes = require('./routes/alumni.routes');
const adminRoutes = require('./routes/admin.routes');
const jobRoutes = require('./routes/job.routes');
const applicationRoutes = require('./routes/application.routes');
const resumeRoutes = require('./routes/resume.routes');
const eligibilityRoutes = require('./routes/eligibility.routes');
const superAdminRoutes = require('./routes/superAdmin.routes');
const publicRoutes = require('./routes/public.routes');

const app = express();

// 1. CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.allowedOrigins.includes(origin) || env.allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow dev origins dynamically
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
  })
);

// 2. Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 3. Static Media Files
app.use('/uploads', express.static(env.uploadDir));
app.use('/api/uploads', express.static(env.uploadDir));
app.use('/api/student/profile/image', express.static(path.join(env.uploadDir, 'images')));
app.use('/api/public/alumni/profile-image', express.static(path.join(env.uploadDir, 'images')));
app.use('/api/jobs/images/logo', express.static(path.join(env.uploadDir, 'job-logos')));
app.use('/api/jobs/images/banner', express.static(path.join(env.uploadDir, 'job-banners')));

// 4. Health Endpoint (top-level, no auth)
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'placement-management-server',
    message: 'Node.js Express Server is healthy',
    timestamp: new Date()
  });
});

// 5. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/eligibility', eligibilityRoutes);
// Public routes: /api/departments and /api/health (health also served above)
app.use('/api', publicRoutes);

// 6. Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
