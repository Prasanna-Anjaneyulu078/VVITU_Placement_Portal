const OcrService = require('./ocr.service');
const prisma = require('../config/db');
const stringSimilarity = require('string-similarity');
const crypto = require('crypto');

const OcrDecision = {
  VERIFIED: 'VERIFIED',
  PENDING_MANUAL_REVIEW: 'PENDING_MANUAL_REVIEW',
  REJECTED: 'REJECTED'
};

const ReasonCode = {
  VERIFIED: 'VERIFIED',
  PENDING_MANUAL_REVIEW: 'PENDING_MANUAL_REVIEW',
  OCR_UNAVAILABLE: 'OCR_UNAVAILABLE',
  OCR_LOW_CONFIDENCE: 'OCR_LOW_CONFIDENCE',
  FAILED_NAME_MISMATCH: 'FAILED_NAME_MISMATCH',
  FAILED_ROLL_MISMATCH: 'FAILED_ROLL_MISMATCH',
  FAILED_COLLEGE_MISMATCH: 'FAILED_COLLEGE_MISMATCH',
  FAILED_NAME_AND_ROLL_MISMATCH: 'FAILED_NAME_AND_ROLL_MISMATCH',
  FAILED_NAME_AND_COLLEGE_MISMATCH: 'FAILED_NAME_AND_COLLEGE_MISMATCH',
  FAILED_ROLL_AND_COLLEGE_MISMATCH: 'FAILED_ROLL_AND_COLLEGE_MISMATCH',
  FAILED_NAME_ROLL_AND_COLLEGE_MISMATCH: 'FAILED_NAME_ROLL_AND_COLLEGE_MISMATCH',
  FAILED_DOCUMENT_INVALID: 'FAILED_DOCUMENT_INVALID',
  DUPLICATE_DOCUMENT: 'DUPLICATE_DOCUMENT',
  // Backwards compatibility aliases
  NAME_MISMATCH: 'FAILED_NAME_MISMATCH',
  ROLL_NUMBER_MISMATCH: 'FAILED_ROLL_MISMATCH',
  COLLEGE_MISMATCH: 'FAILED_COLLEGE_MISMATCH',
  INVALID_DOCUMENT: 'FAILED_DOCUMENT_INVALID'
};

