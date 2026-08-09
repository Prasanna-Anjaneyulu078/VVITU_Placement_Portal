const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.post('/login', AuthController.login);
router.post('/register/student', AuthController.registerStudent);
router.post('/register/alumni', upload.single('verificationDoc'), AuthController.registerAlumni);

// Support both PUT and POST for change password (matching Spring Boot API behaviour)
router.post('/change-password', authenticateToken, AuthController.changePassword);
router.put('/change-password', authenticateToken, AuthController.changePassword);

const AlumniController = require('../controllers/alumni.controller');
router.post('/verify-document', upload.single('document'), AlumniController.verifyDocument);

router.post('/logout', AuthController.logout);

module.exports = router;
