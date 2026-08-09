const prisma = require('../config/db');

class ApplicationService {
  static async applyForJob(userId, jobId, screeningAnswers = []) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    const job = await prisma.job.findUnique({
      where: { id: BigInt(jobId) }
    });

    if (!job || job.deletedAt) {
      throw { statusCode: 404, message: 'Job posting not found' };
    }

    if (job.status !== 'APPROVED') {
      throw { statusCode: 400, message: 'Applications are not currently accepted for this job' };
    }

    if (job.applicationDeadline && new Date() > new Date(job.applicationDeadline)) {
      throw { statusCode: 400, message: 'Application deadline for this job has passed' };
    }

    const existingApp = await prisma.application.findFirst({
      where: {
        jobId: job.id,
        studentId: student.id,
        deletedAt: null
      }
    });

    if (existingApp) {
      throw { statusCode: 400, message: 'You have already applied for this job' };
    }

    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          jobId: job.id,
          studentId: student.id,
          status: 'APPLIED'
        }
      });

      if (Array.isArray(screeningAnswers) && screeningAnswers.length > 0) {
        await tx.applicationScreeningAnswer.createMany({
          data: screeningAnswers.map((sa) => ({
            applicationId: app.id,
            question: sa.question,
            answer: sa.answer
          }))
        });
      }

      return app;
    });

    return { success: true, message: 'Application submitted successfully', applicationId: Number(application.id) };
  }

  static async getStudentApplications(userId) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    const applications = await prisma.application.findMany({
      where: {
        studentId: student.id,
        deletedAt: null
      },
      include: {
        job: true
      },
      orderBy: { appliedAt: 'desc' }
    });

    return applications.map((app) => ({
      id: Number(app.id),
      jobId: Number(app.jobId),
      jobTitle: app.job.title,
      companyName: app.job.companyName,
      location: app.job.location,
      salaryPackage: app.job.salaryPackage,
      status: app.status,
      appliedAt: app.appliedAt
    }));
  }

  static async getJobApplicationsForAlumni(userId, jobId) {
    const alumni = await prisma.alumni.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!alumni) {
      throw { statusCode: 404, message: 'Alumni profile not found' };
    }

    const job = await prisma.job.findUnique({
      where: { id: BigInt(jobId) }
    });

    if (!job || Number(job.postedByAlumniId) !== Number(alumni.id)) {
      throw { statusCode: 403, message: 'You do not have permission to view applications for this job' };
    }

    const applications = await prisma.application.findMany({
      where: {
        jobId: job.id,
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

    return applications.map((app) => ({
      id: Number(app.id),
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
  }

  static async updateStatus(applicationId, status, caller) {
    const validStatuses = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'ACCEPTED', 'REJECTED', 'OFFERED'];
    if (!validStatuses.includes(status)) {
      throw { statusCode: 400, message: 'Invalid application status' };
    }

    // IDOR protection: verify the application exists first
    const application = await prisma.application.findFirst({
      where: { id: BigInt(applicationId), deletedAt: null },
      include: { job: { select: { postedByAlumniId: true } } }
    });

    if (!application) {
      throw { statusCode: 404, message: 'Application not found' };
    }

    // IDOR protection: Alumni may only update status for applications on their own jobs
    // Mirrors Spring Boot: getJobApplicationsForAlumni verifies job.postedByAlumniId === alumni.id
    if (caller && caller.role === 'ALUMNI') {
      const alumni = await prisma.alumni.findUnique({ where: { userId: BigInt(caller.userId) } });
      if (!alumni) {
        throw { statusCode: 404, message: 'Alumni profile not found' };
      }
      if (!application.job || Number(application.job.postedByAlumniId) !== Number(alumni.id)) {
        throw { statusCode: 403, message: 'Forbidden: You do not have permission to update the status of this application' };
      }
    }

    const updated = await prisma.application.update({
      where: { id: BigInt(application.id) },
      data: { status }
    });

    return { success: true, message: `Application status updated to ${status}`, application: updated };
  }
}


module.exports = ApplicationService;
