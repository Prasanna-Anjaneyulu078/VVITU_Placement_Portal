const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

// Chat endpoint (accessible to authenticated users)
router.post('/chat', authenticateToken, aiController.handleChat);

// Admin endpoints for RAG management
router.post('/sync', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), aiController.syncKnowledgeBase);
router.get('/stats', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), aiController.getKnowledgeStats);

module.exports = router;
