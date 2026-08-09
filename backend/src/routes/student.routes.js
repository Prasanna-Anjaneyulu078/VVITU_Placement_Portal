const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/student.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateToken);
router.use(authorizeRoles('STUDENT'));

const upload = require('../middleware/upload.middleware');

// Profile
router.get('/profile', StudentController.getProfile);
router.put('/profile', StudentController.updateProfile);
router.post('/profile/image', upload.single('file'), StudentController.uploadProfileImage);
router.post('/profile/picture', upload.single('file'), StudentController.uploadProfileImage);

// Skills
router.get('/skills', StudentController.getSkills);
router.post('/skills', StudentController.addSkill);
router.delete('/skills/:id', StudentController.deleteSkill);

// Eligibility / skill match
const EligibilityController = require('../controllers/eligibility.controller');
router.get('/skills/job-match/:jobId', EligibilityController.getMatchScore);

// Projects
router.get('/projects', StudentController.getProjects);
router.post('/projects', StudentController.addProject);
router.put('/projects/:id', StudentController.updateProject);
router.delete('/projects/:id', StudentController.deleteProject);

// Resume - view/download (student's own)
router.get('/resume/details', StudentController.getResumeDetails);
router.get('/resume/view', StudentController.viewResume);
router.get('/resume/download', StudentController.downloadResume);

// Resume upload directly under /api/student/resume/upload (frontend-compatible)
router.post('/resume/upload', upload.single('resume'), StudentController.uploadResume);
router.post('/resume/upload-file', upload.single('file'), StudentController.uploadResume);

// Jobs
const ApplicationController = require('../controllers/application.controller');
router.post('/jobs/:jobId/apply', ApplicationController.applyForJob);

router.get('/jobs/open', StudentController.getOpenJobs);
router.get('/jobs/closed', StudentController.getClosedJobs);
router.get('/jobs/applied', StudentController.getAppliedJobs);
// Student-accessible single job detail - must be after named routes to avoid /:id swallowing them
router.get('/jobs/:id', StudentController.getJobById);

module.exports = router;
