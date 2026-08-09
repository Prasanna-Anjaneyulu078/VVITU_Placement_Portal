const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/application.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateToken);

router.post('/', authorizeRoles('STUDENT'), ApplicationController.applyForJob);
router.get('/my', authorizeRoles('STUDENT'), ApplicationController.getStudentApplications);
router.get('/student', authorizeRoles('STUDENT'), ApplicationController.getStudentApplications);
router.get('/job/:jobId', ApplicationController.getJobApplications);

module.exports = router;
