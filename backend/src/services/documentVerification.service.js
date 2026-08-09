const OcrService = require('./ocr.service');
const prisma = require('../config/db');

const OcrDecision = {
  PASSED: 'PASSED',
  FAILED_COLLEGE: 'FAILED_COLLEGE',
  FAILED_ROLL_MISMATCH: 'FAILED_ROLL_MISMATCH',
  FAILED_NAME_MISMATCH: 'FAILED_NAME_MISMATCH',
  FAILED_BOTH_MISMATCH: 'FAILED_BOTH_MISMATCH',
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',
  OCR_UNAVAILABLE: 'OCR_UNAVAILABLE'
};

class DocumentVerificationService {
  /**
   * Validates alumni registration document against formName and formRoll.
   */
  static async validateRegistrationData(file, formName, formRoll, ipAddress = '127.0.0.1') {
    const result = {
      ocrAvailable: true,
      passed: false,
      decision: OcrDecision.FAILED_COLLEGE,
      manualReviewRequired: false,
      confidenceScore: 0.0,
      detectedCollege: null,
      extractedRollNumber: null,
      extractedName: null,
      rawText: '',
      message: ''
    };

    let ocrData = null;
    let rawText = '';
    try {
      rawText = await OcrService.extractText(file);
      if (OcrService.extractOcrData) {
        try {
          ocrData = await OcrService.extractOcrData(file);
        } catch (e) {
          ocrData = { text: rawText };
        }
      } else {
        ocrData = { text: rawText };
      }
      if (!ocrData || !ocrData.text) {
        ocrData = { text: rawText };
      }
    } catch (err) {
      result.ocrAvailable = false;
      result.decision = OcrDecision.OCR_UNAVAILABLE;
      result.manualReviewRequired = true;
      result.passed = true; // Fallback to manual admin review instead of hard reject
      result.message = 'OCR not available – document accepted for manual review.';
      await this.saveAuditLog({ formName, formRoll, isVerified: false, decision: result.decision, ipAddress });
      return result;
    }

    result.rawText = rawText;

    // Step 1: College Affiliation Check (HARD REJECT if non-VVIT/VVITU)
    const detectedCollege = this.verifyCollegeName(rawText);
    if (detectedCollege) {
      result.detectedCollege = detectedCollege;
    } else {
      result.detectedCollege = 'Not detected';
      result.decision = OcrDecision.FAILED_COLLEGE;
      result.passed = false;
      result.message =
        'Registration Restricted\n\n' +
        'Only alumni of VVIT (Vasireddy Venkatadri Institute of Technology) or ' +
        'VVIT University (Vasireddy Venkatadri International Technological University) ' +
        'are eligible to register on this platform.\n\n' +
        'The uploaded document could not be verified as a VVIT/VVITU-issued document.';
      await this.saveAuditLog({ formName, formRoll, isVerified: false, decision: result.decision, ipAddress });
      return result;
    }

    // Step 2: Roll Number Match
    const extractedRoll = this.extractRollNumber(rawText, formRoll);
    const cleanFormRoll = (formRoll || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    let rollMatched = false;
    let rollConfidence = 0.0;

    if (extractedRoll) {
      const cleanExtractedRoll = extractedRoll.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (cleanExtractedRoll === cleanFormRoll) {
        rollMatched = true;
        rollConfidence = 1.0;
      } else if (this.isSimilarRollNumber(cleanExtractedRoll, cleanFormRoll)) {
        rollMatched = true;
        rollConfidence = 0.8;
      }
    } else {
      const cleanRaw = rawText.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleanFormRoll.length >= 8 && cleanRaw.includes(cleanFormRoll)) {
        rollMatched = true;
        rollConfidence = 0.6;
      }
    }

    if (rollMatched) {
      result.extractedRollNumber = formRoll.trim();
    }

    // Step 3: Structured Full Name Candidate Extraction
    const nameCandidate = this.extractFullNameFromOCR(ocrData, formName);
    const extractedName = (nameCandidate && nameCandidate.name) ? nameCandidate.name : this.extractName(rawText, formName);
    const normalizedFormName = this.normalizeName(formName);
    const normalizedExtractedName = this.normalizeName(extractedName);
    let nameMatched = false;
    let nameConfidence = (nameCandidate && nameCandidate.confidence) ? nameCandidate.confidence : 0.0;

    if (normalizedExtractedName && normalizedFormName === normalizedExtractedName) {
      nameMatched = true;
      nameConfidence = 1.0;
      result.extractedName = normalizedExtractedName;
    } else {
      result.extractedName = normalizedExtractedName || 'Not detected';
    }

    // Evaluate Mismatch Outcomes
    if (!nameMatched && !rollMatched) {
      result.decision = OcrDecision.FAILED_BOTH_MISMATCH;
      result.passed = false;
      result.message =
        'Document Verification Failed\n\n' +
        'The uploaded document does not match the Name and Roll Number entered in the registration form.\n\n' +
        `Entered Name:\n${normalizedFormName}\n\n` +
        `Detected Name:\n${result.extractedName}`;
      await this.saveAuditLog({ formName, extractedName: result.extractedName, formRoll, extractedRoll: result.extractedRollNumber, collegeDetected: result.detectedCollege, isVerified: false, decision: result.decision, ipAddress });
      return result;
    } else if (!rollMatched) {
      result.decision = OcrDecision.FAILED_ROLL_MISMATCH;
      result.passed = false;
      result.message =
        'Roll Number Verification Failed\n\n' +
        'The Roll Number entered in the registration form does not match the Roll Number or Hall Ticket detected in the document.';
      await this.saveAuditLog({ formName, extractedName: result.extractedName, formRoll, extractedRoll: result.extractedRollNumber, collegeDetected: result.detectedCollege, isVerified: false, decision: result.decision, ipAddress });
      return result;
    } else if (!nameMatched) {
      result.decision = OcrDecision.FAILED_NAME_MISMATCH;
      result.passed = false;
      result.message =
        'Name Verification Failed\n\n' +
        'The Full Name entered in the registration form does not exactly match the Full Name detected in the uploaded VVIT/VVITU document.\n\n' +
        `Entered Name:\n${normalizedFormName}\n\n` +
        `Detected Name:\n${result.extractedName}`;
      await this.saveAuditLog({ formName, extractedName: result.extractedName, formRoll, extractedRoll: result.extractedRollNumber, collegeDetected: result.detectedCollege, isVerified: false, decision: result.decision, ipAddress });
      return result;
    }

    // Overall Confidence Evaluation
    const collegeConfidence = 1.0;
    const avgConfidence = (nameConfidence + rollConfidence + collegeConfidence) / 3.0;
    result.confidenceScore = avgConfidence;

    if (avgConfidence < 0.5) {
      result.decision = OcrDecision.LOW_CONFIDENCE;
      result.manualReviewRequired = true;
      result.passed = true;
      result.message = 'OCR confidence too low for automatic verification. Flagged for manual admin review.';
      await this.saveAuditLog({ formName, extractedName: result.extractedName, formRoll, extractedRoll: result.extractedRollNumber, collegeDetected: result.detectedCollege, isVerified: false, decision: result.decision, ipAddress });
      return result;
    }

    result.decision = OcrDecision.PASSED;
    result.passed = true;
    result.manualReviewRequired = false;
    result.message = 'Document verified successfully.';

    await this.saveAuditLog({ formName, extractedName: result.extractedName, formRoll, extractedRoll: result.extractedRollNumber, collegeDetected: result.detectedCollege, isVerified: true, decision: result.decision, ipAddress });

    return result;
  }