class DocumentVerificationService {
  static getFileHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  static async validateRegistrationData(file, formName, formRoll, formEmail = null, ipAddress = '127.0.0.1') {
    const result = {
      decision: OcrDecision.REJECTED,
      reasonCode: ReasonCode.INVALID_DOCUMENT,
      message: 'Initial state.',
      
      name: {
        formValue: formName,
        extractedValue: null,
        normalizedFormValue: null,
        normalizedExtractedValue: null,
        status: 'NOT_DETECTED',
        confidence: 0
      },
      rollNumber: {
        formValue: formRoll,
        extractedValue: null,
        normalizedFormValue: null,
        normalizedExtractedValue: null,
        status: 'NOT_DETECTED',
        confidence: 0
      },
      college: {
        formValue: 'VVIT/VVITU',
        extractedValue: null,
        status: 'NOT_DETECTED',
        confidence: 0
      },
      
      documentReadable: false,
      manualReviewRequired: false,
      nativeTextAvailable: false,
      ocrPerformed: false,
      overallConfidence: 0,
      rawText: '',
      source: null
    };

    let fileBuffer;
    try {
      fileBuffer = OcrService.getFileBuffer(file);
    } catch (e) {
      result.reasonCode = ReasonCode.INVALID_DOCUMENT;
      result.message = 'The uploaded file could not be read.';
      return result;
    }

    // 1. Duplicate hash detection
    const documentHash = this.getFileHash(fileBuffer);
    const existingLog = await prisma.ocrAuditLog.findFirst({
      where: { documentHash }
    }).catch(() => null);

    if (existingLog && existingLog.isVerified) {
      result.decision = OcrDecision.REJECTED;
      result.reasonCode = ReasonCode.DUPLICATE_DOCUMENT;
      result.message = 'This document has already been used for a verified registration.';
      await this.saveAuditLog(result, file, formName, formRoll, formEmail, ipAddress, documentHash);
      return result;
    }

    // 2. OCR Extraction Pipeline
    let docResult;
    try {
      docResult = await OcrService.extractDocument(file);
      result.ocrPerformed = true;
      result.source = docResult.source;
      result.nativeTextAvailable = docResult.source === 'PDF_TEXT' || docResult.source === 'TEXT';
      result.rawText = docResult.text || '';
    } catch (err) {
      console.warn('[OCR] Extraction failed:', err.message);
      result.ocrPerformed = false;
      result.documentReadable = false;
      
      if (err.message.includes('PDF_NO_TEXT') || err.message.includes('OCR_FAILED')) {
        result.decision = OcrDecision.PENDING_MANUAL_REVIEW;
        result.reasonCode = ReasonCode.DOCUMENT_UNREADABLE;
        result.manualReviewRequired = true;
        result.message = 'We could not confidently read all information from the uploaded document. Your registration has been submitted for manual verification.';
      } else {
        result.decision = OcrDecision.PENDING_MANUAL_REVIEW;
        result.reasonCode = ReasonCode.OCR_UNAVAILABLE;
        result.manualReviewRequired = true;
        result.message = 'Document verification system is currently degraded. Registration submitted for manual verification.';
      }
      await this.saveAuditLog(result, file, formName, formRoll, formEmail, ipAddress, documentHash);
      return result;
    }

    if (!result.rawText || result.rawText.trim().length < 10) {
      result.decision = OcrDecision.PENDING_MANUAL_REVIEW;
      result.reasonCode = ReasonCode.DOCUMENT_UNREADABLE;
      result.manualReviewRequired = true;
      result.message = 'We could not confidently read all information from the uploaded document. Your registration has been submitted for manual verification.';
      await this.saveAuditLog(result, file, formName, formRoll, formEmail, ipAddress, documentHash);
      return result;
    }

    result.documentReadable = true;

    // 3. College Verification
    this.verifyCollege(result.rawText, result.college);

    // 4. Roll Number Verification
    this.verifyRollNumber(result.rawText, formRoll, result.rollNumber);

    // 5. Name Verification
    this.verifyName(result.rawText, formName, result.name);

    // 6. Central Decision Engine
    const decisionResult = this.determineVerificationResult({
      formName,
      formRollNumber: formRoll,
      formCollege: 'VVIT/VVITU',
      nameResult: result.name,
      rollResult: result.rollNumber,
      collegeResult: result.college,
      documentReadable: result.documentReadable,
      ocrPerformed: result.ocrPerformed,
      rawText: result.rawText
    });

    result.decision = decisionResult.decision;
    result.reasonCode = decisionResult.reasonCode;
    result.message = decisionResult.message;
    result.manualReviewRequired = decisionResult.manualReviewRequired;
    result.overallConfidence = (result.name.confidence + result.rollNumber.confidence + result.college.confidence) / 3;

    result.verification = {
      name: {
        status: result.name.status,
        confidence: Math.round(result.name.confidence * 100),
        formValue: formName,
        extractedValue: result.name.extractedValue || null
      },
      rollNumber: {
        status: result.rollNumber.status,
        confidence: Math.round(result.rollNumber.confidence * 100),
        formValue: formRoll,
        extractedValue: result.rollNumber.extractedValue || null
      },
      college: {
        status: result.college.status,
        confidence: Math.round(result.college.confidence * 100),
        formValue: 'VVIT/VVITU',
        extractedValue: result.college.extractedValue || null
      }
    };

    await this.saveAuditLog(result, file, formName, formRoll, formEmail, ipAddress, documentHash);
    return result;
  }

