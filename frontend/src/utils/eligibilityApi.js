import api from './axiosConfig';

/**
 * Eligibility Engine API helpers.
 * Wrap the backend /api/eligibility endpoints.
 */

// Full eligibility result (status, matchScore, rejectionReason, per-criterion checks)
export const validateEligibility = (jobId) =>
  api.get(`/eligibility/validate/${jobId}`).then((res) => res.data);

// Lightweight badge payload: { status, eligible, matchScore, rejectionReason }
export const getEligibilityBadge = (jobId) =>
  api.get(`/eligibility/badge/${jobId}`).then((res) => res.data);

// Match score + detailed checks
export const getMatchScore = (jobId) =>
  api.get(`/eligibility/score/${jobId}`).then((res) => res.data);

// Detailed eligibility checks (same as validate)
export const getEligibilityDetails = (jobId) =>
  api.get(`/eligibility/details/${jobId}`).then((res) => res.data);

// Recommended jobs sorted by match score
export const getRecommendedJobs = (limit = 10) =>
  api.get(`/eligibility/recommendations`, { params: { limit } }).then((res) => res.data);

export default {
  validateEligibility,
  getEligibilityBadge,
  getMatchScore,
  getEligibilityDetails,
  getRecommendedJobs,
};