const ResumeService = require('../services/resume.service');

class ResumeController {
  static async uploadResume(req, res, next) {
    try {
      const result = await ResumeService.uploadResume(req.user.id, req.file);
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
      const resumeId = req.params.id || null;
      const { filePath, fileName, mimeType } = await ResumeService.getResumeFileById(req.user.id, resumeId, req.user.role);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
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
