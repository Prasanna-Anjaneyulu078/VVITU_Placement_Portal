const request = require('supertest');
const app = require('../src/app');
const { DocumentVerificationService, OcrDecision } = require('../src/services/documentVerification.service');
const OcrService = require('../src/services/ocr.service');

describe('Alumni OCR Document Verification Engine', () => {
  it('should PASS verification for valid VVIT document with matching name and roll number', async () => {
    jest.spyOn(OcrService, 'extractText').mockResolvedValue(
      'VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY\nNAME: JOHN DOE\nROLL NUMBER: 218X1A0501'
    );

    const res = await request(app)
      .post('/api/auth/verify-document')
      .field('formName', 'JOHN DOE')
      .field('formRoll', '218X1A0501')
      .attach('document', Buffer.from('mock vvit cert'), 'vvit_cert.pdf');

    expect(res.statusCode).toEqual(200);
    expect(res.body.passed).toBe(true);
    expect(res.body.decision).toEqual(OcrDecision.PASSED);
    expect(res.body.detectedCollege).toEqual('VVIT');

    OcrService.extractText.mockRestore();
  });

  it('should REJECT document with FAILED_COLLEGE if document is not from VVIT/VVITU', async () => {
    jest.spyOn(OcrService, 'extractText').mockResolvedValue(
      'SOME OTHER COLLEGE OF ENGINEERING\nNAME: JOHN DOE\nROLL NUMBER: 218X1A0501'
    );

    const res = await request(app)
      .post('/api/auth/verify-document')
      .field('formName', 'JOHN DOE')
      .field('formRoll', '218X1A0501')
      .attach('document', Buffer.from('mock external cert'), 'other_cert.pdf');

    expect(res.statusCode).toEqual(400);
    expect(res.body.passed).toBe(false);
    expect(res.body.decision).toEqual(OcrDecision.FAILED_COLLEGE);

    OcrService.extractText.mockRestore();
  });

  it('should REJECT document with FAILED_ROLL_MISMATCH when roll number differs', async () => {
    jest.spyOn(OcrService, 'extractText').mockResolvedValue(
      'VVIT COLLEGE\nNAME: JOHN DOE\nROLL NUMBER: 218X1A9999'
    );

    const res = await request(app)
      .post('/api/auth/verify-document')
      .field('formName', 'JOHN DOE')
      .field('formRoll', '218X1A0501')
      .attach('document', Buffer.from('mock cert'), 'vvit_cert.pdf');

    expect(res.statusCode).toEqual(400);
    expect(res.body.passed).toBe(false);
    expect(res.body.decision).toEqual(OcrDecision.FAILED_ROLL_MISMATCH);

    OcrService.extractText.mockRestore();
  });

  it('should REJECT document with FAILED_NAME_MISMATCH when student name differs', async () => {
    jest.spyOn(OcrService, 'extractText').mockResolvedValue(
      'VVIT COLLEGE\nNAME: ALICE SMITH\nROLL NUMBER: 218X1A0501'
    );

    const res = await request(app)
      .post('/api/auth/verify-document')
      .field('formName', 'JOHN DOE')
      .field('formRoll', '218X1A0501')
      .attach('document', Buffer.from('mock cert'), 'vvit_cert.pdf');

    expect(res.statusCode).toEqual(400);
    expect(res.body.passed).toBe(false);
    expect(res.body.decision).toEqual(OcrDecision.FAILED_NAME_MISMATCH);

    OcrService.extractText.mockRestore();
  });

  it('should REJECT document with FAILED_BOTH_MISMATCH when both name and roll differ', async () => {
    jest.spyOn(OcrService, 'extractText').mockResolvedValue(
      'VVIT COLLEGE\nNAME: ALICE SMITH\nROLL NUMBER: 218X1A9999'
    );

    const res = await request(app)
      .post('/api/auth/verify-document')
      .field('formName', 'JOHN DOE')
      .field('formRoll', '218X1A0501')
      .attach('document', Buffer.from('mock cert'), 'vvit_cert.pdf');

    expect(res.statusCode).toEqual(400);
    expect(res.body.passed).toBe(false);
    expect(res.body.decision).toEqual(OcrDecision.FAILED_BOTH_MISMATCH);

    OcrService.extractText.mockRestore();
  });

  it('should handle OCR engine failure cleanly by marking OCR_UNAVAILABLE for manual admin review', async () => {
    jest.spyOn(OcrService, 'extractText').mockRejectedValue(new Error('Tesseract engine unavailable'));

    const res = await request(app)
      .post('/api/auth/verify-document')
      .field('formName', 'JOHN DOE')
      .field('formRoll', '218X1A0501')
      .attach('document', Buffer.from('mock cert'), 'vvit_cert.pdf');

    expect(res.statusCode).toEqual(200);
    expect(res.body.passed).toBe(true);
    expect(res.body.manualReviewRequired).toBe(true);
    expect(res.body.decision).toEqual(OcrDecision.OCR_UNAVAILABLE);

    OcrService.extractText.mockRestore();
  });

  it('should PASS verification for GARIKAPATI ASHRITHA when OCR output contains trailing section artifact A', async () => {
    jest.spyOn(OcrService, 'extractText').mockResolvedValue(
      'VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY\nFULL NAME: GARIKAPATI ASHRITHA A\nROLL NUMBER: 24BQ5A0501'
    );

    const res = await request(app)
      .post('/api/auth/verify-document')
      .field('formName', 'GARIKAPATI ASHRITHA')
      .field('formRoll', '24BQ5A0501')
      .attach('document', Buffer.from('mock cert'), 'vvit_cert.pdf');

    expect(res.statusCode).toEqual(200);
    expect(res.body.passed).toBe(true);
    expect(res.body.decision).toEqual(OcrDecision.PASSED);
    expect(res.body.extractedName).toEqual('GARIKAPATI ASHRITHA');

    OcrService.extractText.mockRestore();
  });

  it('should PASS verification for GANGAVARAPU SATISH KUMAR when OCR output contains relationship marker SAO', async () => {
    jest.spyOn(OcrService, 'extractText').mockResolvedValue(
      'VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY\nNAME: GANGAVARAPU SATISH KUMAR SAO\nROLL NUMBER: 20BQ1A0501'
    );

    const res = await request(app)
      .post('/api/auth/verify-document')
      .field('formName', 'GANGAVARAPU SATISH KUMAR')
      .field('formRoll', '20BQ1A0501')
      .attach('document', Buffer.from('mock cert'), 'vvit_cert.pdf');

    expect(res.statusCode).toEqual(200);
    expect(res.body.passed).toBe(true);
    expect(res.body.decision).toEqual(OcrDecision.PASSED);
    expect(res.body.extractedName).toEqual('GANGAVARAPU SATISH KUMAR');

    OcrService.extractText.mockRestore();
  });

  it('should REJECT verification when actual student surname/name differs (negative security test)', async () => {
    jest.spyOn(OcrService, 'extractText').mockResolvedValue(
      'VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY\nFULL NAME: GARIKAPATI ASHRITHA RAO\nROLL NUMBER: 24BQ5A0501'
    );

    const res = await request(app)
      .post('/api/auth/verify-document')
      .field('formName', 'GARIKAPATI ASHRITHA')
      .field('formRoll', '24BQ5A0501')
      .attach('document', Buffer.from('mock cert'), 'vvit_cert.pdf');

    expect(res.statusCode).toEqual(400);
    expect(res.body.passed).toBe(false);
    expect(res.body.decision).toEqual(OcrDecision.FAILED_NAME_MISMATCH);

    OcrService.extractText.mockRestore();
  });

  it('should REJECT verification when different student name is on document (negative security test)', async () => {
    jest.spyOn(OcrService, 'extractText').mockResolvedValue(
      'VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY\nFULL NAME: GARIKAPATI AISHWARYA\nROLL NUMBER: 24BQ5A0501'
    );

    const res = await request(app)
      .post('/api/auth/verify-document')
      .field('formName', 'GARIKAPATI ASHRITHA')
      .field('formRoll', '24BQ5A0501')
      .attach('document', Buffer.from('mock cert'), 'vvit_cert.pdf');

    expect(res.statusCode).toEqual(400);
    expect(res.body.passed).toBe(false);
    expect(res.body.decision).toEqual(OcrDecision.FAILED_NAME_MISMATCH);

    OcrService.extractText.mockRestore();
  });
});
