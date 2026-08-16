/**
 * Centralized Skill Normalization and Matching Mechanism
 */

// Comprehensive Canonical Alias Map (lowercase normalized keys -> canonical display & key)
const CANONICAL_ALIASES = {
  // Node.js
  'node': { canonical: 'node.js', display: 'Node.js' },
  'nodejs': { canonical: 'node.js', display: 'Node.js' },
  'node js': { canonical: 'node.js', display: 'Node.js' },
  'node.js': { canonical: 'node.js', display: 'Node.js' },

  // Express.js
  'express': { canonical: 'express.js', display: 'Express.js' },
  'expressjs': { canonical: 'express.js', display: 'Express.js' },
  'express js': { canonical: 'express.js', display: 'Express.js' },
  'express.js': { canonical: 'express.js', display: 'Express.js' },

  // React.js
  'react': { canonical: 'react.js', display: 'React.js' },
  'reactjs': { canonical: 'react.js', display: 'React.js' },
  'react js': { canonical: 'react.js', display: 'React.js' },
  'react.js': { canonical: 'react.js', display: 'React.js' },

  // Vue.js
  'vue': { canonical: 'vue.js', display: 'Vue.js' },
  'vuejs': { canonical: 'vue.js', display: 'Vue.js' },
  'vue js': { canonical: 'vue.js', display: 'Vue.js' },
  'vue.js': { canonical: 'vue.js', display: 'Vue.js' },

  // Next.js
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

  // Databases
  'mongo db': { canonical: 'mongodb', display: 'MongoDB' },
  'mongodb': { canonical: 'mongodb', display: 'MongoDB' },
  'mongo': { canonical: 'mongodb', display: 'MongoDB' },
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

  // DevOps & Cloud
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

  // Developer Tools & Version Control
  'git': { canonical: 'git', display: 'Git' },
  'git hub': { canonical: 'github', display: 'GitHub' },
  'github': { canonical: 'github', display: 'GitHub' },
  'gitlab': { canonical: 'gitlab', display: 'GitLab' },
  'vscode': { canonical: 'vs code', display: 'VS Code' },
  'vs code': { canonical: 'vs code', display: 'VS Code' },
  'visual studio code': { canonical: 'vs code', display: 'VS Code' },

  // Programming Languages
  'java script': { canonical: 'javascript', display: 'JavaScript' },
  'javascript': { canonical: 'javascript', display: 'JavaScript' },
  'js': { canonical: 'javascript', display: 'JavaScript' },
  
  'type script': { canonical: 'typescript', display: 'TypeScript' },
  'typescript': { canonical: 'typescript', display: 'TypeScript' },
  'ts': { canonical: 'typescript', display: 'TypeScript' },

  // Java (strictly distinct from JavaScript!)
  'java': { canonical: 'java', display: 'Java' },

  // Python
  'python': { canonical: 'python', display: 'Python' },
  'py': { canonical: 'python', display: 'Python' },
  'python3': { canonical: 'python', display: 'Python' },

  // C / C++ / C#
  'c': { canonical: 'c', display: 'C' },
  'c++': { canonical: 'cpp', display: 'C++' },
  'cpp': { canonical: 'cpp', display: 'C++' },
  'c#': { canonical: 'csharp', display: 'C#' },
  'csharp': { canonical: 'csharp', display: 'C#' },

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
  'algorithms': { canonical: 'dsa', display: 'DSA' },

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
 * Matches a student's skills against a job's required skills.
 * 
 * @param {Array<string|Object>|Object} rawStudentSkills - Student skills or student object
 * @param {string|Array<string>} rawRequiredSkills - Job required skills
 * @returns {Object} { skillMatchPercentage, matchedSkills, missingSkills }
 */
function matchSkills(rawStudentSkills = [], rawRequiredSkills = '') {
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

  // Parse job required skills into array of strings
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
      skillMatchPercentage: 100, // No required skills specified means 100% skill match
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
  matchSkills,
  extractStudentSkillList,
  CANONICAL_ALIASES
};