  static extractFullNameFromOCR(ocrData, formName) {
    if (!ocrData) return { name: null, confidence: 0, source: 'none', words: [] };

    const rawText = typeof ocrData === 'string' ? ocrData : (ocrData.text || '');
    const lines = ocrData.lines && ocrData.lines.length > 0
      ? ocrData.lines
      : rawText.split(/[\r\n]+/).map(l => ({ text: l, confidence: 100, words: [] }));

    const labelRegex = /(?:NAME\s*OF\s*THE\s*(?:STUDENT|CANDIDATE)|STUDENT\s*NAME|CANDIDATE\s*NAME|ALUMNI\s*NAME|FULL\s*NAME|NAME)\s*[:\-]?\s*(.+)/i;
    const standaloneLabelRegex = /^(?:NAME\s*OF\s*THE\s*(?:STUDENT|CANDIDATE)|STUDENT\s*NAME|CANDIDATE\s*NAME|ALUMNI\s*NAME|FULL\s*NAME|NAME)\s*[:\-]?$/i;
    const nextFieldLabelRegex = /^(?:ROLL|REGISTRATION|REG\s*NO|DOB|DATE\s*OF\s*BIRTH|GENDER|DEPARTMENT|BRANCH|COURSE|PROGRAM|COLLEGE|UNIVERSITY|EMAIL|MOBILE|PHONE|ADDRESS)\b/i;

    // Strategy 1: Explicit Label on line (e.g. FULL NAME: GARIKAPATI ASHRITHA A)
    for (let i = 0; i < lines.length; i++) {
      const lineObj = lines[i];
      const lineText = lineObj.text.trim();
      const m = lineText.match(labelRegex);
      if (m && m[1]) {
        let rawCandidate = m[1];
        if (i + 1 < lines.length) {
          const nextLineText = lines[i + 1].text.trim();
          if (nextLineText && !nextFieldLabelRegex.test(nextLineText) && !standaloneLabelRegex.test(nextLineText)) {
            const cleanedNext = this.cleanCandidateName(nextLineText);
            if (cleanedNext && !this.isBlacklisted(this.normalizeName(cleanedNext))) {
              rawCandidate += ' ' + nextLineText;
            }
          }
        }
        const cleaned = this.cleanCandidateName(rawCandidate);
        if (cleaned.length > 2 && !this.isBlacklisted(this.normalizeName(cleaned))) {
          const words = cleaned.split(' ');
          const conf = lineObj.confidence || 95;
          return {
            name: cleaned,
            confidence: conf / 100,
            source: 'full-name-field-label',
            words: words
          };
        }
      }
    }

    // Strategy 2: Standalone label line followed by value line
    for (let i = 0; i < lines.length - 1; i++) {
      const lineText = lines[i].text.trim();
      if (standaloneLabelRegex.test(lineText)) {
        const nextLineObj = lines[i + 1];
        let rawCandidate = nextLineObj.text.trim();
        if (i + 2 < lines.length) {
          const secondNextText = lines[i + 2].text.trim();
          if (secondNextText && !nextFieldLabelRegex.test(secondNextText) && !standaloneLabelRegex.test(secondNextText)) {
            const cleanedNext = this.cleanCandidateName(secondNextText);
            if (cleanedNext && !this.isBlacklisted(this.normalizeName(cleanedNext))) {
              rawCandidate += ' ' + secondNextText;
            }
          }
        }
        const cleaned = this.cleanCandidateName(rawCandidate);
        if (cleaned.length > 2 && !this.isBlacklisted(this.normalizeName(cleaned))) {
          const words = cleaned.split(' ');
          const conf = nextLineObj.confidence || 95;
          return {
            name: cleaned,
            confidence: conf / 100,
            source: 'full-name-standalone-label',
            words: words
          };
        }
      }
    }

    // Strategy 3: Form name token overlap matching
    if (formName && formName.trim()) {
      const normForm = this.normalizeName(formName);
      const formTokens = normForm.split(' ');

      for (const lineObj of lines) {
        const lineText = lineObj.text.trim();
        const cleanedLine = this.cleanCandidateName(lineText);
        const normLine = this.normalizeName(cleanedLine);
        if (!normLine) continue;

        if (normLine === normForm) {
          return {
            name: cleanedLine,
            confidence: (lineObj.confidence || 95) / 100,
            source: 'form-name-token-exact',
            words: cleanedLine.split(' ')
          };
        }

        let tokenCount = 0;
        for (const token of formTokens) {
          if (token.length > 1 && normLine.includes(token)) {
            tokenCount++;
          }
        }
        if (tokenCount > 0 && tokenCount >= Math.floor(formTokens.length / 2) + 1) {
          return {
            name: cleanedLine,
            confidence: (lineObj.confidence || 90) / 100,
            source: 'form-name-token-overlap',
            words: cleanedLine.split(' ')
          };
        }
      }
    }

    return { name: null, confidence: 0, source: 'none', words: [] };
  }

