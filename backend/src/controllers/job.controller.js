const JobService = require('../services/job.service');

class JobController {
  static async getApprovedJobs(req, res, next) {
    try {
      const jobs = await JobService.getApprovedJobs(req.query);
      res.status(200).json(jobs);
    } catch (err) {
      next(err);
    }
  }

  static async getAllJobs(req, res, next) {
    try {
      const jobs = await JobService.getAllJobs(req.query);
      res.status(200).json(jobs);
    } catch (err) {
      next(err);
    }
  }

  static async getJobById(req, res, next) {
    try {
      let accessScope = null;
      if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN')) {
        const AccessControlService = require('../services/accessControl.service');
        accessScope = await AccessControlService.getAdminAccessScope(req.user.id);
      }
      const job = await JobService.getJobById(req.params.id, accessScope);
      res.status(200).json(job);
    } catch (err) {
      next(err);
    }
  }

  static async createJob(req, res, next) {
    try {
      const filesToPass = req.file || req.files;
      const job = await JobService.createJob(req.user.id, req.user.role, req.body, filesToPass);
      res.status(201).json(job);
    } catch (err) {
      next(err);
    }
  }

  static async getMyJobs(req, res, next) {
    try {
      const jobs = await JobService.getMyJobs(req.user.id, req.user.role, req.query);
      res.status(200).json(jobs);
    } catch (err) {
      next(err);
    }
  }

  static async updateJob(req, res, next) {
    try {
      let accessScope = null;
      if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN')) {
        const AccessControlService = require('../services/accessControl.service');
        accessScope = await AccessControlService.getAdminAccessScope(req.user.id);
      }
      const job = await JobService.updateJob(req.params.id, req.user.id, req.user.role, req.body, accessScope);
      res.status(200).json(job);
    } catch (err) {
      next(err);
    }
  }

  static async deleteJob(req, res, next) {
    try {
      let accessScope = null;
      if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN')) {
        const AccessControlService = require('../services/accessControl.service');
        accessScope = await AccessControlService.getAdminAccessScope(req.user.id);
      }
      await JobService.deleteJob(req.params.id, req.user.id, req.user.role, accessScope);
      res.status(200).json({ success: true, message: 'Job deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async updateJobStatus(req, res, next) {
    try {
      let accessScope = null;
      if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN')) {
        const AccessControlService = require('../services/accessControl.service');
        accessScope = await AccessControlService.getAdminAccessScope(req.user.id);
      }
      // Support both query param (?status=APPROVED) and body ({ status, reason })
      const status = req.query.status || req.body.status;
      const reason = req.query.reason || req.body.reason || null;
      const job = await JobService.updateJobStatus(req.params.id, status, reason, accessScope);
      res.status(200).json(job);
    } catch (err) {
      next(err);
    }
  }

  static async uploadLogo(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      const fileUrl = await JobService.saveJobImage(req.params.id, req.file, 'logo');
      res.status(200).json({ url: fileUrl });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = JobController;
