const ResumeService = require('../services/resume.service');

class ResumeController {
  static async uploadResume(req, res, next) {
    try {
      const result = await ResumeService.uploadResume(req.user.id, req.file, req.body?.strategy);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getStudentResumes(req, res, next) {
    try {
      const resumes = await ResumeService.getStudentResumes(req.user.id);
      res.status(200).json(resumes);
    } catch (err) {
      next(err);
    }
  }

  static async viewResume(req, res, next) {
    try {
      const path = require('path');
      const resumeId = req.params.id || null;
      const { filePath, fileName, mimeType } = await ResumeService.getResumeFileById(req.user.id, resumeId, req.user.role);
      
      const ext = path.extname(fileName || filePath).toLowerCase();
      let disposition = 'inline';
      let contentType = mimeType || 'application/pdf';

      if (ext === '.doc' || ext === '.docx' || (mimeType && mimeType.includes('word'))) {
        disposition = 'attachment';
      }
      if (ext === '.pdf') contentType = 'application/pdf';
      if (ext === '.doc') contentType = 'application/msword';
      if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `${disposition}; filename="${fileName}"`);
      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  }

  static async downloadResume(req, res, next) {
    try {
      const resumeId = req.params.id || null;
      const { filePath, fileName } = await ResumeService.getResumeFileById(req.user.id, resumeId, req.user.role);
      res.download(filePath, fileName);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ResumeController;
