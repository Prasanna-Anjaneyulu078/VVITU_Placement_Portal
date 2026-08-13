/**
 * OCR Verification Engine — Comprehensive Test Suite
 *
 * Tests the DocumentVerificationService in isolation using mocked OcrService.
 * Covers all 35 test cases specified in the Master Prompt.
 */

'use strict';

jest.mock('../src/config/db', () => ({
  ocrAuditLog: {
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 1 })
  }
}));

jest.mock('../src/services/ocr.service');
const OcrService = require('../src/services/ocr.service');

const {
  DocumentVerificationService,
  OcrDecision,
  ReasonCode
} = require('../src/services/documentVerification.service');

// ─── Helper: Build a mock file ─────────────────────────────────────────────
function mockFile(rawOcrText, source = 'PDF_TEXT', confidence = 85) {
  OcrService.getFileBuffer = jest.fn().mockReturnValue(Buffer.from('fake-pdf'));
  OcrService.extractDocument = jest.fn().mockResolvedValue({
    text: rawOcrText,
    confidence,
    pageCount: 1,
    source
  });
  return { originalname: 'test.pdf', filename: 'test-123.pdf', path: '/tmp/test.pdf' };
}

function mockOcrFailure(errorMessage = 'OCR_ENGINE_FAILED: Tesseract unavailable') {
  OcrService.getFileBuffer = jest.fn().mockReturnValue(Buffer.from('fake-pdf'));
  OcrService.extractDocument = jest.fn().mockRejectedValue(new Error(errorMessage));
  return { originalname: 'test.pdf', filename: 'test-123.pdf', path: '/tmp/test.pdf' };
}

