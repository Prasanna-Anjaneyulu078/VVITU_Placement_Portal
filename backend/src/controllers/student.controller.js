const StudentService = require('../services/student.service');

class StudentController {
  static async getProfile(req, res, next) {
    try {
      const profile = await StudentService.getProfile(req.user.id);
      res.status(200).json(profile);
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const result = await StudentService.updateProfile(req.user.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getSkills(req, res, next) {
    try {
      const skills = await StudentService.getSkills(req.user.id);
      res.status(200).json(skills);
    } catch (err) {
      next(err);
    }
  }

  static async addSkill(req, res, next) {
    try {
      const result = await StudentService.addSkill(req.user.id, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async deleteSkill(req, res, next) {
    try {
      const result = await StudentService.deleteSkill(req.user.id, req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getProjects(req, res, next) {
    try {
      const projects = await StudentService.getProjects(req.user.id);
      res.status(200).json(projects);
    } catch (err) {
      next(err);
    }
  }

  static async addProject(req, res, next) {
    try {
      const result = await StudentService.addProject(req.user.id, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async updateProject(req, res, next) {
    try {
      const result = await StudentService.updateProject(req.user.id, req.params.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async deleteProject(req, res, next) {
    try {
      const result = await StudentService.deleteProject(req.user.id, req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async uploadProfileImage(req, res, next) {
    try {
      const result = await StudentService.updateProfileImage(req.user.id, req.file, req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getResumeDetails(req, res, next) {
    try {
      const result = await StudentService.getResumeDetails(req.user.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async viewResume(req, res, next) {
    try {
      const { filePath, fileName, mimeType } = await StudentService.getResumeFile(req.user.id);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  }

  static async downloadResume(req, res, next) {
    try {
      const { filePath, fileName } = await StudentService.getResumeFile(req.user.id);
      res.download(filePath, fileName);
    } catch (err) {
      next(err);
    }
  }

  static async getOpenJobs(req, res, next) {
    try {
      const JobService = require('../services/job.service');
      const jobs = await JobService.getOpenJobs(req.query);
      res.status(200).json(jobs);
    } catch (err) {
      next(err);
    }
  }

  static async getClosedJobs(req, res, next) {
    try {
      const JobService = require('../services/job.service');
      const jobs = await JobService.getClosedJobs(req.query);
      res.status(200).json(jobs);
    } catch (err) {
      next(err);
    }
  }

  static async getAppliedJobs(req, res, next) {
    try {
      const ApplicationService = require('../services/application.service');
      const apps = await ApplicationService.getStudentApplications(req.user.id);
      res.status(200).json(apps);
    } catch (err) {
      next(err);
    }
  }

  static async uploadResume(req, res, next) {
    try {
      const ResumeService = require('../services/resume.service');
      const result = await ResumeService.uploadResume(req.user.id, req.file);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getJobById(req, res, next) {
    try {
      const JobService = require('../services/job.service');
      const job = await JobService.getJobById(req.params.id);
      // Students may only view APPROVED jobs
      if (job.status !== 'APPROVED') {
        return res.status(404).json({ success: false, message: 'Job not found or not available' });
      }
      res.status(200).json(job);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = StudentController;
