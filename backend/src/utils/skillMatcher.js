/**
 * Centralized Skill Normalization and Universal Matching Engine
 */

// Comprehensive Canonical Alias Map (lowercase normalized keys -> canonical display & key)
const CANONICAL_ALIASES = {
  // JavaScript & ES6 variants
  'javascript': { canonical: 'javascript', display: 'JavaScript (ES6+)' },
  'java script': { canonical: 'javascript', display: 'JavaScript (ES6+)' },
  'js': { canonical: 'javascript', display: 'JavaScript (ES6+)' },
  'es6': { canonical: 'javascript', display: 'JavaScript (ES6+)' },
  'es6+': { canonical: 'javascript', display: 'JavaScript (ES6+)' },
  'javascript es6': { canonical: 'javascript', display: 'JavaScript (ES6+)' },
  'javascript (es6+)': { canonical: 'javascript', display: 'JavaScript (ES6+)' },
  'javascript es6+': { canonical: 'javascript', display: 'JavaScript (ES6+)' },
  'es2015+': { canonical: 'javascript', display: 'JavaScript (ES6+)' },
  'es2015': { canonical: 'javascript', display: 'JavaScript (ES6+)' },

  // TypeScript
  'typescript': { canonical: 'typescript', display: 'TypeScript' },
  'type script': { canonical: 'typescript', display: 'TypeScript' },
  'ts': { canonical: 'typescript', display: 'TypeScript' },

  // Java (STRICTLY DISTINCT from JavaScript!)
  'java': { canonical: 'java', display: 'Java' },

  // React
  'react': { canonical: 'react.js', display: 'React.js' },
  'reactjs': { canonical: 'react.js', display: 'React.js' },
  'react js': { canonical: 'react.js', display: 'React.js' },
  'react.js': { canonical: 'react.js', display: 'React.js' },

  // Node
  'node': { canonical: 'node.js', display: 'Node.js' },
  'nodejs': { canonical: 'node.js', display: 'Node.js' },
  'node js': { canonical: 'node.js', display: 'Node.js' },
  'node.js': { canonical: 'node.js', display: 'Node.js' },

  // Express
  'express': { canonical: 'express.js', display: 'Express.js' },
  'expressjs': { canonical: 'express.js', display: 'Express.js' },
  'express js': { canonical: 'express.js', display: 'Express.js' },
  'express.js': { canonical: 'express.js', display: 'Express.js' },

  // Vue
  'vue': { canonical: 'vue.js', display: 'Vue.js' },
  'vuejs': { canonical: 'vue.js', display: 'Vue.js' },
  'vue js': { canonical: 'vue.js', display: 'Vue.js' },
  'vue.js': { canonical: 'vue.js', display: 'Vue.js' },

  // Next
  'next': { canonical: 'next.js', display: 'Next.js' },
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
  'spring': { canonical: 'spring framework', display: 'Spring Framework' },

  // REST APIs
  'rest': { canonical: 'rest-api', display: 'REST APIs' },
  'rest api': { canonical: 'rest-api', display: 'REST APIs' },
  'rest apis': { canonical: 'rest-api', display: 'REST APIs' },
  'restful api': { canonical: 'rest-api', display: 'REST APIs' },
  'restful apis': { canonical: 'rest-api', display: 'REST APIs' },
  'api': { canonical: 'rest-api', display: 'REST APIs' },
  'apis': { canonical: 'rest-api', display: 'REST APIs' },

  // Python & Data Science
  'python': { canonical: 'python', display: 'Python' },
  'py': { canonical: 'python', display: 'Python' },
  'python3': { canonical: 'python', display: 'Python' },
  'pandas': { canonical: 'pandas', display: 'Pandas' },
  'numpy': { canonical: 'numpy', display: 'NumPy' },
  'scikit-learn': { canonical: 'scikit-learn', display: 'Scikit-learn' },
  'sklearn': { canonical: 'scikit-learn', display: 'Scikit-learn' },
  'tensorflow': { canonical: 'tensorflow', display: 'TensorFlow' },
  'pytorch': { canonical: 'pytorch', display: 'PyTorch' },
  'keras': { canonical: 'keras', display: 'Keras' },
  'power bi': { canonical: 'power bi', display: 'Power BI' },
  'powerbi': { canonical: 'power bi', display: 'Power BI' },
  'excel': { canonical: 'excel', display: 'Excel' },
  'statistics': { canonical: 'statistics', display: 'Statistics' },
  'stats': { canonical: 'statistics', display: 'Statistics' },

  // Databases
  'mongo db': { canonical: 'mongodb', display: 'MongoDB' },
  'mongodb': { canonical: 'mongodb', display: 'MongoDB' },
  'mongo': { canonical: 'mongodb', display: 'MongoDB' },
  'sql': { canonical: 'sql', display: 'SQL' },
  'my sql': { canonical: 'mysql', display: 'MySQL' },
  'mysql': { canonical: 'mysql', display: 'MySQL' },
  'postgres': { canonical: 'postgresql', display: 'PostgreSQL' },
  'postgresql': { canonical: 'postgresql', display: 'PostgreSQL' },
  'postgre sql': { canonical: 'postgresql', display: 'PostgreSQL' },
  'postgres db': { canonical: 'postgresql', display: 'PostgreSQL' },
  'postgresql db': { canonical: 'postgresql', display: 'PostgreSQL' },
  'redis': { canonical: 'redis', display: 'Redis' },
  'oracle': { canonical: 'oracle', display: 'Oracle' },
  'sqlite': { canonical: 'sqlite', display: 'SQLite' },

  // QA & Testing
  'selenium': { canonical: 'selenium', display: 'Selenium' },
  'testng': { canonical: 'testng', display: 'TestNG' },
  'junit': { canonical: 'junit', display: 'JUnit' },
  'api testing': { canonical: 'api testing', display: 'API Testing' },
  'cypress': { canonical: 'cypress', display: 'Cypress' },
  'playwright': { canonical: 'playwright', display: 'Playwright' },

  // DevOps & Cloud
  'linux': { canonical: 'linux', display: 'Linux' },
  'aws': { canonical: 'aws', display: 'AWS' },
  'amazon web services': { canonical: 'aws', display: 'AWS' },
  'docker': { canonical: 'docker', display: 'Docker' },
  'k8s': { canonical: 'kubernetes', display: 'Kubernetes' },
  'kubernetes': { canonical: 'kubernetes', display: 'Kubernetes' },
  'azure': { canonical: 'azure', display: 'Azure' },
  'microsoft azure': { canonical: 'azure', display: 'Azure' },
  'gcp': { canonical: 'gcp', display: 'GCP' },
  'google cloud': { canonical: 'gcp', display: 'GCP' },
  'google cloud platform': { canonical: 'gcp', display: 'GCP' },
  'ci/cd': { canonical: 'cicd', display: 'CI/CD' },
  'cicd': { canonical: 'cicd', display: 'CI/CD' },

  // Blockchain
  'solidity': { canonical: 'solidity', display: 'Solidity' },
  'ethereum': { canonical: 'ethereum', display: 'Ethereum' },
  'web3.js': { canonical: 'web3.js', display: 'Web3.js' },
  'web3': { canonical: 'web3.js', display: 'Web3.js' },
  'smart contracts': { canonical: 'smart contracts', display: 'Smart Contracts' },

  // Developer Tools & Version Control
  'git': { canonical: 'git', display: 'Git' },
  'git hub': { canonical: 'github', display: 'GitHub' },
  'github': { canonical: 'github', display: 'GitHub' },
  'gitlab': { canonical: 'gitlab', display: 'GitLab' },
  'vscode': { canonical: 'vs code', display: 'VS Code' },
  'vs code': { canonical: 'vs code', display: 'VS Code' },
  'visual studio code': { canonical: 'vs code', display: 'VS Code' },

  // C / C++ / C#
  'c': { canonical: 'c', display: 'C' },
  'c++': { canonical: 'cpp', display: 'C++' },
  'cpp': { canonical: 'cpp', display: 'C++' },
  'c#': { canonical: 'csharp', display: 'C#' },
  'csharp': { canonical: 'csharp', display: 'C#' },

  // CS Core & AI / ML
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
  'css': { canonical: 'css', display: 'CSS' },
  'tailwind': { canonical: 'tailwindcss', display: 'Tailwind CSS' },
  'tailwindcss': { canonical: 'tailwindcss', display: 'Tailwind CSS' },
  'bootstrap': { canonical: 'bootstrap', display: 'Bootstrap' }
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
 * Parses raw required or preferred skills into structured requirement items.
 * Handles comma-separated skills and compound slash skills (e.g. "MongoDB / PostgreSQL").
 */
function parseRequiredSkills(rawSkills) {
  let list = [];
  if (typeof rawSkills === 'string') {
    list = rawSkills.split(',').map(s => s.trim()).filter(Boolean);
  } else if (Array.isArray(rawSkills)) {
    list = rawSkills.map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);
  }

  const requirements = [];
  const seenCanonicals = new Set();

  list.forEach(item => {
    // Handle compound skills with slashes or OR, e.g., "MongoDB / PostgreSQL" or "React / Vue"
    const options = item.split(/\s+[/|]\s+|\s+or\s+/i).map(opt => opt.trim()).filter(Boolean);
    const parsedOptions = options.map(opt => normalizeSkill(opt)).filter(Boolean);

    if (parsedOptions.length === 0) return;

    const primaryCanonical = parsedOptions[0].canonical;

    // Deduplicate skills in list to prevent inflated denominator
    if (seenCanonicals.has(primaryCanonical)) return;
    seenCanonicals.add(primaryCanonical);

    requirements.push({
      originalDisplay: item,
      options: parsedOptions
    });
  });

  return requirements;
}

