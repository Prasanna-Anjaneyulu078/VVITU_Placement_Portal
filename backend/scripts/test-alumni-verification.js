const { DocumentVerificationService } = require('../src/services/documentVerification.service');

const tests = [
  {
    name: 'Test 1 - Exact match',
    formName: 'GARIKAPATI ASHRITHA',
    ocrName: 'GARIKAPATI ASHRITHA',
    formRoll: '24BQ5A5403',
    ocrRoll: '24BQ5A5403',
    expectedName: true,
    expectedRoll: true
  },
  {
    name: 'Test 2 - OCR typo safe',
    formName: 'GARIKAPATI ASHRITHA',
    ocrName: 'GARIKAPATI ASHRITHA', 
    formRoll: '24BQ5A5403',
    ocrRoll: '24BQSA5403',
    expectedName: true, 
    expectedRoll: true // S <-> 5 is safe
  },
  {
    name: 'Test 3 - Extra trailing characters',
    formName: 'GARIKAPATI ASHRITHAAA',
    ocrName: 'GARIKAPATI ASHRITHA',
    formRoll: '24BQ5A5403',
    ocrRoll: '24BQ5A5403',
    expectedName: false, // Should fail
    expectedRoll: true
  },
  {
    name: 'Test 4 - Different person',
    formName: 'GARIKAPATI ASHRITHA',
    ocrName: 'GARIKAPATI RAHUL',
    formRoll: '24BQ5A5403',
    ocrRoll: '24BQ5A5403',
    expectedName: false, // Should fail
    expectedRoll: true
  },
  {
    name: 'Test 5 - Roll mismatch',
    formName: 'GARIKAPATI ASHRITHA',
    ocrName: 'GARIKAPATI ASHRITHA',
    formRoll: '24BQ5A5403',
    ocrRoll: '24BQ5A5408',
    expectedName: true,
    expectedRoll: false // Should fail
  }
];

async function runTests() {
  let passed = 0;
  for (const t of tests) {
    const nameMatch = DocumentVerificationService.validateNameMatch(t.formName, t.ocrName).matched;
    const rollMatch = DocumentVerificationService.isSimilarRollNumber(t.ocrRoll, t.formRoll);
    
    let ok = nameMatch === t.expectedName && rollMatch === t.expectedRoll;
    if (ok) {
      console.log(`✅ ${t.name} passed`);
      passed++;
    } else {
      console.error(`❌ ${t.name} failed!`);
      console.error(`   Name: expected ${t.expectedName}, got ${nameMatch}`);
      console.error(`   Roll: expected ${t.expectedRoll}, got ${rollMatch}`);
    }
  }
  console.log(`\nPassed ${passed} / ${tests.length} tests.`);
}

runTests();
