const AlumniService = require('../services/alumni.service');

class AlumniController {
  static async getProfile(req, res, next) {
    try {
      const profile = await AlumniService.getProfile(req.user.id);
      res.status(200).json(profile);
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const result = await AlumniService.updateProfile(req.user.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getPostedJobs(req, res, next) {
    try {
      const jobs = await AlumniService.getPostedJobs(req.user.id);
      res.status(200).json(jobs);
    } catch (err) {
      next(err);
    }
  }

  static async createJob(req, res, next) {
    try {
      const result = await AlumniService.createJob(req.user.id, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async verifyDocument(req, res, next) {
    try {
      const { DocumentVerificationService } = require('../services/documentVerification.service');
      const { formName, formRoll } = req.body;
      const result = await DocumentVerificationService.validateRegistrationData(req.file, formName, formRoll, req.ip);

      if (!result.passed) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getJobStatistics(req, res, next) {
    try {
      const prisma = require('../config/db');
      const JobService = require('../services/job.service');
      const jobId = req.params.jobId;

      const job = await prisma.job.findUnique({
        where: { id: BigInt(jobId) }
      });

      if (!job || job.deletedAt) {
        return res.status(404).json({ success: false, message: 'Job posting not found' });
      }

      // Admin and Super Admin can view stats for any job
      if (req.user.role === 'ALUMNI') {
        const alumni = await prisma.alumni.findUnique({
          where: { userId: BigInt(req.user.id) }
        });
        if (!alumni || Number(job.postedByAlumniId) !== Number(alumni.id)) {
          return res.status(403).json({ success: false, message: 'Not authorized to view statistics for this job' });
        }
      }

      const stats = await JobService.getJobStatistics(jobId);
      res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AlumniController;
