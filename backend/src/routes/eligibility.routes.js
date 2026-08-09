const express = require('express');
const router = express.Router();
const EligibilityController = require('../controllers/eligibility.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateToken);
router.use(authorizeRoles('STUDENT', 'ADMIN', 'SUPER_ADMIN'));

router.get('/validate/:jobId', EligibilityController.validateEligibility);
router.get('/badge/:jobId', EligibilityController.getEligibilityBadge);
router.get('/score/:jobId', EligibilityController.getMatchScore);
router.get('/details/:jobId', EligibilityController.getEligibilityDetails);
router.get('/recommendations', EligibilityController.getRecommendations);

module.exports = router;
