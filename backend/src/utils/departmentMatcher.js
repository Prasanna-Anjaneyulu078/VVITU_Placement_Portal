/**
 * Department / Branch Normalization and Alias Matching Utility
 */

const CANONICAL_DEPARTMENTS = {
  // CSE
  'cse': 'CSE',
  'cs': 'CSE',
  'computer science': 'CSE',
  'computer science & engineering': 'CSE',
  'computer science and engineering': 'CSE',

  // IT
  'it': 'IT',
  'information technology': 'IT',

  // AI & DS
  'ai & ds': 'AI & DS',
  'ai&ds': 'AI & DS',
  'aids': 'AI & DS',
  'ai': 'AI & DS',
  'ds': 'AI & DS',
  'ai and ds': 'AI & DS',
  'artificial intelligence': 'AI & DS',
  'artificial intelligence and data science': 'AI & DS',
  'artificial intelligence & data science': 'AI & DS',

  // ECE
  'ece': 'ECE',
  'electronics': 'ECE',
  'electronics and communication engineering': 'ECE',
  'electronics & communication engineering': 'ECE',

  // EEE
  'eee': 'EEE',
  'electrical': 'EEE',
  'electrical and electronics engineering': 'EEE',
  'electrical & electronics engineering': 'EEE',

  // MECH
  'mech': 'MECH',
  'mechanical': 'MECH',
  'mechanical engineering': 'MECH',

  // CIVIL
  'civil': 'CIVIL',
  'civil engineering': 'CIVIL'
};

/**
 * Normalizes a raw department string to its canonical code (e.g. "CSE", "AI & DS").
 */
function normalizeDepartment(rawDept) {
  if (!rawDept || typeof rawDept !== 'string') return null;
  const cleaned = rawDept.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!cleaned) return null;

  if (CANONICAL_DEPARTMENTS[cleaned]) {
    return CANONICAL_DEPARTMENTS[cleaned];
  }

  // Remove non-alphanumeric punctuation and check
  const sanitized = cleaned.replace(/[^a-z0-9]/g, '');
  if (CANONICAL_DEPARTMENTS[sanitized]) {
    return CANONICAL_DEPARTMENTS[sanitized];
  }

  // Fallback uppercase
  return rawDept.trim().toUpperCase();
}

/**
 * Evaluates branch eligibility of a student against job eligible departments.
 * Returns { passed: boolean, studentDept: string, eligibleDepts: string[], score: number }
 */
function matchDepartment(rawStudentDept, rawEligibleDepts) {
  const normalizedStudentDept = normalizeDepartment(rawStudentDept);

  // Parse job eligible departments list
  let eligibleList = [];
  if (typeof rawEligibleDepts === 'string' && rawEligibleDepts.trim()) {
    eligibleList = rawEligibleDepts.split(',').map(d => d.trim()).filter(Boolean);
  } else if (Array.isArray(rawEligibleDepts)) {
    eligibleList = rawEligibleDepts.map(d => (typeof d === 'string' ? d.trim() : '')).filter(Boolean);
  }

  // If job has no department restriction, everyone gets 100%
  if (eligibleList.length === 0) {
    return {
      passed: true,
      score: 100,
      studentDept: normalizedStudentDept || rawStudentDept || 'N/A',
      eligibleDepts: ['ALL'],
      detail: 'No department restriction'
    };
  }

  if (!normalizedStudentDept) {
    return {
      passed: false,
      score: 0,
      studentDept: 'N/A',
      eligibleDepts: eligibleList,
      detail: 'Department not set in student profile'
    };
  }

  const normalizedEligibleCanonicals = new Set(eligibleList.map(d => normalizeDepartment(d)));

  const isEligible = normalizedEligibleCanonicals.has(normalizedStudentDept);

  return {
    passed: isEligible,
    score: isEligible ? 100 : 0,
    studentDept: normalizedStudentDept,
    eligibleDepts: Array.from(normalizedEligibleCanonicals),
    detail: isEligible
      ? `Department ${normalizedStudentDept} is eligible`
      : `Department ${normalizedStudentDept} is not in eligible list (${eligibleList.join(', ')})`
  };
}

module.exports = {
  normalizeDepartment,
  matchDepartment,
  CANONICAL_DEPARTMENTS
};