/**
 * Extracts a unified list of raw skills from student skills and student projects.
 */
function extractStudentSkillList(student) {
  const list = [];
  if (!student) return list;

  // 1. Direct skills relation
  if (Array.isArray(student.skills)) {
    student.skills.forEach(s => {
      if (typeof s === 'string') list.push(s);
      else if (s && typeof s === 'object') {
        const name = s.skillName || s.name || s.skill || s.title || '';
        if (name) list.push(name);
      }
    });
  }

  // 2. Tech stack from student projects
  if (Array.isArray(student.projects)) {
    student.projects.forEach(p => {
      if (p && p.techStack && typeof p.techStack === 'string') {
        p.techStack.split(',').forEach(item => {
          if (item.trim()) list.push(item.trim());
        });
      }
    });
  }

  return list;
}

/**
 * Universal Canonical Skill Matching Engine.
 * Supports separating Required Skills (80% weight) and Preferred Skills (20% weight).
 * 
 * @param {Array|Object} rawStudentSkills - Student profile object or array of skills
 * @param {string|Array} rawRequiredSkills - Job mandatory required skills
 * @param {string|Array} [rawPreferredSkills] - Job optional preferred skills
 */
function matchSkills(rawStudentSkills = [], rawRequiredSkills = '', rawPreferredSkills = '') {
  let studentList = [];

  if (rawStudentSkills && typeof rawStudentSkills === 'object' && !Array.isArray(rawStudentSkills) && (rawStudentSkills.skills || rawStudentSkills.projects)) {
    studentList = extractStudentSkillList(rawStudentSkills);
  } else if (Array.isArray(rawStudentSkills)) {
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

  // 1. Process Required Skills
  const reqRequirements = parseRequiredSkills(rawRequiredSkills);
  const requiredSkills = [];
  const matchedSkills = [];
  const missingSkills = [];

  reqRequirements.forEach(req => {
    const reqDisplay = req.originalDisplay;
    requiredSkills.push(reqDisplay);

    const isMatched = req.options.some(opt => studentCanonicalSet.has(opt.canonical));
    if (isMatched) {
      matchedSkills.push(reqDisplay);
    } else {
      missingSkills.push(reqDisplay);
    }
  });

  // 2. Process Preferred Skills (if provided)
  const prefRequirements = parseRequiredSkills(rawPreferredSkills);
  const preferredSkills = [];
  const matchedPreferredSkills = [];
  const missingPreferredSkills = [];

  prefRequirements.forEach(req => {
    const reqDisplay = req.originalDisplay;
    preferredSkills.push(reqDisplay);

    const isMatched = req.options.some(opt => studentCanonicalSet.has(opt.canonical));
    if (isMatched) {
      matchedPreferredSkills.push(reqDisplay);
    } else {
      missingPreferredSkills.push(reqDisplay);
    }
  });

  // 3. Calculate Weighted Skill Score
  let skillMatchPercentage = 100;
  const hasRequired = requiredSkills.length > 0;
  const hasPreferred = preferredSkills.length > 0;

  if (hasRequired && hasPreferred) {
    const reqScore = (matchedSkills.length / requiredSkills.length) * 80;
    const prefScore = (matchedPreferredSkills.length / preferredSkills.length) * 20;
    skillMatchPercentage = Math.round(reqScore + prefScore);
  } else if (hasRequired) {
    skillMatchPercentage = Math.round((matchedSkills.length / requiredSkills.length) * 100);
  } else if (hasPreferred) {
    skillMatchPercentage = Math.round((matchedPreferredSkills.length / preferredSkills.length) * 100);
  } else {
    skillMatchPercentage = 100;
  }

  return {
    skillMatchPercentage,
    percentage: skillMatchPercentage,
    requiredSkills,
    matchedSkills,
    missingSkills,
    preferredSkills,
    matchedPreferredSkills,
    missingPreferredSkills
  };
}

module.exports = {
  normalizeSkill,
  parseRequiredSkills,
  matchSkills,
  extractStudentSkillList,
  CANONICAL_ALIASES
};