  // ==========================================
  // CENTRAL VERIFICATION DECISION ENGINE
  // ==========================================
  static determineVerificationResult({
    formName,
    formRollNumber,
    formCollege = 'VVIT/VVITU',
    nameResult,
    rollResult,
    collegeResult,
    documentReadable = true,
    ocrPerformed = true,
    rawText = ''
  }) {
    const fieldResults = {
      name: {
        status: nameResult.status || 'NOT_DETECTED',
        confidence: Math.round((nameResult.confidence || 0) * 100),
        formValue: formName,
        extractedValue: nameResult.extractedValue || null
      },
      rollNumber: {
        status: rollResult.status || 'NOT_DETECTED',
        confidence: Math.round((rollResult.confidence || 0) * 100),
        formValue: formRollNumber,
        extractedValue: rollResult.extractedValue || null
      },
      college: {
        status: collegeResult.status || 'NOT_DETECTED',
        confidence: Math.round((collegeResult.confidence || 0) * 100),
        formValue: formCollege,
        extractedValue: collegeResult.extractedValue || null
      }
    };

    // OCR Failure / Unreadable Document rule
    if (!ocrPerformed || !documentReadable || !rawText || rawText.trim().length < 10) {
      return {
        decision: OcrDecision.PENDING_MANUAL_REVIEW,
        reasonCode: ReasonCode.OCR_UNAVAILABLE,
        manualReviewRequired: true,
        fieldResults,
        message: 'Document Verification Unavailable: We could not reliably read the uploaded document. Your registration has been sent for manual verification. Please ensure that the uploaded document is clear and readable.'
      };
    }

    const isNameMatch = nameResult.status === 'MATCH';
    const isRollMatch = rollResult.status === 'MATCH';
    const isCollegeMatch = collegeResult.status === 'MATCH';

    const isNameMismatch = nameResult.status === 'MISMATCH';
    const isRollMismatch = rollResult.status === 'MISMATCH';
    const isCollegeMismatch = collegeResult.status === 'MISMATCH';

    // Case 1 — Everything matches
    if (isNameMatch && isRollMatch && isCollegeMatch) {
      return {
        decision: OcrDecision.VERIFIED,
        reasonCode: ReasonCode.VERIFIED,
        manualReviewRequired: false,
        fieldResults,
        message: 'Document verified successfully.'
      };
    }

    // Cases 3-9 — Field Mismatches
    if (isNameMismatch || isRollMismatch || isCollegeMismatch) {
      let decision = OcrDecision.REJECTED;
      let reasonCode = null;
      let message = null;

      if (isNameMismatch && isRollMismatch && isCollegeMismatch) {
        reasonCode = ReasonCode.FAILED_NAME_ROLL_AND_COLLEGE_MISMATCH;
        message = 'Document Verification Failed: The Roll Number, Name, and College details entered in the registration form could not be verified against the uploaded document. Please check your details and upload a valid VVIT/VVITU document.';
      } else if (isNameMismatch && isRollMismatch) {
        reasonCode = ReasonCode.FAILED_NAME_AND_ROLL_MISMATCH;
        message = 'Document Verification Failed: The Name and Roll Number entered in the registration form do not match the uploaded document. Please verify both details and try again.';
      } else if (isNameMismatch && isCollegeMismatch) {
        reasonCode = ReasonCode.FAILED_NAME_AND_COLLEGE_MISMATCH;
        message = 'Document Verification Failed: The Name does not match the uploaded document, and the document could not be verified as a VVIT/VVITU document. Please verify your name and upload a valid document.';
      } else if (isRollMismatch && isCollegeMismatch) {
        reasonCode = ReasonCode.FAILED_ROLL_AND_COLLEGE_MISMATCH;
        message = 'Document Verification Failed: The Roll Number does not match the uploaded document, and the document could not be verified as a VVIT/VVITU document. Please verify your Roll Number and upload a valid document.';
      } else if (isNameMismatch) {
        reasonCode = ReasonCode.FAILED_NAME_MISMATCH;
        message = 'Name Verification Failed: The name entered in the registration form does not sufficiently match the name found in the uploaded document. Please enter your full name exactly as shown on the official document.';
      } else if (isRollMismatch) {
        reasonCode = ReasonCode.FAILED_ROLL_MISMATCH;
        message = 'Roll Number Verification Failed: The Roll Number entered in the registration form does not match the Roll Number found in the uploaded document. Please enter the correct Roll Number exactly as shown on your document.';
      } else if (isCollegeMismatch) {
        reasonCode = ReasonCode.FAILED_COLLEGE_MISMATCH;
        message = 'College Verification Failed: The uploaded document could not be verified as an official VVIT/VVITU document. Please upload a valid document issued by VVIT/VVITU.';
      }

      return {
        decision,
        reasonCode,
        manualReviewRequired: false,
        fieldResults,
        message
      };
    }

    // Case 2 — Low Confidence / Partial Matches -> PENDING_MANUAL_REVIEW
    return {
      decision: OcrDecision.PENDING_MANUAL_REVIEW,
      reasonCode: ReasonCode.OCR_LOW_CONFIDENCE,
      manualReviewRequired: true,
      fieldResults,
      message: 'Document Verification Requires Review: We could not confidently verify the details from the uploaded document. Your registration has been submitted for manual review.'
    };
  }