  static verifyCollegeName(rawText) {
    if (!rawText) return null;
    const normalized = rawText.toUpperCase().replace(/[^A-Z\s]/g, '').replace(/\s+/g, ' ').trim();
    const noSpaces = normalized.replace(/ /g, '');

    if (
      normalized.includes('VVIT UNIVERSITY') ||
      normalized.includes('VASIREDDY VENKATADRI INTERNATIONAL TECHNOLOGICAL UNIVERSITY') ||
      noSpaces.includes('VVITUNIVERSITY') ||
      normalized.includes('VVITU')
    ) {
      return 'VVIT University';
    }

    if (
      normalized.includes('VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY') ||
      normalized.includes('VVIT GUNTUR') ||
      noSpaces.includes('VASIREDDYVENKATADRIINSTITUTEOFTECHNOLOGY') ||
      normalized.includes('VASIREDDY VENKATADRI') ||
      normalized.includes('VVIT') ||
      noSpaces.includes('VVIT')
    ) {
      return 'VVIT';
    }

    const rawUpper = rawText.toUpperCase();
    if (
      rawUpper.includes('VVTT') ||
      rawUpper.includes('VV1T') ||
      rawUpper.includes('VVL T') ||
      rawUpper.includes('VITNET')
    ) {
      return 'VVIT (fuzzy match)';
    }

    if (normalized.includes('NAMBUR') && (normalized.includes('GUNTUR') || normalized.includes('AP'))) {
      return 'VVIT (location match)';
    }

    return null;
  }

