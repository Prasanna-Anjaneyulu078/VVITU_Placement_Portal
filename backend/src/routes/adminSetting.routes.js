const express = require('express');
const router = express.Router();
const AdminSettingController = require('../controllers/adminSetting.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'SUPER_ADMIN'));

router.get('/', AdminSettingController.getAllSettings);
router.put('/', AdminSettingController.updateSettings);

module.exports = router;
