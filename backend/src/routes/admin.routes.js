const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { uploadAnyFile } = require('../middleware/upload.middleware');

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'SUPER_ADMIN'));

// Stats & Dashboard
router.get('/stats', AdminController.getStats);
router.get('/dashboard', AdminController.getDashboardMetrics);

// Profile Management
router.get('/profile', AdminController.getAdminProfile);
router.put('/profile', AdminController.updateAdminProfile);
router.post('/profile/image', uploadAnyFile, AdminController.uploadProfileImage);
router.delete('/profile/image', AdminController.deleteProfileImage);

// Password & Email Change
router.put('/change-password', AdminController.changePassword);
router.post('/change-password', AdminController.changePassword);

// Shortlisted Applications & Students
router.get('/applications/shortlisted', AdminController.getShortlistedApplications);
router.get('/students/shortlisted', AdminController.getShortlistedApplications);

// Student Management
router.get('/users/students', AdminController.getAllStudents);
router.get('/students', AdminController.getAllStudents);
router.get('/users/students/:id/details', AdminController.getStudentDetails);
router.get('/students/:id/details', AdminController.getStudentDetails);
router.get('/users/students/:id/resume/view', AdminController.viewStudentResume);
router.get('/students/:id/resume/view', AdminController.viewStudentResume);
router.get('/users/students/:id/resume/download', AdminController.downloadStudentResume);
router.get('/students/:id/resume/download', AdminController.downloadStudentResume);
router.post('/users/students', AdminController.addStudent);
router.post('/students', AdminController.addStudent);
router.patch('/users/students/:id/approve', AdminController.approveStudent);
router.patch('/students/:id/approve', AdminController.approveStudent);
router.put('/users/students/:id/status', AdminController.toggleStudentStatus);
router.put('/students/:id/status', AdminController.toggleStudentStatus);
router.put('/users/students/:id/verify', AdminController.approveStudent);
router.put('/students/:id/verify', AdminController.approveStudent);
router.delete('/users/students/:id', AdminController.deleteStudent);
router.delete('/students/:id', AdminController.deleteStudent);
router.post('/users/students/:id/reset-password', AdminController.resetStudentPassword);
router.post('/students/:id/reset-password', AdminController.resetStudentPassword);
router.post('/users/students/import', uploadAnyFile, AdminController.importStudents);
router.post('/students/import', uploadAnyFile, AdminController.importStudents);
router.post('/users/students/export', AdminController.exportStudents);
router.post('/students/export', AdminController.exportStudents);

// Alumni Management
router.get('/alumni', AdminController.getAllAlumni);
router.get('/alumni/:id/document', AdminController.getAlumniDocument);
router.post('/alumni/verify/:id', AdminController.verifyAlumni);
router.delete('/alumni/:id', AdminController.deleteAlumni);

// Job Management
router.get('/jobs', AdminController.getAllJobs);
router.get('/jobs/pending', AdminController.getPendingJobs);
router.post('/jobs/moderate/:id', AdminController.moderateJob);
router.put('/jobs/:id/status', AdminController.updateJobStatus);

// SuperAdmin admin user management under /api/admin/users/admins
const SuperAdminController = require('../controllers/superAdmin.controller');
router.get('/users/admins', authorizeRoles('SUPER_ADMIN'), SuperAdminController.getAllAdmins);
router.post('/users/admins', authorizeRoles('SUPER_ADMIN'), SuperAdminController.createAdmin);

// Settings
const AdminSettingController = require('../controllers/adminSetting.controller');
router.get('/settings', AdminSettingController.getAllSettings);
router.put('/settings', AdminSettingController.updateSettings);

module.exports = router;