  // ==========================================
  // COLLEGE VERIFICATION
  // ==========================================
  static verifyCollege(rawText, collegeResult) {
    const text = rawText.toUpperCase().replace(/\s+/g, ' ');
    const noSpaces = text.replace(/ /g, '');

    const validPatterns = [
      "VVIT UNIVERSITY",
      "VASIREDDY VENKATADRI INTERNATIONAL TECHNOLOGICAL UNIVERSITY",
      "VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY",
      "VASIREDDY VENKATADRI INSTITUTE",
      "VVIT GUNTUR",
      "VVITU"
    ];

    let matched = false;
    for (const pattern of validPatterns) {
      if (text.includes(pattern)) {
        matched = true;
        break;
      }
    }

    if (!matched && (noSpaces.includes("VVITUNIVERSITY") || noSpaces.includes("VASIREDDYVENKATADRIINSTITUTEOFTECHNOLOGY") || noSpaces.includes("VVIT"))) {
      matched = true;
    }

    if (matched) {
      collegeResult.extractedValue = 'VVIT/VVITU';
      collegeResult.status = 'MATCH';
      collegeResult.confidence = 1.0;
      return;
    }

    if (/.*V[V|]{1}[I1][T].*/.test(text) || text.includes("VVTT") || text.includes("VV1T") || text.includes("VVlT")) {
      collegeResult.extractedValue = 'VVIT (fuzzy)';
      collegeResult.status = 'POSSIBLE_MATCH';
      collegeResult.confidence = 0.7;
      return;
    }
    
    // Explicit wrong college rejection
    const wrongColleges = ["ABC ENGINEERING", "RVR", "KHIT", "GEC", "VIGNAN", "KL UNIVERSITY", "KLU", "BAPATLA"];
    for (const wrong of wrongColleges) {
      if (text.includes(wrong) && !text.includes("VVIT")) {
        collegeResult.extractedValue = wrong;
        collegeResult.status = 'MISMATCH';
        collegeResult.confidence = 0;
        return;
      }
    }

    collegeResult.status = 'NOT_DETECTED';
    collegeResult.confidence = 0;
  }

  // ==========================================
  // ROLL NUMBER VERIFICATION
  // ==========================================
  static normalizeRollNumber(roll) {
    if (!roll) return '';
    return roll.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  static verifyRollNumber(rawText, formRoll, rollResult) {
    rollResult.normalizedFormValue = this.normalizeRollNumber(formRoll);
    if (!rollResult.normalizedFormValue) {
      rollResult.status = 'NOT_DETECTED';
      return;
    }

    const lines = rawText.toUpperCase().split(/[\r\n]+/);
    let extractedCandidates = [];

    // Find any potential roll-number-like string
    for (const line of lines) {
      const match = line.replace(/[^A-Z0-9]/g, '').match(/([A-Z0-9]{2}BQ[A-Z0-9]{6}|[0-9]{2}[A-Z0-9]{8})/);
      if (match) {
        extractedCandidates.push(match[1]);
      }
    }

    // Fallback: tokenize everything looking for length 10 alphanumerics
    const allTokens = rawText.toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/);
    for (const token of allTokens) {
      if (token.length === 10) {
        extractedCandidates.push(token);
      }
    }

    if (extractedCandidates.length === 0) {
      rollResult.status = 'NOT_DETECTED';
      return;
    }

    const target = rollResult.normalizedFormValue;
    
    // Stage 1: Exact Match
    for (const candidate of extractedCandidates) {
      if (candidate === target) {
        rollResult.extractedValue = candidate;
        rollResult.normalizedExtractedValue = candidate;
        rollResult.status = 'MATCH';
        rollResult.confidence = 1.0;
        return;
      }
    }

    // Stage 2: OCR Confusion Resolution
    for (const candidate of extractedCandidates) {
      if (candidate.length === target.length) {
        let diffs = 0;
        let isControlledSubstitution = true;

        for (let i = 0; i < target.length; i++) {
          const cTarget = target[i];
          const cCand = candidate[i];
          
          if (cTarget !== cCand) {
            diffs++;
            // Check known OCR confusions
            const allowed = [
              ['O', '0'], ['0', 'O'],
              ['I', '1'], ['1', 'I'], ['L', '1'], ['1', 'L'],
              ['S', '5'], ['5', 'S'],
              ['B', '8'], ['8', 'B'],
              ['Z', '2'], ['2', 'Z']
            ];
            
            const isAllowed = allowed.some(pair => pair[0] === cTarget && pair[1] === cCand);
            if (!isAllowed) {
              isControlledSubstitution = false;
            }
          }
        }

        if (diffs > 0 && diffs <= 2 && isControlledSubstitution) {
          rollResult.extractedValue = candidate;
          rollResult.normalizedExtractedValue = target; // Normalized to intended
          rollResult.status = 'MATCH';
          rollResult.confidence = 0.9;
          return;
        }
      }
    }

    // Stage 3: Wrong Roll Detected
    // If we confidently extracted a roll number format but it doesn't match and isn't a simple typo
    for (const candidate of extractedCandidates) {
      if (/^[0-9]{2}BQ[A-Z0-9]{6}$/.test(candidate)) {
        rollResult.extractedValue = candidate;
        rollResult.normalizedExtractedValue = candidate;
        rollResult.status = 'MISMATCH';
        rollResult.confidence = 0;
        return;
      }
    }

    rollResult.status = 'MANUAL_REVIEW';
    rollResult.confidence = 0.5;
  }

