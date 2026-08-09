const fs = require('fs');
const AdminService = require('../services/admin.service');
const AuthService = require('../services/auth.service');

class AdminController {
  static async getStats(req, res, next) {
    try {
      const stats = await AdminService.getStats();
      res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  }

  static async getDashboardMetrics(req, res, next) {
    try {
      const metrics = await AdminService.getDashboardMetrics();
      res.status(200).json(metrics);
    } catch (err) {
      next(err);
    }
  }

  static async getAdminProfile(req, res, next) {
    try {
      const userIdentifier = req.user?.email || req.user?.id;
      const profile = await AdminService.getAdminProfile(userIdentifier);
      res.status(200).json(profile);
    } catch (err) {
      next(err);
    }
  }

  static async updateAdminProfile(req, res, next) {
    try {
      const userIdentifier = req.user?.email || req.user?.id;
      const updated = await AdminService.updateAdminProfile(userIdentifier, req.body);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }

  static async uploadProfileImage(req, res, next) {
    try {
      const userIdentifier = req.user?.email || req.user?.id;
      let imageUrl = req.body?.imageUrl;
      if (req.file) {
        if (req.file.buffer) {
          const base64 = req.file.buffer.toString('base64');
          imageUrl = `data:${req.file.mimetype};base64,${base64}`;
        } else if (req.file.path && fs.existsSync(req.file.path)) {
          const buffer = fs.readFileSync(req.file.path);
          imageUrl = `data:${req.file.mimetype || 'image/png'};base64,${buffer.toString('base64')}`;
        } else if (req.file.filename) {
          imageUrl = `http://localhost:8082/uploads/images/${req.file.filename}`;
        }
      }
      if (!imageUrl) {
        return res.status(400).json({ message: 'Image data is required' });
      }
      const result = await AdminService.updateAdminProfileImage(userIdentifier, imageUrl);
      res.status(200).json({
        success: true,
        message: 'Profile image updated successfully',
        imageUrl: result.imageUrl || imageUrl,
        profileImageUrl: result.imageUrl || imageUrl
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteProfileImage(req, res, next) {
    try {
      const userIdentifier = req.user?.email || req.user?.id;
      const result = await AdminService.deleteAdminProfileImage(userIdentifier);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getShortlistedApplications(req, res, next) {
    try {
      const applications = await AdminService.getShortlistedApplications();
      res.status(200).json(applications);
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, oldPassword, newPassword, confirmPassword } = req.body;
      const pwdToVerify = currentPassword || oldPassword;
      const result = await AuthService.changePassword(req.user.id, pwdToVerify, newPassword, confirmPassword);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getAllStudents(req, res, next) {
    try {
      const students = await AdminService.getAllStudents();
      res.status(200).json(students);
    } catch (err) {
      next(err);
    }
  }

  static async getAllAlumni(req, res, next) {
    try {
      const alumni = await AdminService.getAllAlumni(req.query);
      res.status(200).json(alumni);
    } catch (err) {
      next(err);
    }
  }

  static async verifyAlumni(req, res, next) {
    try {
      const { status } = req.body;
      const result = await AdminService.verifyAlumni(req.params.id, status);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getAllJobs(req, res, next) {
    try {
      const JobService = require('../services/job.service');
      const jobs = await JobService.getAllJobs(req.query);
      res.status(200).json(jobs);
    } catch (err) {
      next(err);
    }
  }

  static async getPendingJobs(req, res, next) {
    try {
      const JobService = require('../services/job.service');
      const jobs = await JobService.getAllJobs({ ...req.query, status: 'PENDING' });
      res.status(200).json(jobs);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/jobs/moderate/:id
   * Body: { approved: boolean, rejectionReason?: string }
   * Maps to: approved=true → APPROVED, approved=false → REJECTED
   * Matches the Spring Boot reference contract exactly.
   */
  static async moderateJob(req, res, next) {
    try {
      const jobId = req.params.id;
      const { approved, rejectionReason } = req.body || {};

      // approved can arrive as boolean true/false or string 'true'/'false'
      const isApproved = approved === true || approved === 'true';
      const newStatus = isApproved ? 'APPROVED' : 'REJECTED';

      const JobService = require('../services/job.service');
      const result = await JobService.updateJobStatus(jobId, newStatus, rejectionReason || null);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async updateJobStatus(req, res, next) {
    try {
      const { status, reason } = req.body;
      const JobService = require('../services/job.service');
      const result = await JobService.updateJobStatus(req.params.id, status, reason || null);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async deleteStudent(req, res, next) {
    try {
      const result = await AdminService.deleteStudent(req.params.id, req.user?.email, req.ip);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async resetStudentPassword(req, res, next) {
    try {
      const result = await AdminService.resetStudentPassword(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async importStudents(req, res, next) {
    try {
      const AdminImportService = require('../services/adminImport.service');
      const result = await AdminImportService.importStudents(req.file);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async exportStudents(req, res, next) {
    try {
      const AdminExportService = require('../services/adminExport.service');
      const { fileBuffer, contentType, filename } = await AdminExportService.exportStudents(req.body, req.user?.email);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(fileBuffer);
    } catch (err) {
      next(err);
    }
  }

  static async addStudent(req, res, next) {
    try {
      const result = await AdminService.addStudent(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async approveStudent(req, res, next) {
    try {
      const result = await AdminService.approveStudent(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async toggleStudentStatus(req, res, next) {
    try {
      const status = req.query.status || req.body.status;
      const result = await AdminService.toggleStudentStatus(req.params.id, status);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getStudentDetails(req, res, next) {
    try {
      const result = await AdminService.getStudentDetails(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AdminController;
