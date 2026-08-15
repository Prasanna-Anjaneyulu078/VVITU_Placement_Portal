const prisma = require('../config/db');
const { hashPassword, comparePassword, validatePasswordRequirements } = require('../utils/password.utils');
const fs = require('fs');

class AuthService {
  static async login(email, password) {
    if (!email || !password) {
      throw { statusCode: 400, message: 'Email and password are required' };
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: { email: cleanEmail }
    });

    if (!user) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    if (user.accountStatus && user.accountStatus !== 'ACTIVE') {
      throw { statusCode: 403, message: 'Account is deactivated or disabled. Please contact administrator.' };
    }

    let verificationStatus = 'APPROVED';
    let profileImageUrl = null;

    if (user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: user.id }
      });
      if (student && student.profileImageUrl) {
        profileImageUrl = student.profileImageUrl;
      }
    } else if (user.role === 'ALUMNI') {
      const alumni = await prisma.alumni.findUnique({
        where: { userId: user.id }
      });
      const { VERIFICATION_STATUS } = require('../utils/constants');
      verificationStatus = alumni ? alumni.verificationStatus : VERIFICATION_STATUS.PENDING;
      if (alumni && alumni.profileImageUrl) {
        profileImageUrl = alumni.profileImageUrl;
      }
    } else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      const adminProfile = await prisma.adminProfile.findUnique({
        where: { userId: user.id }
      });
      if (adminProfile && adminProfile.profileImageUrl) {
        profileImageUrl = adminProfile.profileImageUrl;
      }
    }

    const jwtUtils = require('../utils/jwt.utils');
    const accessToken = jwtUtils.generateAccessToken({ id: Number(user.id), email: user.email, role: user.role });
    const refreshToken = jwtUtils.generateRefreshToken({ id: Number(user.id), email: user.email, role: user.role });

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
    } catch (e) {
      // safe fallback
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus,
        profileImageUrl
      }
    };
  }

  static async registerStudent(data) {
    const { name, email, password, rollNumber, department, batch, mobileNumber, cgpa } = data;

    if (!name || !email || !password || !rollNumber) {
      throw { statusCode: 400, message: 'Name, email, password, and roll number are required' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRollNumber = rollNumber.trim().toUpperCase();

    const existingUser = await prisma.user.findFirst({ where: { email: cleanEmail } });
    if (existingUser) {
      throw { statusCode: 400, message: 'User with this email already exists' };
    }

    const existingStudent = await prisma.student.findFirst({ where: { rollNumber: cleanRollNumber } });
    if (existingStudent) {
      throw { statusCode: 400, message: 'Student with this roll number already exists' };
    }

    const hashedPassword = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: hashedPassword,
          role: 'STUDENT',
          accountStatus: 'ACTIVE'
        }
      });

      const newStudent = await tx.student.create({
        data: {
          userId: newUser.id,
          rollNumber: cleanRollNumber,
          department: department ? department.trim() : null,
          batch: batch ? batch.trim() : null,
          mobileNumber: mobileNumber ? mobileNumber.trim() : null,
          cgpa: cgpa ? parseFloat(cgpa) : null
        }
      });

      return { newUser, newStudent };
    });

    return { success: true, message: 'Student registered successfully' };
  }

  static async registerAlumni(data, file, ipAddress = '127.0.0.1') {
    const {
      name,
      email,
      password,
      company,
      designation,
      passingYear,
      rollNumber,
      department,
      degree,
      mobileNumber,
      gender,
      linkedinUrl
    } = data;

    if (!name || !name.trim()) {
      throw { statusCode: 400, message: 'Full name is required' };
    }
    if (!email || !email.trim()) {
      throw { statusCode: 400, message: 'Email address is required' };
    }
    if (!password) {
      throw { statusCode: 400, message: 'Password is required' };
    }
    if (!rollNumber || !rollNumber.trim()) {
      throw { statusCode: 400, message: 'College roll number is required' };
    }
    if (!file) {
      throw { statusCode: 400, message: 'Verification document is required. Please upload a clear VVIT/VVITU degree/provisional certificate or ID card.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRollNumber = rollNumber.trim().toUpperCase();

    // Check duplicate email
    const existingUser = await prisma.user.findFirst({ where: { email: cleanEmail } });
    if (existingUser) {
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
      throw { statusCode: 400, message: 'User with this email address already exists' };
    }

    // Check duplicate roll number
    const existingAlumni = await prisma.alumni.findFirst({ where: { rollNumber: cleanRollNumber } });
    if (existingAlumni) {
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
      throw { statusCode: 400, message: 'An Alumni account with this Roll Number is already registered' };
    }

    // ── OCR Verification Pipeline ──────────────────────────────────────────
    const { DocumentVerificationService, OcrDecision, ReasonCode } = require('./documentVerification.service');
    let ocrResult = null;

    try {
      ocrResult = await DocumentVerificationService.validateRegistrationData(
        file, name.trim(), cleanRollNumber, cleanEmail, ipAddress
      );
    } catch (ocrErr) {
      console.warn('[ALUMNI-REGISTER-OCR] Unexpected OCR pipeline error:', ocrErr.message || ocrErr);
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
      throw {
        statusCode: 422,
        code: 'DOCUMENT_OCR_FAILED',
        message: 'We could not reliably process the uploaded document. Please upload a clearer VVIT/VVITU document.'
      };
    }

    console.log(`[ALUMNI-REGISTER] OCR Decision: ${ocrResult.decision} | ReasonCode: ${ocrResult.reasonCode} | Roll: ${cleanRollNumber}`);
    console.log(`[ALUMNI-VERIFY] FORM NAME: ${name.trim()} | OCR NAME: ${ocrResult.name?.extractedValue || 'N/A'}`);
    console.log(`[ALUMNI-VERIFY] FORM ROLL: ${cleanRollNumber} | OCR ROLL: ${ocrResult.rollNumber?.extractedValue || 'N/A'}`);
    console.log(`[ALUMNI-VERIFY] COLLEGE: ${ocrResult.college?.extractedValue || 'N/A'} | STATUS: ${ocrResult.college?.status}`);
    console.log(`[ALUMNI-VERIFY] NAME STATUS: ${ocrResult.name?.status} | ROLL STATUS: ${ocrResult.rollNumber?.status}`);
    console.log(`[ALUMNI-VERIFY] NAME CONFIDENCE: ${ocrResult.name?.confidence} | ROLL CONFIDENCE: ${ocrResult.rollNumber?.confidence}`);
    console.log(`[ALUMNI-VERIFY] OCR CONFIDENCE: ${ocrResult.overallConfidence} | FINAL: ${ocrResult.decision}`);

    // ── Decision → Error mapping ───────────────────────────────────────────
    if (ocrResult.decision === OcrDecision.REJECTED) {
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }

      const statusCode = ocrResult.reasonCode === ReasonCode.DUPLICATE_DOCUMENT ? 409 : 422;
      throw {
        statusCode,
        code: ocrResult.reasonCode,
        reasonCode: ocrResult.reasonCode,
        message: ocrResult.message,
        verification: ocrResult.verification || ocrResult.fieldResults
      };
    }

    // ── Determine DB status ────────────────────────────────────────────────
    const { VERIFICATION_STATUS } = require('../utils/constants');

    let verificationStatus;
    let ocrVerified = false;
    let manualReview = ocrResult.manualReviewRequired || false;

    if (ocrResult.decision === OcrDecision.VERIFIED) {
      verificationStatus = VERIFICATION_STATUS.VERIFIED;
      ocrVerified = true;
      manualReview = false;
    } else if (ocrResult.decision === OcrDecision.PENDING_MANUAL_REVIEW) {
      verificationStatus = VERIFICATION_STATUS.PENDING;
      ocrVerified = false;
      manualReview = true;
    } else {
      // Fallback – should not reach here
      verificationStatus = VERIFICATION_STATUS.PENDING;
      manualReview = true;
    }

    const hashedPassword = await hashPassword(password);
    const docUrl = `/uploads/documents/${file.filename}`;

    // ── Atomic DB Transaction ─────────────────────────────────────────────
    let createdUser;
    let createdAlumni;

    try {
      await prisma.$transaction(async (tx) => {
        createdUser = await tx.user.create({
          data: {
            name: name.trim(),
            email: cleanEmail,
            password: hashedPassword,
            role: 'ALUMNI',
            accountStatus: 'ACTIVE'
          }
        });

        createdAlumni = await tx.alumni.create({
          data: {
            userId: createdUser.id,
            company: company ? company.trim() : null,
            designation: designation ? designation.trim() : null,
            passingYear: passingYear ? parseInt(passingYear, 10) : null,
            rollNumber: cleanRollNumber,
            department: department ? department.trim() : null,
            degree: degree ? degree.trim() : null,
            mobileNumber: mobileNumber ? mobileNumber.trim() : null,
            gender: gender ? gender.trim() : null,
            linkedinUrl: linkedinUrl ? linkedinUrl.trim() : null,
            verificationStatus: verificationStatus,
            verificationDocumentUrl: docUrl,
            verificationDocumentName: file.originalname,
            verificationDocumentUploadDate: new Date(),
            ocrVerified: ocrVerified,
            ocrExtractedName: ocrResult.name?.extractedValue || name.trim(),
            ocrExtractedRollNumber: ocrResult.rollNumber?.extractedValue || cleanRollNumber,
            ocrDetectedCollege: ocrResult.college?.extractedValue || null,
            ocrConfidenceScore: ocrResult.overallConfidence || 0,
            manualReviewRequired: manualReview
          }
        });
      });
    } catch (dbErr) {
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
      console.error('[ALUMNI-REGISTER] Database transaction failed:', dbErr.message || dbErr);
      throw dbErr;
    }

    const manualReviewMsg = manualReview
      ? ' We could not confidently read all information from the uploaded document. Your registration has been submitted for manual verification.'
      : ' Your document has been submitted for admin verification.';

    return {
      success: true,
      message: `Alumni registered successfully!${manualReviewMsg}`,
      verificationStatus,
      manualReviewRequired: manualReview,
      user: {
        id: Number(createdUser.id),
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role
      },
      alumni: {
        id: Number(createdAlumni.id),
        rollNumber: createdAlumni.rollNumber,
        verificationStatus: createdAlumni.verificationStatus
      }
    };
  }

  static async changePassword(userId, currentPassword, newPassword, confirmPassword) {
    if (!currentPassword) {
      throw { statusCode: 400, message: 'Current password is required' };
    }
    if (newPassword !== confirmPassword) {
      throw { statusCode: 400, message: 'New password and confirm password do not match' };
    }
    if (!validatePasswordRequirements(newPassword)) {
      throw { statusCode: 400, message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.' };
    }

    const user = await prisma.user.findUnique({ where: { id: BigInt(userId) } });
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      throw { statusCode: 400, message: 'Incorrect current password' };
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    return { success: true, message: 'Password changed successfully' };
  }

  static async changeEmail(userId, newEmail, password) {
    if (!newEmail || !newEmail.trim()) {
      throw { statusCode: 400, message: 'New email address is required' };
    }
    if (!password) {
      throw { statusCode: 400, message: 'Password is required to confirm email change' };
    }

    const cleanEmail = newEmail.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { id: BigInt(userId) } });
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw { statusCode: 400, message: 'Current password is incorrect' };
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: cleanEmail, NOT: { id: user.id } }
    });
    if (existingUser) {
      throw { statusCode: 409, message: 'This email address is already in use by another account' };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { email: cleanEmail }
    });

    return { success: true, message: 'Email address updated successfully', email: cleanEmail };
  }
}

module.exports = AuthService;
