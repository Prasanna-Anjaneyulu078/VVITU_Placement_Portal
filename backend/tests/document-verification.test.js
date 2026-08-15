const { DocumentVerificationService, OcrDecision, ReasonCode } = require('../src/services/documentVerification.service');

describe('DocumentVerificationService — Decision Engine Unit Tests', () => {
  it('Test 1: Safe OCR variation in name (repeated characters) should yield VERIFIED', () => {
    const nameResult = { status: 'MATCH', confidence: 0.9, extractedValue: 'GANGAVARAPU SATISH KUMAR' };
    const rollResult = { status: 'MATCH', confidence: 1.0, extractedValue: '20BQ1A0501' };
    const collegeResult = { status: 'MATCH', confidence: 1.0, extractedValue: 'VVIT/VVITU' };

    const result = DocumentVerificationService.determineVerificationResult({
      formName: 'GANGAVARAPU SATISH KUMARRR',
      formRollNumber: '20BQ1A0501',
      formCollege: 'VVIT/VVITU',
      nameResult,
      rollResult,
      collegeResult,
      documentReadable: true,
      ocrPerformed: true,
      rawText: 'Vasireddy Venkatadri Institute of Technology GANGAVARAPU SATISH KUMAR 20BQ1A0501'
    });

    expect(result.decision).toBe(OcrDecision.VERIFIED);
    expect(result.reasonCode).toBe(ReasonCode.VERIFIED);
  });

  it('Test 2: Name Mismatch should yield FAILED_NAME_MISMATCH', () => {
    const nameResult = { status: 'MISMATCH', confidence: 0, extractedValue: 'GANGAVARAPU SATISH KUMAR' };
    const rollResult = { status: 'MATCH', confidence: 1.0, extractedValue: '20BQ1A0501' };
    const collegeResult = { status: 'MATCH', confidence: 1.0, extractedValue: 'VVIT/VVITU' };

    const result = DocumentVerificationService.determineVerificationResult({
      formName: 'PRASANNA ANJANEYULU',
      formRollNumber: '20BQ1A0501',
      formCollege: 'VVIT/VVITU',
      nameResult,
      rollResult,
      collegeResult,
      documentReadable: true,
      ocrPerformed: true,
      rawText: 'Vasireddy Venkatadri Institute of Technology GANGAVARAPU SATISH KUMAR 20BQ1A0501'
    });

    expect(result.decision).toBe(OcrDecision.REJECTED);
    expect(result.reasonCode).toBe(ReasonCode.FAILED_NAME_MISMATCH);
    expect(result.message).toContain('Name Verification Failed');
  });

  it('Test 3: Roll Number Mismatch should yield FAILED_ROLL_MISMATCH', () => {
    const nameResult = { status: 'MATCH', confidence: 1.0, extractedValue: 'GANGAVARAPU SATISH KUMAR' };
    const rollResult = { status: 'MISMATCH', confidence: 0, extractedValue: '20BQ1A0502' };
    const collegeResult = { status: 'MATCH', confidence: 1.0, extractedValue: 'VVIT/VVITU' };

    const result = DocumentVerificationService.determineVerificationResult({
      formName: 'GANGAVARAPU SATISH KUMAR',
      formRollNumber: '20BQ1A0501',
      formCollege: 'VVIT/VVITU',
      nameResult,
      rollResult,
      collegeResult,
      documentReadable: true,
      ocrPerformed: true,
      rawText: 'Vasireddy Venkatadri Institute of Technology GANGAVARAPU SATISH KUMAR 20BQ1A0502'
    });

    expect(result.decision).toBe(OcrDecision.REJECTED);
    expect(result.reasonCode).toBe(ReasonCode.FAILED_ROLL_MISMATCH);
    expect(result.message).toContain('Roll Number Verification Failed');
  });

  it('Test 4: College Mismatch should yield FAILED_COLLEGE_MISMATCH', () => {
    const nameResult = { status: 'MATCH', confidence: 1.0, extractedValue: 'GANGAVARAPU SATISH KUMAR' };
    const rollResult = { status: 'MATCH', confidence: 1.0, extractedValue: '20BQ1A0501' };
    const collegeResult = { status: 'MISMATCH', confidence: 0, extractedValue: 'ABC ENGINEERING' };

    const result = DocumentVerificationService.determineVerificationResult({
      formName: 'GANGAVARAPU SATISH KUMAR',
      formRollNumber: '20BQ1A0501',
      formCollege: 'VVIT/VVITU',
      nameResult,
      rollResult,
      collegeResult,
      documentReadable: true,
      ocrPerformed: true,
      rawText: 'ABC ENGINEERING COLLEGE GANGAVARAPU SATISH KUMAR 20BQ1A0501'
    });

    expect(result.decision).toBe(OcrDecision.REJECTED);
    expect(result.reasonCode).toBe(ReasonCode.FAILED_COLLEGE_MISMATCH);
    expect(result.message).toContain('College Verification Failed');
  });

  it('Test 5: Name + Roll Mismatch should yield FAILED_NAME_AND_ROLL_MISMATCH', () => {
    const nameResult = { status: 'MISMATCH', confidence: 0, extractedValue: 'OTHER NAME' };
    const rollResult = { status: 'MISMATCH', confidence: 0, extractedValue: '20BQ1A0999' };
    const collegeResult = { status: 'MATCH', confidence: 1.0, extractedValue: 'VVIT/VVITU' };

    const result = DocumentVerificationService.determineVerificationResult({
      formName: 'GANGAVARAPU SATISH KUMAR',
      formRollNumber: '20BQ1A0501',
      formCollege: 'VVIT/VVITU',
      nameResult,
      rollResult,
      collegeResult,
      documentReadable: true,
      ocrPerformed: true,
      rawText: 'Vasireddy Venkatadri Institute of Technology OTHER NAME 20BQ1A0999'
    });

    expect(result.decision).toBe(OcrDecision.REJECTED);
    expect(result.reasonCode).toBe(ReasonCode.FAILED_NAME_AND_ROLL_MISMATCH);
  });

  it('Test 6: All Three Mismatch should yield FAILED_NAME_ROLL_AND_COLLEGE_MISMATCH', () => {
    const nameResult = { status: 'MISMATCH', confidence: 0, extractedValue: 'WRONG NAME' };
    const rollResult = { status: 'MISMATCH', confidence: 0, extractedValue: '9999999999' };
    const collegeResult = { status: 'MISMATCH', confidence: 0, extractedValue: 'ABC ENGINEERING' };

    const result = DocumentVerificationService.determineVerificationResult({
      formName: 'GANGAVARAPU SATISH KUMAR',
      formRollNumber: '20BQ1A0501',
      formCollege: 'VVIT/VVITU',
      nameResult,
      rollResult,
      collegeResult,
      documentReadable: true,
      ocrPerformed: true,
      rawText: 'ABC ENGINEERING WRONG NAME 9999999999'
    });

    expect(result.decision).toBe(OcrDecision.REJECTED);
    expect(result.reasonCode).toBe(ReasonCode.FAILED_NAME_ROLL_AND_COLLEGE_MISMATCH);
  });

  it('Test 7: OCR Failure / Unreadable Document should yield PENDING_MANUAL_REVIEW & OCR_UNAVAILABLE', () => {
    const nameResult = { status: 'NOT_DETECTED', confidence: 0, extractedValue: null };
    const rollResult = { status: 'NOT_DETECTED', confidence: 0, extractedValue: null };
    const collegeResult = { status: 'NOT_DETECTED', confidence: 0, extractedValue: null };

    const result = DocumentVerificationService.determineVerificationResult({
      formName: 'GANGAVARAPU SATISH KUMAR',
      formRollNumber: '20BQ1A0501',
      formCollege: 'VVIT/VVITU',
      nameResult,
      rollResult,
      collegeResult,
      documentReadable: false,
      ocrPerformed: false,
      rawText: ''
    });

    expect(result.decision).toBe(OcrDecision.PENDING_MANUAL_REVIEW);
    expect(result.reasonCode).toBe(ReasonCode.OCR_UNAVAILABLE);
    expect(result.manualReviewRequired).toBe(true);
    expect(result.message).toContain('Document Verification Unavailable');
  });
});
