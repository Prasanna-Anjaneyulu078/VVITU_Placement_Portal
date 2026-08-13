const { extractSkills } = require('../src/utils/skillExtraction');

const testCases = [
  {
    name: 'Case 1 - Branch vs Skills',
    resumeText: `
Education:
B.Tech
Artificial Intelligence and Data Science

Skills:
Java
Python
Spring Boot
    `,
    expected: ['Java', 'Python', 'Spring Boot'],
    forbidden: ['Artificial Intelligence', 'Data Science', 'Artificial Intelligence and Data Science']
  },
  {
    name: 'Case 2 - CSE Abbreviation',
    resumeText: `
Education:
B.Tech - CSE

Skills:
Python
Machine Learning
React.js
    `,
    expected: ['Python', 'Machine Learning', 'React.js'],
    forbidden: ['CSE', 'Computer Science']
  },
  {
    name: 'Case 3 - Legitimate AI Skills',
    resumeText: `
Skills:
Artificial Intelligence
Machine Learning
Python
TensorFlow
    `,
    expected: ['Artificial Intelligence', 'Machine Learning', 'Python', 'TensorFlow'],
    forbidden: []
  },
  {
    name: 'Case 4 - Mixed Sections',
    resumeText: `
Education:
B.Tech - Artificial Intelligence and Data Science

Technical Skills:
Java
Spring Boot
MySQL
Docker
    `,
    expected: ['Java', 'Spring Boot', 'MySQL', 'Docker'],
    forbidden: ['Artificial Intelligence']
  },
  {
    name: 'Case 5 - AIDS Near Degree',
    resumeText: `
B.Tech
VVIT
CGPA
AIDS
    `,
    expected: [],
    forbidden: ['AIDS', 'Artificial Intelligence']
  }
];

function runTests() {
  let passed = 0;
  for (const tc of testCases) {
    const extracted = extractSkills(tc.resumeText, 0.5);
    
    let allExpectedFound = tc.expected.every(e => extracted.includes(e));
    let noForbiddenFound = tc.forbidden.every(f => !extracted.includes(f));
    
    if (allExpectedFound && noForbiddenFound && extracted.length === tc.expected.length) {
      console.log(`✅ ${tc.name} passed`);
      passed++;
    } else {
      console.error(`❌ ${tc.name} failed!`);
      console.error(`   Extracted: `, extracted);
      console.error(`   Expected: `, tc.expected);
      console.error(`   Forbidden found: `, tc.forbidden.filter(f => extracted.includes(f)));
    }
  }
  console.log(`\nPassed ${passed} / ${testCases.length} tests.`);
}

runTests();
