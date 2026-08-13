const skillsConfig = require('../config/skills');

function normalizeResumeText(text) {
  if (!text) return '';
  return text
    .replace(/\n{2,}/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/[^\w\s\.\+#-]/gi, ' ')
    .trim();
}

function extractSkills(text, threshold = 0.5) {
  const normalizedText = normalizeResumeText(text);
  const lines = normalizedText.split('\n');
  
  const extractedSkills = new Map();

  const allSkills = new Set();
  Object.values(skillsConfig.categories).forEach(categorySkills => {
    categorySkills.forEach(skill => allSkills.add(skill));
  });

  const academicHeaders = [
    'education', 'academic qualifications', 'educational qualification',
    'education background', 'academic details', 'degree', 'qualification', 'academic profile'
  ];
  
  const skillsHeaders = [
    'skills', 'technical skills', 'skills & technologies', 'technical skills & tools',
    'programming skills', 'technologies', 'core competencies', 'technical expertise', 'technical stack', 'frameworks', 'tools'
  ];

  const degreePatternsLower = skillsConfig.degreePatterns.map(d => d.toLowerCase());
  const academicBranchesLower = skillsConfig.academicBranches.map(b => b.toLowerCase());
  const academicAbbreviationsLower = skillsConfig.academicAbbreviations.map(a => a.toLowerCase());

  // Determine if a skill name is dangerously ambiguous (i.e. it's a substring of an academic branch or is an abbreviation)
  const isAmbiguousAcademicSkill = (skillStr) => {
    const s = skillStr.toLowerCase();
    if (academicAbbreviationsLower.includes(s) || ['ai', 'ml', 'it'].includes(s)) return true;
    for (const branch of academicBranchesLower) {
      if (branch.includes(s)) return true;
    }
    return false;
  };

  let currentSection = 'OTHER';

  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();
    if (!lowerLine) continue;

    const isSkillsHeader = skillsHeaders.some(h => lowerLine === h || lowerLine.startsWith(h + ':') || lowerLine.startsWith(h + ' '));
    const isAcademicHeader = academicHeaders.some(h => lowerLine === h || lowerLine.startsWith(h + ':') || lowerLine.startsWith(h + ' '));
    
    if (isSkillsHeader) {
      currentSection = 'SKILLS';
    } else if (isAcademicHeader) {
      currentSection = 'ACADEMIC';
    } else if (lowerLine.length < 40 && (lowerLine.includes('experience') || lowerLine.includes('projects') || lowerLine.includes('summary'))) {
      currentSection = 'OTHER';
    }

    // Check for inline academic context (e.g. B.Tech is on the same line)
    const hasDegreePattern = degreePatternsLower.some(d => {
      const escaped = d.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      return new RegExp(`(?:^|[^a-z0-9])(${escaped})(?:$|[^a-z0-9])`, 'i').test(lowerLine);
    });

    const isAcademicContext = currentSection === 'ACADEMIC' || hasDegreePattern;

    const matches = new Set();
    let currentConfidence = 0.3;

    if (currentSection === 'SKILLS') {
      currentConfidence = 1.0;
    } else if (currentSection === 'OTHER') {
      currentConfidence = 0.7;
    } else if (isAcademicContext) {
      currentConfidence = 0.6; // We can extract pure skills here, but with caution
    }

    const findWordMatch = (word, sourceText) => {
      const escaped = word.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-z0-9])(${escaped})(?:$|[^a-z0-9])`, 'i');
      return regex.test(sourceText);
    };

    // 1. Check aliases
    for (const [alias, canonical] of Object.entries(skillsConfig.aliases)) {
      if (findWordMatch(alias, lowerLine)) {
        matches.add(canonical);
      }
    }

    // 2. Check canonical skills
    for (const skill of allSkills) {
      if (matches.has(skill)) continue;
      if (findWordMatch(skill.toLowerCase(), lowerLine)) {
        matches.add(skill);
      }
    }

    // 3. Filter matches based on context and remove overlapping substrings (e.g. "Spring" when "Spring Boot" matches)
    const matchedArr = Array.from(matches);
    const filteredMatches = new Set();
    for (const skill of matchedArr) {
      let isSubstring = false;
      for (const other of matchedArr) {
        if (skill !== other && other.toLowerCase().includes(skill.toLowerCase())) {
          isSubstring = true;
          break;
        }
      }
      if (!isSubstring) {
        filteredMatches.add(skill);
      }
    }

    for (const skill of filteredMatches) {
      if (isAcademicContext && isAmbiguousAcademicSkill(skill)) {
        // e.g. "Artificial Intelligence" matched in "B.Tech Artificial Intelligence and Data Science"
        // We suppress it because it's part of the degree/branch!
        continue;
      }
      
      const existingConf = extractedSkills.get(skill) || 0;
      if (currentConfidence > existingConf) {
        extractedSkills.set(skill, currentConfidence);
      }
    }
  }

  // Filter by threshold and deduplicate
  const finalSkills = [];
  for (const [skill, conf] of extractedSkills.entries()) {
    if (conf >= threshold) {
      finalSkills.push(skill);
    }
  }

  return finalSkills;
}

module.exports = {
  normalizeResumeText,
  extractSkills
};
