const express = require('express');
const router = express.Router();
const ResumeController = require('../controllers/resume.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { handleResumeUpload } = require('../middleware/upload.middleware');

router.use(authenticateToken);

router.post('/upload', authorizeRoles('STUDENT'), handleResumeUpload, ResumeController.uploadResume);
router.get('/my-resumes', authorizeRoles('STUDENT'), ResumeController.getStudentResumes);
router.get('/view', authorizeRoles('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'ALUMNI'), ResumeController.viewResume);
router.get('/download', authorizeRoles('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'ALUMNI'), ResumeController.downloadResume);
router.get('/view/:id', authorizeRoles('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'ALUMNI'), ResumeController.viewResume);
router.get('/download/:id', authorizeRoles('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'ALUMNI'), ResumeController.downloadResume);

module.exports = router;
