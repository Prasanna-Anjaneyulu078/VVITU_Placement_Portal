const ApplicationService = require('../services/application.service');

class ApplicationController {
  static async applyForJob(req, res, next) {
    try {
      const { jobId, screeningAnswers } = req.body;
      const result = await ApplicationService.applyForJob(req.user.id, jobId, screeningAnswers);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getStudentApplications(req, res, next) {
    try {
      const applications = await ApplicationService.getStudentApplications(req.user.id);
      res.status(200).json(applications);
    } catch (err) {
      next(err);
    }
  }

  static async getJobApplicationsForAlumni(req, res, next) {
    try {
      const applications = await ApplicationService.getJobApplicationsForAlumni(req.user.id, req.params.jobId);
      res.status(200).json(applications);
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const caller = { userId: req.user.id, role: req.user.role };
      const result = await ApplicationService.updateStatus(req.params.id, status, caller);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getJobApplications(req, res, next) {
    try {
      const jobId = req.params.jobId;
      const role = req.user.role;

      if (role === 'ALUMNI') {
        const applications = await ApplicationService.getJobApplicationsForAlumni(req.user.id, jobId);
        return res.status(200).json(applications);
      } else {
        const prisma = require('../config/db');
        const applications = await prisma.application.findMany({
          where: {
            jobId: BigInt(jobId),
            deletedAt: null
          },
          include: {
            student: {
              include: {
                user: { select: { name: true, email: true } },
                skills: { where: { deletedAt: null } },
                projects: { where: { deletedAt: null } },
                resumes: { where: { deletedAt: null }, orderBy: { uploadedAt: 'desc' }, take: 1 }
              }
            },
            answers: true
          },
          orderBy: { appliedAt: 'desc' }
        });

        const formatted = applications.map((app) => ({
          id: Number(app.id),
          jobId: Number(app.jobId),
          studentId: Number(app.studentId),
          studentName: app.student.user.name,
          studentEmail: app.student.user.email,
          rollNumber: app.student.rollNumber,
          department: app.student.department,
          cgpa: app.student.cgpa,
          backlogs: app.student.backlogs,
          status: app.status,
          appliedAt: app.appliedAt,
          resumeUrl: app.student.resumes[0]?.fileUrl || null,
          skills: app.student.skills.map((s) => s.skillName),
          projects: app.student.projects.map((p) => ({ title: p.title, description: p.description })),
          screeningAnswers: app.answers.map((ans) => ({ question: ans.question, answer: ans.answer }))
        }));

        return res.status(200).json(formatted);
      }
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ApplicationController;
