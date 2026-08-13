/**
 * Centralized Skill Normalization and Matching Mechanism
 */

// Comprehensive Canonical Alias Map (lowercase normalized keys -> canonical display & key)
const CANONICAL_ALIASES = {
  // Node.js
  'nodejs': { canonical: 'node.js', display: 'Node.js' },
  'node js': { canonical: 'node.js', display: 'Node.js' },
  'node.js': { canonical: 'node.js', display: 'Node.js' },

  // Express.js
  'expressjs': { canonical: 'express.js', display: 'Express.js' },
  'express js': { canonical: 'express.js', display: 'Express.js' },
  'express.js': { canonical: 'express.js', display: 'Express.js' },

  // React.js
  'reactjs': { canonical: 'react.js', display: 'React.js' },
  'react js': { canonical: 'react.js', display: 'React.js' },
  'react.js': { canonical: 'react.js', display: 'React.js' },

  // Vue.js
  'vuejs': { canonical: 'vue.js', display: 'Vue.js' },
  'vue js': { canonical: 'vue.js', display: 'Vue.js' },
  'vue.js': { canonical: 'vue.js', display: 'Vue.js' },

  // Next.js
  'nextjs': { canonical: 'next.js', display: 'Next.js' },
  'next js': { canonical: 'next.js', display: 'Next.js' },
  'next.js': { canonical: 'next.js', display: 'Next.js' },

  // Spring Boot
  'springboot': { canonical: 'spring boot', display: 'Spring Boot' },
  'spring-boot': { canonical: 'spring boot', display: 'Spring Boot' },
  'spring boot': { canonical: 'spring boot', display: 'Spring Boot' },

  // Spring MVC
  'springmvc': { canonical: 'spring mvc', display: 'Spring MVC' },
  'spring-mvc': { canonical: 'spring mvc', display: 'Spring MVC' },
  'spring mvc': { canonical: 'spring mvc', display: 'Spring MVC' },

  // Spring Framework
  'springframework': { canonical: 'spring framework', display: 'Spring Framework' },
  'spring-framework': { canonical: 'spring framework', display: 'Spring Framework' },

  // Databases
  'mongo db': { canonical: 'mongodb', display: 'MongoDB' },
  'mongodb': { canonical: 'mongodb', display: 'MongoDB' },
  'my sql': { canonical: 'mysql', display: 'MySQL' },
  'mysql': { canonical: 'mysql', display: 'MySQL' },
  'postgres': { canonical: 'postgresql', display: 'PostgreSQL' },
  'postgresql': { canonical: 'postgresql', display: 'PostgreSQL' },
  'postgre sql': { canonical: 'postgresql', display: 'PostgreSQL' },

  // Developer Tools & Version Control
  'git hub': { canonical: 'github', display: 'GitHub' },
  'github': { canonical: 'github', display: 'GitHub' },
  'vscode': { canonical: 'vs code', display: 'VS Code' },
  'vs code': { canonical: 'vs code', display: 'VS Code' },
  'visual studio code': { canonical: 'vs code', display: 'VS Code' },

  // Programming Languages
  'java script': { canonical: 'javascript', display: 'JavaScript' },
  'javascript': { canonical: 'javascript', display: 'JavaScript' },
  'type script': { canonical: 'typescript', display: 'TypeScript' },
  'typescript': { canonical: 'typescript', display: 'TypeScript' },

  // Java (distinct from JavaScript!)
  'java': { canonical: 'java', display: 'Java' },

  // CS Core & AI
  'computer science core': { canonical: 'cs core', display: 'CS Core' },
  'computer science': { canonical: 'cs core', display: 'CS Core' },
  'cs core': { canonical: 'cs core', display: 'CS Core' },

  'ai': { canonical: 'artificial intelligence', display: 'Artificial Intelligence' },
  'artificial intelligence': { canonical: 'artificial intelligence', display: 'Artificial Intelligence' },

  'ml': { canonical: 'machine learning', display: 'Machine Learning' },
  'machine learning': { canonical: 'machine learning', display: 'Machine Learning' },

  'dsa': { canonical: 'dsa', display: 'DSA' },
  'data structures and algorithms': { canonical: 'dsa', display: 'DSA' },
  'data structures & algorithms': { canonical: 'dsa', display: 'DSA' },
  'data structures': { canonical: 'dsa', display: 'DSA' },

  // Web & Styling
  'html5': { canonical: 'html', display: 'HTML' },
  'html': { canonical: 'html', display: 'HTML' },
  'css3': { canonical: 'css', display: 'CSS' },
  'css': { canonical: 'css', display: 'CSS' }
};

