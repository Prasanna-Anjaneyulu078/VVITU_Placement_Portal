const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { uploadAnyFile } = require('../middleware/upload.middleware');

router.post('/login', AuthController.login);
router.post('/register/student', AuthController.registerStudent);
router.post('/register/alumni', uploadAnyFile, AuthController.registerAlumni);

// Support both PUT and POST for change password (matching Spring Boot API behaviour)
router.post('/change-password', authenticateToken, AuthController.changePassword);
router.put('/change-password', authenticateToken, AuthController.changePassword);

router.post('/change-email', authenticateToken, AuthController.changeEmail);
router.put('/change-email', authenticateToken, AuthController.changeEmail);

const AlumniController = require('../controllers/alumni.controller');
router.post('/verify-document', uploadAnyFile, AlumniController.verifyDocument);

router.post('/logout', AuthController.logout);

module.exports = router;
