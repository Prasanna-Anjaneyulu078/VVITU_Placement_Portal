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
        if (req.file.relativePath) {
          imageUrl = req.file.relativePath;
        } else if (req.file.path && typeof req.file.path === 'string' && req.file.path.startsWith('http')) {
          imageUrl = req.file.path;
        } else if (req.file.filename) {
          imageUrl = `/uploads/images/${req.file.filename}`;
        } else if (req.file.buffer) {
          // memoryStorage fallback — save buffer to disk
          const path = require('path');
          const env = require('../config/env');
          const imagesDir = path.join(env.uploadDir, 'images');
          const fs = require('fs');
          if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
          const ext = req.file.mimetype ? '.' + req.file.mimetype.split('/')[1] : '.jpg';
          const filename = `admin-${req.user.id}-${Date.now()}${ext}`;
          const targetPath = path.join(imagesDir, filename);
          fs.writeFileSync(targetPath, req.file.buffer);
          imageUrl = `/uploads/images/${filename}`;
        }
      }

      if (!imageUrl) {
        return res.status(400).json({ message: 'Image data is required' });
      }

      const result = await AdminService.updateAdminProfileImage(userIdentifier, imageUrl);
      // result.profileImageUrl is the stable public API endpoint (set in admin.service.js)
      res.status(200).json({
        success: true,
        message: 'Profile image updated successfully',
        imageUrl: result.profileImageUrl,
        profileImageUrl: result.profileImageUrl,
        url: result.profileImageUrl,
        updatedAt: result.updatedAt
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
      const students = await AdminService.getAllStudents(req.query);
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

  static async getAlumniDocument(req, res, next) {
    try {
      const { diskPath, mimeType, fileName } = await AdminService.getAlumniDocument(req.params.id);
      
      res.setHeader('Content-Type', mimeType);
      const safeFileName = fileName.replace(/["\n\r]/g, '');
      res.setHeader('Content-Disposition', `inline; filename="${safeFileName}"`);

      if (diskPath.startsWith('http://') || diskPath.startsWith('https://')) {
        const axios = require('axios');
        const response = await axios({
          url: diskPath,
          method: 'GET',
          responseType: 'stream'
        });
        return response.data.pipe(res);
      }
      
      return res.sendFile(diskPath);
    } catch (err) {
      next(err);
    }
  }

  static async verifyAlumni(req, res, next) {
    try {
      const { status } = req.body;
      
      if (!['APPROVE', 'REJECT'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid alumni verification action.'
        });
      }

      const dbStatus = status === 'APPROVE' ? 'VERIFIED' : 'REJECTED';

      const result = await AdminService.verifyAlumni(req.params.id, dbStatus);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async deleteAlumni(req, res, next) {
    try {
      const alumniId = Number(req.params.id);
      if (!Number.isInteger(alumniId) || alumniId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid alumni ID.'
        });
      }
      const operatorEmail = req.user?.email || null;
      const ipAddress = req.ip || null;
      
      const result = await AdminService.deleteAlumni(alumniId, operatorEmail, ipAddress);
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

  static async viewStudentResume(req, res, next) {
    try {
      const path = require('path');
      const { filePath, fileName, mimeType } = await AdminService.getStudentResumeFile(req.params.id);

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

      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        const axios = require('axios');
        try {
          const proxyRes = await axios.get(filePath, { responseType: 'stream' });
          return proxyRes.data.pipe(res);
        } catch (axiosErr) {
          return next({ statusCode: 502, message: 'Failed to fetch external resume from storage.' });
        }
      }

      res.sendFile(filePath, (err) => {
        if (err && !res.headersSent) {
          next({ statusCode: 404, message: 'Resume file missing from storage. Please ask student to re-upload resume.' });
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async downloadStudentResume(req, res, next) {
    try {
      const { filePath, fileName } = await AdminService.getStudentResumeFile(req.params.id);
      
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        const axios = require('axios');
        try {
          const proxyRes = await axios.get(filePath, { responseType: 'stream' });
          res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/octet-stream');
          return proxyRes.data.pipe(res);
        } catch (axiosErr) {
          return next({ statusCode: 502, message: 'Failed to fetch external resume from storage.' });
        }
      }
      
      res.download(filePath, fileName);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AdminController;