/**
 * Normalizes a raw skill string into a canonical key and preferred display name.
 */
function normalizeSkill(rawSkill) {
  if (!rawSkill || typeof rawSkill !== 'string') return null;
  
  const cleaned = rawSkill.trim().replace(/\s+/g, ' ');
  if (!cleaned) return null;

  const lower = cleaned.toLowerCase();

  // Direct alias map hit
  if (CANONICAL_ALIASES[lower]) {
    return CANONICAL_ALIASES[lower];
  }

  // Handle common punctuation patterns (e.g., "spring-boot" or "spring_boot" -> "spring boot")
  const sanitizedLower = lower.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  if (CANONICAL_ALIASES[sanitizedLower]) {
    return CANONICAL_ALIASES[sanitizedLower];
  }

  // Default fallback canonical key and preserved original display
  return {
    canonical: lower,
    display: cleaned
  };
}

/**
 * Matches a student's skills against a job's required skills.
 * 
 * @param {Array<string|Object>} rawStudentSkills - Student skills (strings or objects with skillName/name).
 * @param {string|Array<string>} rawRequiredSkills - Job required skills (comma-separated string or array).
 * @returns {Object} { skillMatchPercentage, matchedSkills, missingSkills }
 */
function matchSkills(rawStudentSkills = [], rawRequiredSkills = '') {
  // 1. Parse student skills into array of strings
  let studentList = [];
  if (Array.isArray(rawStudentSkills)) {
    studentList = rawStudentSkills.map(s => {
      if (typeof s === 'string') return s;
      if (s && typeof s === 'object') return s.skillName || s.name || s.skill || s.title || '';
      return '';
    });
  } else if (typeof rawStudentSkills === 'string') {
    studentList = rawStudentSkills.split(',');
  }

  // Build Set of normalized student canonical keys
  const studentCanonicalSet = new Set();
  studentList.forEach(s => {
    const normalized = normalizeSkill(s);
    if (normalized) {
      studentCanonicalSet.add(normalized.canonical);
    }
  });

  // 2. Parse job required skills into array of strings
  let requiredList = [];
  if (typeof rawRequiredSkills === 'string') {
    requiredList = rawRequiredSkills.split(',');
  } else if (Array.isArray(rawRequiredSkills)) {
    requiredList = rawRequiredSkills.map(s => {
      if (typeof s === 'string') return s;
      if (s && typeof s === 'object') return s.skillName || s.name || s.skill || s.title || '';
      return '';
    });
  }

  const matchedSkills = [];
  const missingSkills = [];
  const seenRequiredCanonicals = new Set();

  requiredList.forEach(reqItem => {
    const normalized = normalizeSkill(reqItem);
    if (!normalized) return;

    // Deduplicate required skills in the job list to prevent inflated denominator
    if (seenRequiredCanonicals.has(normalized.canonical)) return;
    seenRequiredCanonicals.add(normalized.canonical);

    // Use original required skill string format for display
    const reqDisplay = reqItem.trim();

    if (studentCanonicalSet.has(normalized.canonical)) {
      matchedSkills.push(reqDisplay);
    } else {
      missingSkills.push(reqDisplay);
    }
  });

  const totalRequired = matchedSkills.length + missingSkills.length;
  if (totalRequired === 0) {
    return {
      skillMatchPercentage: 0,
      matchedSkills: [],
      missingSkills: []
    };
  }

  const percentage = Math.round((matchedSkills.length / totalRequired) * 100);

  return {
    skillMatchPercentage: percentage,
    matchedSkills,
    missingSkills
  };
}

module.exports = {
  normalizeSkill,
  matchSkills
};