  static extractRollNumber(rawText, formRoll) {
    if (!rawText) return null;
    const lines = rawText.toUpperCase().split(/[\r\n]+/);

    for (const line of lines) {
      const normalized = line.replace(/[^A-Z0-9]/g, '');
      const match = normalized.match(/([A-Z0-9]{2}BQ[A-Z0-9]{6}|[0-9]{2}[A-Z0-9]{8})/);
      if (match) {
        return match[1];
      }
    }

    const fullNormalized = rawText.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const bqMatch = fullNormalized.match(/([A-Z0-9]{2}BQ[A-Z0-9]{6})/);
    if (bqMatch) {
      return bqMatch[1];
    }

    return null;
  }

  static cleanCandidateName(text) {
    if (!text) return '';
    let candidate = text.trim();

    // 1. Truncate at explicit relationship markers, father/mother name labels, and next field labels
    const delimiterRegex = /\b(?:S[\/\.]?O\.?|SAO|S\s+O|SON\s+OF|D[\/\.]?O\.?|DAUGHTER\s+OF|W[\/\.]?O\.?|WIFE\s+OF|C[\/\.]?O\.?|CARE\s+OF|FATHER(?:'S)?|MOTHER(?:'S)?|ROLL|REGD?|HALL\s+TICKET|HT\s+NO|DOB|BRANCH|DEPT|DEPARTMENT|COLLEGE|UNIVERSITY|GENDER)\b.*/i;
    const match = candidate.match(delimiterRegex);
    if (match) {
      candidate = candidate.substring(0, match.index).trim();
    }

    // 2. Clean non-alpha characters except dots and spaces
    candidate = candidate.replace(/[^A-Za-z\s\.]/g, ' ').replace(/\s+/g, ' ').trim();

    // 3. Strip trailing isolated single-letter artifact (e.g., " A", " B") at the end of a multi-word name (2+ words)
    const words = candidate.split(' ');
    if (words.length > 2 && words[words.length - 1].length === 1 && !words[words.length - 1].includes('.')) {
      words.pop();
      candidate = words.join(' ');
    }

    return candidate;
  }

