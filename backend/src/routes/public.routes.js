const express = require('express');
const router = express.Router();

const DEPARTMENTS = [
  { code: 'CSE', name: 'Computer Science and Engineering' },
  { code: 'IT', name: 'Information Technology' },
  { code: 'AIML', name: 'Artificial Intelligence and Machine Learning' },
  { code: 'CSM', name: 'Computer Science and Engineering (Artificial Intelligence & Machine Learning)' },
  { code: 'AIDS', name: 'Artificial Intelligence and Data Science' },
  { code: 'CSO', name: 'Computer Science and Engineering (Internet of Things)' },
  { code: 'CIC', name: 'Computer Science and Information Technology' },
  { code: 'ECE', name: 'Electronics and Communication Engineering' },
  { code: 'EEE', name: 'Electrical and Electronics Engineering' },
  { code: 'CIVIL', name: 'Civil Engineering' },
  { code: 'MECH', name: 'Mechanical Engineering' }
];

router.get('/departments', (req, res) => {
  res.status(200).json(DEPARTMENTS);
});

const PublicController = require('../controllers/public.controller');

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Node.js Express Server is healthy', timestamp: new Date() });
});

router.get('/alumni/:id/profile-image', PublicController.getAlumniProfileImage);
router.get('/student/:id/profile-image', PublicController.getStudentProfileImage);
router.get('/admin/:id/profile-image', PublicController.getAdminProfileImage);

module.exports = router;
