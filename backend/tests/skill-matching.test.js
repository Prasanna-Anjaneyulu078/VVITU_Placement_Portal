const { matchSkills, normalizeSkill } = require('../src/utils/skillMatcher');

describe('Student Job Skill Matching Engine (Deterministic Set-Based Matcher)', () => {
  
  // Test 1 — Exact Match
  it('Test 1 — Exact Match: returns 100% match percentage', () => {
    const studentSkills = ['Java', 'Python', 'React.js'];
    const requiredSkills = 'Java, Python, React.js';
    const result = matchSkills(studentSkills, requiredSkills);

    expect(result.skillMatchPercentage).toBe(100);
    expect(result.matchedSkills).toEqual(['Java', 'Python', 'React.js']);
    expect(result.missingSkills).toEqual([]);
  });

  // Test 2 — Partial Match
  it('Test 2 — Partial Match: returns 50% match percentage', () => {
    const studentSkills = ['Java', 'Python'];
    const requiredSkills = 'Java, Python, React.js, Docker';
    const result = matchSkills(studentSkills, requiredSkills);

    expect(result.skillMatchPercentage).toBe(50);
    expect(result.matchedSkills).toEqual(['Java', 'Python']);
    expect(result.missingSkills).toEqual(['React.js', 'Docker']);
  });

  // Test 3 — No Match
  it('Test 3 — No Match: returns 0% match percentage', () => {
    const studentSkills = ['Java'];
    const requiredSkills = 'Python, Docker';
    const result = matchSkills(studentSkills, requiredSkills);

    expect(result.skillMatchPercentage).toBe(0);
    expect(result.matchedSkills).toEqual([]);
    expect(result.missingSkills).toEqual(['Python', 'Docker']);
  });

  // Test 4 — Case Difference
  it('Test 4 — Case Difference: ignores casing and returns 100%', () => {
    const studentSkills = ['JAVA', 'PYTHON'];
    const requiredSkills = 'Java, Python';
    const result = matchSkills(studentSkills, requiredSkills);

    expect(result.skillMatchPercentage).toBe(100);
    expect(result.matchedSkills).toEqual(['Java', 'Python']);
    expect(result.missingSkills).toEqual([]);
  });

  // Test 5 — Alias Difference
  it('Test 5 — Alias Difference: normalizes NodeJS and ExpressJS to Node.js and Express.js', () => {
    const studentSkills = ['NodeJS', 'ExpressJS', 'SpringBoot', 'VSCode'];
    const requiredSkills = 'Node.js, Express.js, Spring Boot, VS Code';
    const result = matchSkills(studentSkills, requiredSkills);

    expect(result.skillMatchPercentage).toBe(100);
    expect(result.matchedSkills).toEqual(['Node.js', 'Express.js', 'Spring Boot', 'VS Code']);
    expect(result.missingSkills).toEqual([]);
  });

  // Test 6 — Java vs JavaScript
  it('Test 6 — Java vs JavaScript: Java does NOT match JavaScript (0%)', () => {
    const studentSkills = ['Java'];
    const requiredSkills = 'JavaScript';
    const result = matchSkills(studentSkills, requiredSkills);

    expect(result.skillMatchPercentage).toBe(0);
    expect(result.matchedSkills).toEqual([]);
    expect(result.missingSkills).toEqual(['JavaScript']);
  });

  // Test 7 — Duplicate Skills
  it('Test 7 — Duplicate Skills: deduplicates student and job skills', () => {
    const studentSkills = ['Java', 'Java', 'JAVA', 'java'];
    const requiredSkills = 'Java, Java';
    const result = matchSkills(studentSkills, requiredSkills);

    expect(result.skillMatchPercentage).toBe(100);
    expect(result.matchedSkills).toEqual(['Java']);
    expect(result.missingSkills).toEqual([]);
  });

  // Test 8 — Exact Bug Scenario (19 Skills)
  it('Test 8 — Exact Bug Scenario: 19 student skills matching 19 required skills returns 100%', () => {
    const studentSkills = [
      'Artificial Intelligence',
      'Docker',
      'Git',
      'GitHub',
      'Java',
      'JavaScript',
      'MongoDB',
      'MySQL',
      'Node.js',
      'Express.js',
      'DSA',
      'CS Core',
      'Postman',
      'Python',
      'React.js',
      'Spring Boot',
      'Spring MVC',
      'SQL',
      'VS Code'
    ];

    const requiredSkills = `
      GitHub, Spring Boot, React.js, Artificial Intelligence, MySQL, Docker,
      Python, JavaScript, SQL, Spring MVC, MongoDB, Git, Postman, VS Code,
      Java, Node.js, Express.js, DSA, CS Core
    `;

    const result = matchSkills(studentSkills, requiredSkills);

    expect(result.skillMatchPercentage).toBe(100);
    expect(result.matchedSkills.length).toBe(19);
    expect(result.missingSkills.length).toBe(0);
    expect(result.missingSkills).toEqual([]);
  });

});
