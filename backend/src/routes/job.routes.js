const express = require('express');
const router = express.Router();
const JobController = require('../controllers/job.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Public routes
router.get('/approved', JobController.getApprovedJobs);
router.get('/all', JobController.getAllJobs);

// Authenticated routes (must be before /:id to avoid route conflicts)
router.post(
  '/post',
  authenticateToken,
  authorizeRoles('ALUMNI', 'ADMIN'),
  upload.uploadAnyFile,
  JobController.createJob
);
router.get('/my', authenticateToken, authorizeRoles('ALUMNI', 'ADMIN'), JobController.getMyJobs);

// File upload routes (ALUMNI or ADMIN)
router.post('/:id/logo', authenticateToken, authorizeRoles('ALUMNI', 'ADMIN'), upload.uploadAnyFile, JobController.uploadLogo);

// Job CRUD (authenticated)
router.put('/:id/status', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), JobController.updateJobStatus);
router.put('/:id', authenticateToken, authorizeRoles('ALUMNI', 'ADMIN'), JobController.updateJob);
router.delete('/:id', authenticateToken, authorizeRoles('ALUMNI', 'ADMIN', 'SUPER_ADMIN'), JobController.deleteJob);

// Public parameterized route (keep last)
router.get('/:id', JobController.getJobById);

module.exports = router;
