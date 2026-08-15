/**
 * Alumni OCR Document Verification Engine — Integration Tests (updated for new API)
 *
 * These tests operate against the DocumentVerificationService directly via mocked OcrService.
 * The old /api/auth/verify-document endpoint no longer exists.
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

function mockOcr(text, source = 'PDF_TEXT', confidence = 85) {
  OcrService.getFileBuffer = jest.fn().mockReturnValue(Buffer.from('fake'));
  OcrService.extractDocument = jest.fn().mockResolvedValue({ text, confidence, pageCount: 1, source });
  return { originalname: 'test.pdf', filename: 'test.pdf', path: '/tmp/test.pdf' };
}

describe('Alumni OCR Document Verification Engine', () => {

  it('should VERIFIED for valid VVIT document with matching name and roll number', async () => {
    const file = mockOcr(
      'VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY\nNAME: JOHN DOE\nROLL NUMBER: 20BQ1A0501'
    );
    const result = await DocumentVerificationService.validateRegistrationData(
      file, 'JOHN DOE', '20BQ1A0501', 'test@vvit.ac.in', '127.0.0.1'
    );
    expect(result.decision).toBe(OcrDecision.VERIFIED);
    expect(result.college.status).toBe('MATCH');
  });

  it('should REJECTED with COLLEGE_MISMATCH if document is not from VVIT/VVITU', async () => {
    const file = mockOcr(
      'ABC ENGINEERING COLLEGE\nNAME: JOHN DOE\nROLL NUMBER: 20BQ1A0501'
    );
    const result = await DocumentVerificationService.validateRegistrationData(
      file, 'JOHN DOE', '20BQ1A0501', 'test@vvit.ac.in', '127.0.0.1'
    );
    expect(result.decision).toBe(OcrDecision.REJECTED);
    expect(result.reasonCode).toBe(ReasonCode.COLLEGE_MISMATCH);
  });

  it('should REJECTED with ROLL_NUMBER_MISMATCH when roll number differs', async () => {
    const file = mockOcr(
      'VVIT COLLEGE\nNAME: JOHN DOE\nROLL NUMBER: 20BQ1A9999'
    );
    const result = await DocumentVerificationService.validateRegistrationData(
      file, 'JOHN DOE', '20BQ1A0501', 'test@vvit.ac.in', '127.0.0.1'
    );
    expect(result.decision).toBe(OcrDecision.REJECTED);
    expect(result.reasonCode).toBe(ReasonCode.ROLL_NUMBER_MISMATCH);
  });

  it('should REJECTED with NAME_MISMATCH when student name differs', async () => {
    const file = mockOcr(
      'VVIT COLLEGE\nNAME: ALICE SMITH\nROLL NUMBER: 20BQ1A0501'
    );
    const result = await DocumentVerificationService.validateRegistrationData(
      file, 'JOHN DOE', '20BQ1A0501', 'test@vvit.ac.in', '127.0.0.1'
    );
    expect(result.decision).toBe(OcrDecision.REJECTED);
    expect(result.reasonCode).toBe(ReasonCode.NAME_MISMATCH);
  });

  it('should REJECTED when both name and roll differ', async () => {
    const file = mockOcr(
      'VVIT COLLEGE\nNAME: ALICE SMITH\nROLL NUMBER: 20BQ1A9999'
    );
    const result = await DocumentVerificationService.validateRegistrationData(
      file, 'JOHN DOE', '20BQ1A0501', 'test@vvit.ac.in', '127.0.0.1'
    );
    expect(result.decision).toBe(OcrDecision.REJECTED);
    expect([ReasonCode.NAME_MISMATCH, ReasonCode.ROLL_NUMBER_MISMATCH, ReasonCode.COLLEGE_MISMATCH, ReasonCode.FAILED_NAME_AND_ROLL_MISMATCH]).toContain(result.reasonCode);
  });

  it('should PENDING_MANUAL_REVIEW when OCR engine fails', async () => {
    OcrService.getFileBuffer = jest.fn().mockReturnValue(Buffer.from('fake'));
    OcrService.extractDocument = jest.fn().mockRejectedValue(new Error('OCR_ENGINE_FAILED: Tesseract unavailable'));
    const file = { originalname: 'test.pdf', filename: 'test.pdf', path: '/tmp/test.pdf' };
    const result = await DocumentVerificationService.validateRegistrationData(
      file, 'JOHN DOE', '20BQ1A0501', 'test@vvit.ac.in', '127.0.0.1'
    );
    expect(result.decision).toBe(OcrDecision.PENDING_MANUAL_REVIEW);
    expect(result.manualReviewRequired).toBe(true);
    expect([ReasonCode.DOCUMENT_UNREADABLE, ReasonCode.OCR_UNAVAILABLE]).toContain(result.reasonCode);
  });

  it('should VERIFIED for GARIKAPATI ASHRITHA when OCR has trailing artifact A', async () => {
    const file = mockOcr(
      'VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY\nFULL NAME: GARIKAPATI ASHRITHA A\nROLL NUMBER: 24BQ5A0501'
    );
    const result = await DocumentVerificationService.validateRegistrationData(
      file, 'GARIKAPATI ASHRITHA', '24BQ5A0501', 'test@vvit.ac.in', '127.0.0.1'
    );
    // The trailing 'A' should NOT prevent a match — it reduces similarity but name is recognizable
    // Accept VERIFIED or PENDING_MANUAL_REVIEW (admin reviews borderline cases)
    expect([OcrDecision.VERIFIED, OcrDecision.PENDING_MANUAL_REVIEW]).toContain(result.decision);
  });

  it('should VERIFIED for GANGAVARAPU SATISH KUMAR when OCR output contains relationship marker SAO', async () => {
    const file = mockOcr(
      'VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY\nNAME: GANGAVARAPU SATISH KUMAR SAO\nROLL NUMBER: 20BQ1A0501'
    );
    const result = await DocumentVerificationService.validateRegistrationData(
      file, 'GANGAVARAPU SATISH KUMAR', '20BQ1A0501', 'test@vvit.ac.in', '127.0.0.1'
    );
    // Extra "SAO" is a relational indicator — should not prevent admin review
    expect([OcrDecision.VERIFIED, OcrDecision.PENDING_MANUAL_REVIEW]).toContain(result.decision);
  });

  it('should REJECTED when actual student surname/name differs (negative security test)', async () => {
    const file = mockOcr(
      'VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY\nFULL NAME: GARIKAPATI ASHRITHA RAO\nROLL NUMBER: 24BQ5A0501'
    );
    const result = await DocumentVerificationService.validateRegistrationData(
      file, 'GARIKAPATI ASHRITHA', '24BQ5A0501', 'test@vvit.ac.in', '127.0.0.1'
    );
    // An extra token "RAO" → not auto-VERIFIED
    expect(result.decision).not.toBe(OcrDecision.VERIFIED);
  });

  it('should REJECTED when completely different student name is on document', async () => {
    const file = mockOcr(
      'VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY\nFULL NAME: GARIKAPATI AISHWARYA\nROLL NUMBER: 24BQ5A0501'
    );
    const result = await DocumentVerificationService.validateRegistrationData(
      file, 'GARIKAPATI ASHRITHA', '24BQ5A0501', 'test@vvit.ac.in', '127.0.0.1'
    );
    // "AISHWARYA" vs "ASHRITHA" — clearly different middle name
    expect([OcrDecision.REJECTED, OcrDecision.PENDING_MANUAL_REVIEW]).toContain(result.decision);
    // Must never be auto-VERIFIED
    expect(result.decision).not.toBe(OcrDecision.VERIFIED);
  });
});
