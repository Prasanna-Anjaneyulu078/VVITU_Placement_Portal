/**
 * Central Configuration for Production-Ready Universal Job–Student Matching Algorithm
 */

const MATCH_WEIGHTS = {
  skills: 0.50,
  education: 0.15,
  department: 0.10,
  branch: 0.10,
  experience: 0.10,
  eligibility: 0.10,
  certifications: 0.05
};

const SKILL_WEIGHTS = {
  required: 0.80,
  preferred: 0.20
};

const MATCH_CATEGORIES = [
  { min: 90, max: 100, label: 'Excellent Match', color: 'emerald' },
  { min: 75, max: 89,  label: 'Strong Match',    color: 'green' },
  { min: 60, max: 74,  label: 'Good Match',      color: 'blue' },
  { min: 40, max: 59,  label: 'Partial Match',   color: 'amber' },
  { min: 0,  max: 39,  label: 'Low Match',       color: 'rose' }
];

/**
 * Returns match category label based on integer overall score
 */
function getMatchCategory(score) {
  const rounded = Math.min(100, Math.max(0, Math.round(score)));
  const category = MATCH_CATEGORIES.find(c => rounded >= c.min && rounded <= c.max);
  return category ? category.label : 'Low Match';
}

module.exports = {
  MATCH_WEIGHTS,
  SKILL_WEIGHTS,
  MATCH_CATEGORIES,
  getMatchCategory
};
