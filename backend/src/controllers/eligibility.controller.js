const EligibilityService = require('../services/eligibility.service');

class EligibilityController {
  static async validateEligibility(req, res, next) {
    try {
      const { jobId } = req.params;
      const result = await EligibilityService.validateEligibility(req.user.id, jobId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getEligibilityBadge(req, res, next) {
    try {
      const { jobId } = req.params;
      const result = await EligibilityService.validateEligibility(req.user.id, jobId);
      res.status(200).json({
        status: result.status,
        eligible: result.isEligible,
        matchScore: result.matchScore,
        rejectionReason: result.rejectionReason
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMatchScore(req, res, next) {
    try {
      const { jobId } = req.params;
      const result = await EligibilityService.validateEligibility(req.user.id, jobId);
      res.status(200).json({
        matchScore: result.matchScore,
        checks: result.checks
      });
    } catch (err) {
      next(err);
    }
  }

  static async getEligibilityDetails(req, res, next) {
    try {
      const { jobId } = req.params;
      const result = await EligibilityService.validateEligibility(req.user.id, jobId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getRecommendations(req, res, next) {
    try {
      const limit = parseInt(req.query.limit || '10', 10);
      const result = await EligibilityService.getRecommendedJobs(req.user.id, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = EligibilityController;