  static isBlacklisted(token) {
    const BLACKLIST = [
      'VASIREREDDY', 'VENKATADRI', 'INSTITUTE', 'TECHNOLOGY', 'VVIT', 'COLLEGE', 'ENGINEERING',
      'STUDENT', 'IDENTITY', 'CARD', 'BLOOD', 'GROUP', 'DOB', 'COURSE', 'BTECH', 'MTECH',
      'PRINCIPAL', 'SIGNATURE', 'VALID', 'UPTO', 'DEGREE', 'PROVISIONAL', 'CERTIFICATE',
      'MARKS', 'MEMO', 'CONSOLIDATED', 'HALL', 'TICKET', 'NUMBER', 'GUNTUR', 'NAMBUR',
      'ANDHRA', 'PRADESH', 'INDIA', 'UNIVERSITY', 'JNTUK', 'KAKINADA', 'AFFILIATED',
      'AUTONOMOUS', 'ACADEMIC', 'YEAR', 'FATHER', 'MOTHER', 'NAME', 'BRANCH', 'PROGRAMME',
      'EXAMINATION', 'SEMESTER', 'CGPA', 'SGPA', 'GRADE', 'POINTS', 'CREDITS', 'SUBJECT',
      'DATE', 'TIME', 'MALE', 'FEMALE', 'GENDER', 'DIRECTOR', 'CHAIRMAN', 'COORDINATOR',
      'REGISTRAR', 'VICE', 'CHANCELLOR', 'CONTROLLER', 'EXAMINATIONS', 'AUTHORITY', 'ISSUED'
    ];
    return BLACKLIST.includes(token);
  }

  static extractName(rawText, formName) {
    if (!rawText) return null;
    const lines = rawText.split(/[\r\n]+/);

    // Strategy 1: Explicit NAME label matching
    const labelRegex = /(?:NAME\s*OF\s*THE\s*(?:STUDENT|CANDIDATE)|STUDENT\s*NAME|CANDIDATE\s*NAME|ALUMNI\s*NAME|FULL\s*NAME|NAME)\s*[:\-]?\s*(.+)/i;
    for (const line of lines) {
      const m = line.trim().match(labelRegex);
      if (m && m[1]) {
        const candidate = this.cleanCandidateName(m[1]);
        if (candidate.length > 2 && !this.isBlacklisted(this.normalizeName(candidate))) {
          return candidate;
        }
      }
    }

    // Strategy 2: Label on single line, next line is value
    for (let i = 0; i < lines.length - 1; i++) {
      const trimmed = lines[i].trim();
      if (/^(?:NAME\s*OF\s*THE\s*(?:STUDENT|CANDIDATE)|STUDENT\s*NAME|CANDIDATE\s*NAME|ALUMNI\s*NAME|FULL\s*NAME|NAME)\s*[:\-]?$/i.test(trimmed)) {
        const candidate = this.cleanCandidateName(lines[i + 1]);
        if (candidate.length > 2 && !this.isBlacklisted(this.normalizeName(candidate))) {
          return candidate;
        }
      }
    }

    // Strategy 3: Token overlap with formName or line matching
    if (formName && formName.trim()) {
      const normForm = this.normalizeName(formName);
      const formTokens = normForm.split(' ');

      for (const line of lines) {
        const cleanedLine = this.cleanCandidateName(line);
        const normLine = this.normalizeName(cleanedLine);
        if (!normLine) continue;

        if (normLine === normForm) {
          return cleanedLine;
        }

        let tokenCount = 0;
        for (const token of formTokens) {
          if (token.length > 1 && normLine.includes(token)) {
            tokenCount++;
          }
        }
        if (tokenCount > 0 && tokenCount >= Math.floor(formTokens.length / 2) + 1) {
          return cleanedLine;
        }
      }
    }

    return null;
  }

  static normalizeName(name) {
    if (!name) return '';
    return name.trim().replace(/\s+/g, ' ').toUpperCase();
  }

  static isSimilarRollNumber(s1, s2) {
    if (!s1 || !s2 || s1.length !== s2.length) return false;
    let diff = 0;
    for (let i = 0; i < s1.length; i++) {
      if (s1[i].toUpperCase() !== s2[i].toUpperCase()) {
        diff++;
      }
    }
    return diff <= 2;
  }

  static async saveAuditLog(logData) {
    try {
      await prisma.auditLog.create({
        data: {
          action: 'OCR_DOCUMENT_VERIFICATION',
          details: `OCR Decision: ${logData.decision} | FormRoll: ${logData.formRoll} | Verified: ${logData.isVerified}`
        }
      });
    } catch (e) {
      // Non-blocking log save
    }
  }
}

module.exports = {
  DocumentVerificationService,
  OcrDecision
};
