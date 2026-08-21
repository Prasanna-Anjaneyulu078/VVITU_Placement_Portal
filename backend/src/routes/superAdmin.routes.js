const express = require('express');
const router = express.Router();
const SuperAdminController = require('../controllers/superAdmin.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

// Strict SuperAdmin security middleware chain
router.use(authenticateToken);
router.use(authorizeRoles('SUPER_ADMIN'));

router.get('/admins', SuperAdminController.getAllAdmins);
router.get('/admins/:id', SuperAdminController.getAdminById);
router.post('/admins', SuperAdminController.createAdmin);
router.put('/admins/:id', SuperAdminController.updateAdminProfile);
router.put('/admins/:id/email', SuperAdminController.changeAdminEmail);
router.post('/admins/:id/reset-password', SuperAdminController.resetAdminPassword);
router.put('/admins/:id/status', SuperAdminController.toggleAdminStatus);
router.delete('/admins/:id', SuperAdminController.deleteAdmin);

module.exports = router;
