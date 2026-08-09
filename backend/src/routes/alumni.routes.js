const express = require('express');
const router = express.Router();
const AlumniController = require('../controllers/alumni.controller');
const ApplicationController = require('../controllers/application.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// All routes require a valid JWT token
router.use(authenticateToken);

// ALUMNI-only routes
router.get('/profile', authorizeRoles('ALUMNI'), AlumniController.getProfile);
router.put('/profile', authorizeRoles('ALUMNI'), AlumniController.updateProfile);

router.get('/jobs', authorizeRoles('ALUMNI'), AlumniController.getPostedJobs);
router.get('/my-jobs', authorizeRoles('ALUMNI'), AlumniController.getPostedJobs);
router.post('/jobs', authorizeRoles('ALUMNI'), AlumniController.createJob);

router.post('/verify-document', authorizeRoles('ALUMNI'), upload.single('document'), AlumniController.verifyDocument);

// Statistics & Applications: accessible to ALUMNI (owner) + ADMIN + SUPER_ADMIN (management).
// Ownership check is performed inside AlumniController.getJobStatistics for ALUMNI callers.
router.get('/jobs/:jobId/statistics', authorizeRoles('ALUMNI', 'ADMIN', 'SUPER_ADMIN'), AlumniController.getJobStatistics);
router.get('/jobs/:jobId/applications', authorizeRoles('ALUMNI', 'ADMIN', 'SUPER_ADMIN'), ApplicationController.getJobApplicationsForAlumni);
router.put('/applications/:id/status', authorizeRoles('ALUMNI', 'ADMIN', 'SUPER_ADMIN'), ApplicationController.updateStatus);

module.exports = router;
