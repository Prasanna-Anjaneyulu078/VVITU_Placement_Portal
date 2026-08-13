const prisma = require('../config/db');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const { resolveResumeFilePath } = require('../utils/file.utils');

class ResumeService {
  static async uploadResume(userId, file, strategy = 'REPLACE') {
    if (!file) {
      throw { statusCode: 400, message: 'Resume file is required' };
    }

    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      // Clean up uploaded file if student not found
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    const relativePath = `/uploads/resumes/${file.filename}`;
    const mimeType = file.mimetype || 'application/pdf';

    // Find any existing resume record for this student (whether deletedAt is null or not)
    // to respect @@unique(studentId) constraint in Prisma schema
    const existingResume = await prisma.resume.findFirst({
      where: { studentId: student.id }
    });

    let resumeRecord;
    let oldPhysicalPath = null;

    if (existingResume && existingResume.filePath) {
      try {
        oldPhysicalPath = resolveResumeFilePath(existingResume.filePath);
      } catch (e) {
        // Safe fallback
      }
    }

    try {
      if (existingResume) {
        resumeRecord = await prisma.resume.update({
          where: { id: existingResume.id },
          data: {
            filePath: relativePath,
            fileName: file.originalname,
            fileType: mimeType,
            uploadedAt: new Date(),
            deletedAt: null
          }
        });
      } else {
        resumeRecord = await prisma.resume.create({
          data: {
            studentId: student.id,
            filePath: relativePath,
            fileName: file.originalname,
            fileType: mimeType
          }
        });
      }
    } catch (err) {
      // If database operation fails, remove the newly uploaded file to avoid orphan storage
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
      console.error('[RESUME-UPLOAD] Database persistence error:', err);
      throw { statusCode: 500, message: 'Failed to update resume database record' };
    }

    // Safely remove old physical resume file only after database update succeeds
    if (oldPhysicalPath && fs.existsSync(oldPhysicalPath) && path.basename(oldPhysicalPath) !== file.filename) {
      try {
        fs.unlinkSync(oldPhysicalPath);
      } catch (e) {
        console.warn('[RESUME-UPLOAD] Old physical file cleanup warning:', e.message);
      }
    }

    // Auto-extract skills if strategy is not KEEP
    let skillsExtracted = false;
    let totalExtractedSkills = 0;
    try {
      if (strategy !== 'KEEP') {
        const StudentService = require('./student.service');
        const extractResult = await StudentService.reExtractSkills(userId);
        skillsExtracted = extractResult.success;
        totalExtractedSkills = extractResult.totalSkills || 0;
      }
    } catch (skillErr) {
      console.warn('[RESUME-UPLOAD] Skill auto-extraction warning:', skillErr.message || skillErr);
    }

    return {
      success: true,
      message: skillsExtracted ? 'Resume uploaded and skills extracted successfully' : 'Resume uploaded successfully, but skills could not be extracted automatically.',
      skillsExtracted,
      totalSkills: totalExtractedSkills,
      resume: {
        id: Number(resumeRecord.id),
        fileName: resumeRecord.fileName,
        fileUrl: resumeRecord.filePath,
        filePath: resumeRecord.filePath,
        fileType: resumeRecord.fileType,
        uploadedAt: resumeRecord.uploadedAt,
        hasResume: true
      }
    };
  }

  static async getStudentResumes(userId) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    const resumes = await prisma.resume.findMany({
      where: {
        studentId: student.id,
        deletedAt: null
      },
      orderBy: { uploadedAt: 'desc' }
    });

    return resumes.map((r) => {
      let fileSizeStr = null;
      try {
        const physical = resolveResumeFilePath(r.filePath);
        if (physical) {
          const stat = fs.statSync(physical);
          fileSizeStr = `${(stat.size / 1024 / 1024).toFixed(2)} MB`;
        }
      } catch (e) {}

      return {
        id: Number(r.id),
        fileName: r.fileName,
        fileUrl: r.filePath,
        filePath: r.filePath,
        fileType: r.fileType || 'application/pdf',
        fileSize: fileSizeStr,
        uploadedAt: r.uploadedAt,
        hasResume: true
      };
    });
  }

  static async getResumeFileById(userId, resumeId = null, role = 'STUDENT') {
    let resumeRecord = null;

    if (resumeId) {
      resumeRecord = await prisma.resume.findFirst({
        where: { id: BigInt(resumeId), deletedAt: null },
        include: { student: true }
      });
      if (role === 'STUDENT' && resumeRecord) {
        const student = await prisma.student.findUnique({ where: { userId: BigInt(userId) } });
        if (!student || Number(resumeRecord.studentId) !== Number(student.id)) {
          throw { statusCode: 403, message: 'Forbidden: You do not have access to this resume' };
        }
      }
    } else {
      const student = await prisma.student.findUnique({ where: { userId: BigInt(userId) } });
      if (!student) {
        throw { statusCode: 404, message: 'Student profile not found' };
      }
      resumeRecord = await prisma.resume.findFirst({
        where: { studentId: student.id, deletedAt: null },
        orderBy: { uploadedAt: 'desc' },
        include: { student: true }
      });
    }

    if (!resumeRecord) {
      throw { statusCode: 404, message: 'No resume uploaded. Please upload your resume.' };
    }

    const storedPath = resumeRecord.filePath;
    if (!storedPath) {
      throw { statusCode: 404, message: 'Resume file path not recorded. Please re-upload your resume.' };
    }

    const physicalPath = resolveResumeFilePath(storedPath);
    if (!physicalPath) {
      throw { statusCode: 404, message: 'Resume file missing from storage. Please re-upload your resume.' };
    }

    const mimeType = resumeRecord.fileType || 'application/pdf';
    return {
      filePath: physicalPath,
      fileName: resumeRecord.fileName || `${resumeRecord.student?.rollNumber || 'Student'}_Resume.pdf`,
      mimeType
    };
  }
}

module.exports = ResumeService;