  // ==========================================
  // NAME VERIFICATION
  // ==========================================
  static normalizeName(name) {
    if (!name) return '';
    let norm = name.toUpperCase()
      .replace(/[^A-Z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Do NOT collapse repeated characters here.
    return norm;
  }

  static classifyNameDifference(formName, ocrName) {
    // Stage 1: Exact match
    if (formName === ocrName) {
      return { match: true, status: 'MATCH', confidence: 1.0, reasonCode: 'NAME_EXACT_MATCH' };
    }

    // Stage 2: Match without spaces (OCR commonly drops spaces)
    if (formName.replace(/\s+/g, '') === ocrName.replace(/\s+/g, '')) {
      return { match: true, status: 'MATCH', confidence: 0.95, reasonCode: 'NAME_SPACING_DIFFERENCE' };
    }

    const globalSim = stringSimilarity.compareTwoStrings(formName, ocrName);
    if (globalSim < 0.5) {
      return { match: false, status: 'MISMATCH', confidence: 0, reasonCode: 'NAME_DIFFERENT' };
    }

    const formTokens = formName.split(' ');
    const ocrTokens = ocrName.split(' ');

    // Analyze tokens
    if (formTokens.length > ocrTokens.length) {
      return { match: false, status: 'MISMATCH', confidence: 0.5, reasonCode: 'NAME_FORM_EXTRA_TOKEN' };
    }

    if (formTokens.length < ocrTokens.length) {
      return { match: false, status: 'MANUAL_REVIEW', confidence: 0.7, reasonCode: 'NAME_FORM_MISSING_TOKEN' };
    }

    // Token lengths are equal. Check token by token.
    let formExtraChars = false;
    let ocrLikelyError = false;
    let minorTypo = false;
    let completelyDifferent = false;

    for (let i = 0; i < formTokens.length; i++) {
      const ft = formTokens[i];
      const ot = ocrTokens[i];
      
      if (ft === ot) continue;

      const similarity = stringSimilarity.compareTwoStrings(ft, ot);
      if (similarity < 0.6) {
        completelyDifferent = true;
        break;
      }

      if (ft.length > ot.length && ft.startsWith(ot) && /^[A-Z]$/.test(ft.replace(ot, '')[0])) {
        const rest = ft.substring(ot.length);
        if (rest.split('').every(c => c === rest[0])) {
          formExtraChars = true; // e.g., KUMARRR vs KUMAR
        } else {
          minorTypo = true;
        }
      } else if (ot.length > ft.length && ot.startsWith(ft) && /^[A-Z]$/.test(ot.replace(ft, '')[0])) {
        const rest = ot.substring(ft.length);
        if (rest.split('').every(c => c === rest[0])) {
          ocrLikelyError = true; // e.g., KUMAR vs KUMARRR
        } else {
          minorTypo = true;
        }
      } else {
        minorTypo = true;
      }
    }

    if (completelyDifferent) {
      return { match: false, status: 'MISMATCH', confidence: 0, reasonCode: 'NAME_DIFFERENT' };
    }

    if (formExtraChars) {
      return { match: false, status: 'MISMATCH', confidence: 0.6, reasonCode: 'NAME_FORM_EXTRA_CHARACTERS' };
    }

    if (minorTypo) {
      return { match: false, status: 'MANUAL_REVIEW', confidence: 0.8, reasonCode: 'NAME_FORM_TYPO' };
    }

    if (ocrLikelyError) {
      return { match: false, status: 'MANUAL_REVIEW', confidence: 0.9, reasonCode: 'NAME_LIKELY_OCR_ERROR' };
    }

    return { match: false, status: 'MISMATCH', confidence: 0, reasonCode: 'NAME_LOW_CONFIDENCE' };
  }

  static verifyName(rawText, formName, nameResult) {
    nameResult.normalizedFormValue = this.normalizeName(formName);
    if (!nameResult.normalizedFormValue) {
      nameResult.status = 'NOT_DETECTED';
      return;
    }

    const lines = rawText.toUpperCase().split(/[\r\n]+/);
    const candidates = [];

    // Gather potential names
    const nameLabels = /(?:NAME\s*OF\s*THE\s*(?:STUDENT|CANDIDATE)|STUDENT\s*NAME|CANDIDATE\s*NAME|ALUMNI\s*NAME|NAME)\s*[:\-]?\s*(.+)/i;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const match = line.match(nameLabels);
      if (match) {
        let cleaned = match[1].replace(/[^A-Z\s]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleaned.length > 3) candidates.push(cleaned);
      } else if (/^(?:NAME\s*OF\s*THE\s*(?:STUDENT|CANDIDATE)|STUDENT\s*NAME|CANDIDATE\s*NAME|ALUMNI\s*NAME|NAME)\s*[:\-]?$/i.test(line)) {
        if (lines[i+1]) {
          let cleaned = lines[i+1].replace(/[^A-Z\s]/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleaned.length > 3) candidates.push(cleaned);
        }
      } else {
        let cleaned = line.replace(/[^A-Z\s]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleaned.length > 3) candidates.push(cleaned);
      }
    }

    if (candidates.length === 0) {
      nameResult.status = 'NOT_DETECTED';
      return;
    }

    const formNorm = nameResult.normalizedFormValue;
    let bestCandidate = null;
    let bestMatchResult = null;

    // Prioritize MATCH, then MANUAL_REVIEW, then MISMATCH
    const priority = { 'MATCH': 3, 'MANUAL_REVIEW': 2, 'MISMATCH': 1, 'NOT_DETECTED': 0 };

    for (const cand of candidates) {
      const candNorm = this.normalizeName(cand);
      const matchResult = this.classifyNameDifference(formNorm, candNorm);
      
      if (!bestMatchResult || priority[matchResult.status] > priority[bestMatchResult.status] || 
         (priority[matchResult.status] === priority[bestMatchResult.status] && matchResult.confidence > bestMatchResult.confidence)) {
        bestMatchResult = matchResult;
        bestCandidate = candNorm;
      }
    }

    if (!bestMatchResult) {
      bestMatchResult = { status: 'NOT_DETECTED', confidence: 0 };
    }

    if (bestMatchResult.status === 'NOT_DETECTED' && bestCandidate) {
      const candidateWords = bestCandidate.trim().split(/\s+/).length;
      if (candidateWords >= 2) {
        bestMatchResult.status = 'MISMATCH';
      }
    }

    nameResult.extractedValue = bestCandidate;
    nameResult.normalizedExtractedValue = bestCandidate;
    nameResult.status = bestMatchResult.status;
    nameResult.confidence = bestMatchResult.confidence || 0;
    nameResult.reasonCode = bestMatchResult.reasonCode || 'NAME_NOT_DETECTED';
  }

  static async saveAuditLog(result, file, formName, formRoll, formEmail, ipAddress, documentHash) {
    try {
      const fileName = file ? (file.originalname || file.filename || 'unknown') : 'unknown';
      let extractedText = result.rawText || '';
      if (extractedText.length > 5000) extractedText = extractedText.substring(0, 5000) + '...';
      
      await prisma.ocrAuditLog.create({
        data: {
          fileName: fileName,
          formName: formName || null,
          formEmail: formEmail || null,
          formRollNumber: formRoll || null,
          matchedStatus: result.decision || 'UNKNOWN',
          extractedText: extractedText,
          extractedName: result.name.extractedValue || null,
          extractedIdentifier: result.rollNumber.extractedValue || null,
          detectedCollege: result.college.extractedValue || null,
          confidenceScore: result.overallConfidence || 0,
          isVerified: result.decision === OcrDecision.VERIFIED,
          manualReviewRequired: result.manualReviewRequired || false,
          rejectionReason: result.message || null,
          ipAddress: ipAddress || null,
          documentHash: documentHash || null
        }
      });
    } catch (e) {
      console.warn('[OCR Audit Log] Failed to save OcrAuditLog:', e.message);
    }
  }
}

module.exports = {
  DocumentVerificationService,
  OcrDecision,
  ReasonCode
};
