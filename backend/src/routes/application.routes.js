const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/application.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.post('/', authorizeRoles('STUDENT'), ApplicationController.applyForJob);
router.get('/my', authorizeRoles('STUDENT'), ApplicationController.getStudentApplications);
router.get('/student', authorizeRoles('STUDENT'), ApplicationController.getStudentApplications);
router.get('/job/:jobId', ApplicationController.getJobApplications);
router.get('/alumni/my-posted-jobs', authorizeRoles('ALUMNI'), ApplicationController.getAlumniPostedJobsApplications);
router.get('/:id/details', ApplicationController.getApplicationDetails);
router.patch('/:id/status', authorizeRoles('ALUMNI', 'ADMIN', 'SUPER_ADMIN'), ApplicationController.updateStatus);
router.get('/:id/resume/view', ApplicationController.viewResume);
router.get('/:id/resume/download', ApplicationController.downloadResume);

module.exports = router;