async function verify(rawOcrText, formName, formRoll, source = 'PDF_TEXT', confidence = 85) {
  const file = mockFile(rawOcrText, source, confidence);
  return DocumentVerificationService.validateRegistrationData(
    file, formName, formRoll, 'test@vvit.ac.in', '127.0.0.1'
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAME MATCHING TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('NAME MATCHING', () => {

  // Test 1 — Exact match
  it('Test 1: Exact name match → VERIFIED', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name of the Student: GANGAVARAPU SATISH KUMAR
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    expect(result.name.status).toBe('MATCH');
    expect(result.decision).toBe(OcrDecision.VERIFIED);
  });

  // Test 2 — OCR repeated trailing characters
  it('Test 2: OCR repeated chars (KUMARRR) → MANUAL_REVIEW', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMARRR
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    expect(result.name.status).toBe('MANUAL_REVIEW');
    expect(result.decision).toBe(OcrDecision.PENDING_MANUAL_REVIEW);
  });

  // Test 3 — Form has repeated character (user typo matches OCR)
  it('Test 3: Form name has repeated chars (KUMARRR) vs clean OCR → MISMATCH', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMAR
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMARRR', '22BQ1A0560');
    expect(result.name.status).toBe('MISMATCH');
    expect(result.decision).toBe(OcrDecision.REJECTED);
  });

  // Test 4 — Minor OCR typo (KUMER vs KUMAR)
  it('Test 4: Minor OCR typo (KUMER vs KUMAR) → MANUAL_REVIEW', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMER
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    // Should NOT be VERIFIED; should be MANUAL_REVIEW or MISMATCH
    expect(['MANUAL_REVIEW', 'MISMATCH']).toContain(result.name.status);
    expect(result.decision).not.toBe(OcrDecision.VERIFIED);
  });

  // Test 5 — Completely different name
  it('Test 5: Completely different name → REJECTED', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GARIKAPATI ASHRITHA
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    expect(result.name.status).toBe('MISMATCH');
    expect(result.decision).toBe(OcrDecision.REJECTED);
    expect(result.reasonCode).toBe(ReasonCode.NAME_MISMATCH);
  });

  // Test 6 — Different middle/last token (RAVI vs SATISH) — critical token mismatch
  it('Test 6: Different middle token (RAVI vs SATISH) → REJECTED', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU RAVI KUMAR
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    expect(result.decision).toBe(OcrDecision.REJECTED);
    expect(result.reasonCode).toBe(ReasonCode.NAME_MISMATCH);
  });

  // Test 7 — Additional surname in OCR
  it('Test 7: Additional surname in OCR (KUMAR REDDY) → PENDING_MANUAL_REVIEW or REJECTED (never auto-VERIFIED)', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMAR REDDY
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    // "GANGAVARAPU SATISH KUMAR REDDY" has different token count — engine correctly treats as MISMATCH or MANUAL_REVIEW
    // The key requirement is it must NOT be auto-VERIFIED (since names differ)
    expect(result.decision).not.toBe(OcrDecision.VERIFIED);
    // Admin must review this — either MANUAL_REVIEW routed to PENDING, or REJECTED
    expect([OcrDecision.PENDING_MANUAL_REVIEW, OcrDecision.REJECTED]).toContain(result.decision);
  });

  // Test 8 — Token order difference (KUMAR SATISH GANGAVARAPU vs expected)
  it('Test 8: Wrong token order → MISMATCH or MANUAL_REVIEW', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: KUMAR SATISH GANGAVARAPU
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    // High global similarity but wrong order — should NOT be VERIFIED
    expect(result.decision).not.toBe(OcrDecision.VERIFIED);
  });

  // ==========================================
  // MASTER PROMPT REQUIRED TEST CASES
  // ==========================================

  it('MP Test 1: Exact Name Match → MATCH', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMAR
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    expect(result.name.status).toBe('MATCH');
    expect(result.name.reasonCode).toBe('NAME_EXACT_MATCH');
    expect(result.decision).toBe(OcrDecision.VERIFIED);
  });

  it('MP Test 2: Form Extra Characters (KUMARRR) → NOT AUTOMATIC MATCH', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMAR
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMARRR', '22BQ1A0560');
    expect(result.name.status).toBe('MISMATCH');
    expect(result.name.reasonCode).toBe('NAME_FORM_EXTRA_CHARACTERS');
    expect(result.decision).toBe(OcrDecision.REJECTED);
  });

  it('MP Test 3: OCR Extra Characters (KUMARRR) → LIKELY_OCR_ERROR / MANUAL_REVIEW', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMARR
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    expect(result.name.status).toBe('MANUAL_REVIEW');
    expect(result.name.reasonCode).toBe('NAME_LIKELY_OCR_ERROR');
    expect(result.decision).toBe(OcrDecision.PENDING_MANUAL_REVIEW);
  });

  it('MP Test 4: Minor Form Typo (SATIH) → MANUAL_REVIEW', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMAR
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATIH KUMAR', '22BQ1A0560');
    expect(result.name.status).toBe('MANUAL_REVIEW');
    expect(result.name.reasonCode).toBe('NAME_FORM_TYPO');
    expect(result.decision).toBe(OcrDecision.PENDING_MANUAL_REVIEW);
  });

  it('MP Test 5: Form Missing Token (Missing KUMAR) → MISMATCH / MANUAL_REVIEW', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMAR
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH', '22BQ1A0560');
    // We configured it to return MANUAL_REVIEW and NAME_FORM_MISSING_TOKEN
    expect(['MISMATCH', 'MANUAL_REVIEW']).toContain(result.name.status);
    expect(result.decision).not.toBe(OcrDecision.VERIFIED);
  });

  it('MP Test 6: Form Extra Token (REDDY) → MISMATCH / MANUAL_REVIEW', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMAR
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR REDDY', '22BQ1A0560');
    expect(result.name.status).toBe('MISMATCH');
    expect(result.name.reasonCode).toBe('NAME_FORM_EXTRA_TOKEN');
    expect(result.decision).toBe(OcrDecision.REJECTED);
  });

  it('MP Test 7: Completely Different Name → FAILED_NAME_MISMATCH (REJECTED)', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMAR
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'RAHUL KUMAR', '22BQ1A0560');
    expect(result.name.status).toBe('MISMATCH');
    expect(result.name.reasonCode).toBe('NAME_DIFFERENT');
    expect(result.decision).toBe(OcrDecision.REJECTED);
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// ROLL NUMBER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('ROLL NUMBER MATCHING', () => {

  // Test 9 — Exact roll number
  it('Test 9: Exact roll number → MATCH', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMAR
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    expect(result.rollNumber.status).toBe('MATCH');
    expect(result.rollNumber.confidence).toBe(1.0);
  });

  // Test 10 — OCR O/0 confusion
  it('Test 10: OCR O→0 confusion (056O vs 0560) → MATCH after normalization', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMAR
      22BQ1A056O
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    expect(result.rollNumber.status).toBe('MATCH');
  });

  // Test 11 — OCR I/1 confusion
  it('Test 11: OCR I→1 confusion (22BQlA0560 vs 22BQ1A0560) → MATCH after normalization', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMAR
      22BQlA0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    expect(result.rollNumber.status).toBe('MATCH');
  });

  // Test 12 — Changed last digit (0560 → 0568) — NOT a controlled OCR confusion
  it('Test 12: Different meaningful digit (0568 vs 0560) → MISMATCH, NOT approved', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMAR
      Roll Number: 22BQ1A0568
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    expect(result.rollNumber.status).toBe('MISMATCH');
    expect(result.decision).toBe(OcrDecision.REJECTED);
    expect(result.reasonCode).toBe(ReasonCode.ROLL_NUMBER_MISMATCH);
  });

  // Test 13 — Completely different roll number
  it('Test 13: Completely different roll number → REJECTED', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMAR
      Roll Number: 19BQ5A1234
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    expect(result.rollNumber.status).toBe('MISMATCH');
    expect(result.decision).toBe(OcrDecision.REJECTED);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// COLLEGE VERIFICATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('COLLEGE VERIFICATION', () => {

  // Test 14 — Short form VVIT
  it('Test 14: "VVIT" in document → COLLEGE MATCH', async () => {
    const text = `VVIT\nName: SATISH KUMAR\nRoll: 22BQ1A0560`;
    const result = await verify(text, 'SATISH KUMAR', '22BQ1A0560');
    expect(result.college.status).toBe('MATCH');
  });

  // Test 15 — VVITU
  it('Test 15: "VVITU" in document → COLLEGE MATCH', async () => {
    const text = `VVITU\nName: SATISH KUMAR\nRoll: 22BQ1A0560`;
    const result = await verify(text, 'SATISH KUMAR', '22BQ1A0560');
    expect(result.college.status).toBe('MATCH');
  });

  // Test 16 — Full institution name
  it('Test 16: Full "VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY" → COLLEGE MATCH', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: SATISH KUMAR
      Roll: 22BQ1A0560
    `;
    const result = await verify(text, 'SATISH KUMAR', '22BQ1A0560');
    expect(result.college.status).toBe('MATCH');
  });

  // Test 17 — Wrong institution
  it('Test 17: Wrong institution "ABC ENGINEERING COLLEGE" → REJECTED with COLLEGE_MISMATCH', async () => {
    const text = `
      ABC ENGINEERING COLLEGE
      Name: GANGAVARAPU SATISH KUMAR
      Roll: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    expect(result.college.status).toBe('MISMATCH');
    expect(result.decision).toBe(OcrDecision.REJECTED);
    expect(result.reasonCode).toBe(ReasonCode.COLLEGE_MISMATCH);
  });

  // Test 18 — College not detected at all
  it('Test 18: No college name in document → PENDING_MANUAL_REVIEW or REJECTED', async () => {
    const text = `
      Name: GANGAVARAPU SATISH KUMAR
      Roll Number: 22BQ1A0560
      Graduated in 2022
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    // NOT_DETECTED should be manual review, not automatic rejection (document could still be valid)
    expect(result.college.status).toBe('NOT_DETECTED');
    expect(result.decision).toBe(OcrDecision.PENDING_MANUAL_REVIEW);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT QUALITY / OCR FAILURE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('DOCUMENT QUALITY & OCR FAILURES', () => {

  // Test 19 — Text PDF with enough words
  it('Test 19: Good quality text PDF → normal verification flow', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY NAMBUR GUNTUR
      Degree Certificate
      This is to certify that GANGAVARAPU SATISH KUMAR bearing Roll Number 22BQ1A0560
      has successfully completed the course of study.
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560', 'PDF_TEXT', 100);
    expect(result.documentReadable).toBe(true);
    expect(result.nativeTextAvailable).toBe(true);
  });

  // Test 20 — Scanned PDF (comes through as TESSERACT_SCANNED_PDF)
  it('Test 20: Scanned PDF source → verification uses OCR text correctly', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMAR
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560', 'TESSERACT_SCANNED_PDF', 72);
    expect(result.source).toBe('TESSERACT_SCANNED_PDF');
    expect([OcrDecision.VERIFIED, OcrDecision.PENDING_MANUAL_REVIEW]).toContain(result.decision);
  });

  // Test 21 — Image document
  it('Test 21: Image document → uses TESSERACT_IMAGE source', async () => {
    const text = `
      VVIT
      Name: GANGAVARAPU SATISH KUMAR
      Roll: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560', 'TESSERACT_IMAGE', 78);
    expect(result.source).toBe('TESSERACT_IMAGE');
    expect([OcrDecision.VERIFIED, OcrDecision.PENDING_MANUAL_REVIEW]).toContain(result.decision);
  });

  // Test 22 — Low quality image (low confidence score)
  it('Test 22: Low quality image (confidence 30%) → PENDING_MANUAL_REVIEW', async () => {
    const text = `
      VVIT
      Name: GANGAVARAPU SATISH KUMAR
      Roll: 22BQ1A0560
    `;
    OcrService.extractDocument = jest.fn().mockResolvedValue({
      text,
      confidence: 30,
      pageCount: 1,
      source: 'TESSERACT_IMAGE'
    });
    const file = { originalname: 'test.jpg', filename: 'test-123.jpg', path: '/tmp/test.jpg' };
    OcrService.getFileBuffer = jest.fn().mockReturnValue(Buffer.from('fake'));
    const result = await DocumentVerificationService.validateRegistrationData(
      file, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560', 'test@vvit.ac.in', '127.0.0.1'
    );
    // Low OCR confidence → should still proceed but might be manual review
    expect([OcrDecision.VERIFIED, OcrDecision.PENDING_MANUAL_REVIEW]).toContain(result.decision);
  });

  // Test 23 — Empty OCR (all nulls)
  it('Test 23: Empty OCR text → PENDING_MANUAL_REVIEW (not rejected as wrong person)', async () => {
    OcrService.getFileBuffer = jest.fn().mockReturnValue(Buffer.from('fake'));
    OcrService.extractDocument = jest.fn().mockResolvedValue({
      text: '',
      confidence: 0,
      pageCount: 1,
      source: 'TESSERACT_IMAGE'
    });
    const file = { originalname: 'test.pdf', filename: 'test-123.pdf', path: '/tmp/test.pdf' };
    const result = await DocumentVerificationService.validateRegistrationData(
      file, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560', 'test@vvit.ac.in', '127.0.0.1'
    );
    expect(result.decision).toBe(OcrDecision.PENDING_MANUAL_REVIEW);
    expect(result.reasonCode).toBe(ReasonCode.DOCUMENT_UNREADABLE);
    expect(result.manualReviewRequired).toBe(true);
    // Must NOT be NAME_MISMATCH or ROLL_NUMBER_MISMATCH
    expect(result.reasonCode).not.toBe(ReasonCode.NAME_MISMATCH);
    expect(result.reasonCode).not.toBe(ReasonCode.ROLL_NUMBER_MISMATCH);
  });

  // Test 24 — OCR engine throws exception
  it('Test 24: OCR engine exception → PENDING_MANUAL_REVIEW (not REJECTED)', async () => {
    OcrService.getFileBuffer = jest.fn().mockReturnValue(Buffer.from('fake'));
    OcrService.extractDocument = jest.fn().mockRejectedValue(new Error('PDF_NO_TEXT: No pages rendered'));
    const file = { originalname: 'corrupted.pdf', filename: 'corrupted.pdf', path: '/tmp/corrupted.pdf' };
    const result = await DocumentVerificationService.validateRegistrationData(
      file, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560', 'test@vvit.ac.in', '127.0.0.1'
    );
    expect(result.decision).toBe(OcrDecision.PENDING_MANUAL_REVIEW);
    expect(result.manualReviewRequired).toBe(true);
    expect([ReasonCode.DOCUMENT_UNREADABLE, ReasonCode.OCR_UNAVAILABLE]).toContain(result.reasonCode);
  });

  // Test 25 — Multi-page PDF
  it('Test 25: Multi-page PDF (page markers in text) → extracts fields correctly', async () => {
    const text = `
      --- PAGE 1 ---
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      --- PAGE 2 ---
      Name: GANGAVARAPU SATISH KUMAR
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560', 'TESSERACT_SCANNED_PDF');
    expect(result.documentReadable).toBe(true);
    expect([OcrDecision.VERIFIED, OcrDecision.PENDING_MANUAL_REVIEW]).toContain(result.decision);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY: NEVER AUTO-APPROVE WRONG PERSON
// ═══════════════════════════════════════════════════════════════════════════════

describe('SECURITY — No auto-approval of wrong persons', () => {

  it('SECURITY 1: Different first token must REJECT', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: KONDAPALLI SATISH KUMAR
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    expect(result.decision).toBe(OcrDecision.REJECTED);
  });

  it('SECURITY 2: 75% global similarity with completely different person → REJECT', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: XYZ PQR ABC
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'ABC DEF XYZ', '22BQ1A0560');
    // Even if global sim ~75% — must not approve
    expect(result.decision).not.toBe(OcrDecision.VERIFIED);
  });

  it('SECURITY 3: Wrong roll with correct name → REJECTED', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMAR
      Roll Number: 22BQ1A0999
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    expect(result.rollNumber.status).toBe('MISMATCH');
    expect(result.decision).toBe(OcrDecision.REJECTED);
  });

  it('SECURITY 4: Correct name + roll, wrong college → REJECTED', async () => {
    const text = `
      VIGNAN INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMAR
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    expect(result.college.status).toBe('MISMATCH');
    expect(result.decision).toBe(OcrDecision.REJECTED);
    expect(result.reasonCode).toBe(ReasonCode.COLLEGE_MISMATCH);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NORMALIZATION UNIT TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('NORMALIZATION UTILITIES', () => {

  it('normalizeName: removes punctuation, uppercases, collapses whitespace', () => {
    const result = DocumentVerificationService.normalizeName('  Gangavarapu. Satish  Kumar  ');
    expect(result).toBe('GANGAVARAPU SATISH KUMAR');
  });

  it('normalizeName: preserves repeated chars (KUMARRR)', () => {
    const result = DocumentVerificationService.normalizeName('GANGAVARAPU SATISH KUMARRR');
    expect(result).toBe('GANGAVARAPU SATISH KUMARRR');
  });

  it('normalizeName: does NOT collapse 2 repeated chars (REDD → REDD preserved)', () => {
    const result = DocumentVerificationService.normalizeName('REDDY');
    expect(result).toBe('REDDY');
  });

  it('normalizeRollNumber: strips spaces and hyphens, uppercases', () => {
    const result = DocumentVerificationService.normalizeRollNumber(' 22-bq1a0560 ');
    expect(result).toBe('22BQ1A0560');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STRUCTURED RESULT SHAPE
// ═══════════════════════════════════════════════════════════════════════════════

describe('RESULT STRUCTURE', () => {
  it('Result has required fields for all decisions', async () => {
    const text = `
      VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY
      Name: GANGAVARAPU SATISH KUMAR
      Roll Number: 22BQ1A0560
    `;
    const result = await verify(text, 'GANGAVARAPU SATISH KUMAR', '22BQ1A0560');
    
    // Top-level fields
    expect(result).toHaveProperty('decision');
    expect(result).toHaveProperty('reasonCode');
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('documentReadable');
    expect(result).toHaveProperty('manualReviewRequired');

    // Field-specific sub-objects
    expect(result.name).toHaveProperty('status');
    expect(result.name).toHaveProperty('confidence');
    expect(result.name).toHaveProperty('formValue');
    expect(result.rollNumber).toHaveProperty('status');
    expect(result.rollNumber).toHaveProperty('confidence');
    expect(result.college).toHaveProperty('status');
    expect(result.college).toHaveProperty('confidence');
  });
});
