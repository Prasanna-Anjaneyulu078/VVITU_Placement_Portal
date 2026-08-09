const prisma = require('../config/db');

class ResumeService {
  static async uploadResume(userId, file) {
    if (!file) {
      throw { statusCode: 400, message: 'Resume file is required' };
    }

    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    // Use the file path relative to uploads dir so it can be served statically
    const filePath = `/uploads/resumes/${file.filename}`;
    const mimeType = file.mimetype || 'application/pdf';

    // Upsert: update existing resume record if one exists, create if not.
    // (Resume.studentId is @unique in schema — one active resume per student)
    const existingResume = await prisma.resume.findFirst({
      where: { studentId: student.id, deletedAt: null }
    });

    let resumeRecord;
    if (existingResume) {
      resumeRecord = await prisma.resume.update({
        where: { id: existingResume.id },
        data: {
          filePath: filePath,
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
          filePath: filePath,
          fileName: file.originalname,
          fileType: mimeType
        }
      });
    }

    return {
      success: true,
      message: 'Resume uploaded successfully',
      resume: {
        id: Number(resumeRecord.id),
        fileName: resumeRecord.fileName,
        fileUrl: resumeRecord.filePath,
        filePath: resumeRecord.filePath,
        uploadedAt: resumeRecord.uploadedAt
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

    return resumes.map((r) => ({
      id: Number(r.id),
      fileName: r.fileName,
      fileUrl: r.filePath,   // schema field is filePath
      filePath: r.filePath,
      fileType: r.fileType,
      uploadedAt: r.uploadedAt
    }));
  }

  static async getResumeFileById(userId, resumeId = null, role = 'STUDENT') {
    const fs = require('fs');
    const path = require('path');
    const env = require('../config/env');

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
      throw { statusCode: 404, message: 'Resume file not found. Please upload your resume again.' };
    }

    // Schema field is filePath (mapped from file_path column)
    const storedPath = resumeRecord.filePath;
    if (!storedPath) {
      throw { statusCode: 404, message: 'Resume file path not recorded. Please re-upload your resume.' };
    }
    const baseFileName = path.basename(storedPath);
    const filePath = path.join(env.uploadDir, 'resumes', baseFileName);

    if (!fs.existsSync(filePath)) {
      throw { statusCode: 404, message: 'Resume file missing from storage. Please re-upload your resume.' };
    }

    const mimeType = resumeRecord.fileType || 'application/pdf';
    return {
      filePath,
      fileName: resumeRecord.fileName || `${resumeRecord.student?.rollNumber || 'Student'}_Resume.pdf`,
      mimeType
    };
  }
}

module.exports = ResumeService;
