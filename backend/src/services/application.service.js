const prisma = require('../config/db');
const EligibilityService = require('./eligibility.service');

class ApplicationService {
  static async applyForJob(userId, jobId, screeningAnswers = []) {
    if (!jobId || isNaN(Number(jobId))) {
      throw { statusCode: 400, message: 'Invalid job ID' };
    }

    const numericJobId = BigInt(jobId);

    console.log(`[APPLICATION] Student application request received`);
    console.log(`[APPLICATION] userId: ${userId}`);
    console.log(`[APPLICATION] jobId: ${jobId}`);

    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student || student.deletedAt) {
      console.warn(`[APPLICATION] Student profile not found for userId: ${userId}`);
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    console.log(`[APPLICATION] studentId: ${student.id}`);

    const job = await prisma.job.findUnique({
      where: { id: numericJobId }
    });

    if (!job || job.deletedAt) {
      console.warn(`[APPLICATION] Job posting not found for jobId: ${jobId}`);
      throw { statusCode: 404, message: 'Job posting not found' };
    }

    if (job.status !== 'APPROVED') {
      console.warn(`[APPLICATION] Job status is not APPROVED: ${job.status}`);
      throw { statusCode: 400, message: 'Applications are not currently accepted for this job' };
    }

    if (job.applicationDeadline && new Date() > new Date(job.applicationDeadline)) {
      console.warn(`[APPLICATION] Job application deadline passed: ${job.applicationDeadline}`);
      throw { statusCode: 400, message: 'Application deadline for this job has passed' };
    }

    // Validate Student Eligibility using existing EligibilityService
    const eligibility = await EligibilityService.validateEligibility(userId, Number(job.id));
    console.log(`[APPLICATION] eligibility check passed: ${eligibility.isEligible}, status: ${eligibility.status}`);
    if (!eligibility.isEligible) {
      console.warn(`[APPLICATION] Eligibility check failed: ${eligibility.rejectionReason}`);
      throw { statusCode: 400, message: eligibility.rejectionReason || 'You are not eligible to apply for this job' };
    }

    // Prevent duplicate application
    const existingApp = await prisma.application.findFirst({
      where: {
        jobId: job.id,
        studentId: student.id,
        deletedAt: null
      }
    });

    if (existingApp) {
      console.warn(`[APPLICATION] Duplicate application detected for studentId ${student.id} and jobId ${job.id}`);
      throw { statusCode: 409, message: 'You have already applied for this job.' };
    }

    // Map and sanitize screening answers sent by frontend (questionText/questionKey -> question)
    const formattedAnswers = [];
    if (Array.isArray(screeningAnswers) && screeningAnswers.length > 0) {
      for (const sa of screeningAnswers) {
        const questionText = sa.questionText || sa.question || sa.questionKey || '';
        const answerText = sa.answer !== undefined && sa.answer !== null ? String(sa.answer) : '';
        if (questionText) {
          formattedAnswers.push({
            question: questionText,
            answer: answerText
          });
        }
      }
    }

    // Execute application creation transaction
    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          jobId: job.id,
          studentId: student.id,
          status: 'APPLIED'
        }
      });

      if (formattedAnswers.length > 0) {
        await tx.applicationScreeningAnswer.createMany({
          data: formattedAnswers.map((ans) => ({
            applicationId: app.id,
            question: ans.question,
            answer: ans.answer
          }))
        });
      }

      return app;
    });

    console.log(`[APPLICATION] application created successfully: applicationId ${application.id}`);

    return {
      success: true,
      message: 'Application submitted successfully.',
      applicationId: Number(application.id),
      application: {
        id: Number(application.id),
        jobId: Number(application.jobId),
        studentId: Number(application.studentId),
        status: application.status,
        appliedAt: application.appliedAt
      }
    };
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

    return applications.map((app) => {
      const j = app.job || {};
      const compName = j.companyName || j.company || 'Company';
      const roleTitle = j.title || j.jobTitle || 'Job Role';
      const logo = j.imageUrl || j.companyLogoUrl || null;

      return {
        id: Number(app.id),
        applicationId: Number(app.id),
        jobId: Number(app.jobId),
        role: roleTitle,
        jobTitle: roleTitle,
        title: roleTitle,
        company: compName,
        companyName: compName,
        companyLogoUrl: logo,
        imageUrl: logo,
        location: j.location || '',
        salaryPackage: j.salaryPackage || '',
        status: app.status,
        appliedAt: app.appliedAt,
        createdAt: app.appliedAt,
        job: {
          id: j.id ? Number(j.id) : null,
          title: roleTitle,
          jobTitle: roleTitle,
          company: compName,
          companyName: compName,
          companyLogoUrl: logo,
          imageUrl: logo,
          location: j.location || '',
          salaryPackage: j.salaryPackage || '',
          jobType: j.jobType || '',
          experienceRequired: j.experienceRequired || '',
          openings: j.openings != null ? j.openings : null,
          requiredCgpa: j.requiredCgpa != null ? j.requiredCgpa : null,
          eligibleSemester: j.eligibleSemester != null ? j.eligibleSemester : null,
          maxBacklogs: j.maxBacklogs != null ? j.maxBacklogs : null,
          eligibleDepartments: j.eligibleDepartments || '',
          applicationDeadline: j.applicationDeadline || null,
          description: j.description || ''
        }
      };
    });
  }

  static async getAlumniPostedJobsApplications(userId) {
    const alumni = await prisma.alumni.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!alumni) {
      throw { statusCode: 404, message: 'Alumni profile not found' };
    }

    const applications = await prisma.application.findMany({
      where: {
        job: { postedByAlumniId: alumni.id },
        deletedAt: null
      },
      include: {
        job: true,
        student: {
          include: {
            user: true
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    return applications.map((app) => {
      const j = app.job || {};
      const compName = j.companyName || j.company || '';
      return {
        id: Number(app.id),
        jobId: Number(app.jobId),
        jobTitle: j.title || '',
        company: compName,
        companyName: compName,
        job: {
          id: j.id ? Number(j.id) : null,
          title: j.title || '',
          company: compName,
          companyName: compName
        },
        studentId: Number(app.studentId),
        studentName: app.student?.user?.name || 'Student',
        email: app.student?.user?.email || '',
        rollNumber: app.student?.rollNumber || '',
        department: app.student?.department || '',
        section: app.student?.section || '',
        profileImageUrl: app.student?.profileImageUrl ? `/api/public/student/${app.student.id}/profile-image` : null,
        status: app.status,
        appliedAt: app.appliedAt,
        shortlistedDate: app.appliedAt,
        updatedAt: app.updatedAt
      };
    });
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
    const validStatuses = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'ACCEPTED', 'REJECTED', 'OFFERED'];
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

  static async getApplicationDetails(applicationId, caller) {
    if (!applicationId || isNaN(Number(applicationId))) {
      throw { statusCode: 400, message: 'Invalid application ID' };
    }

    const numericAppId = BigInt(applicationId);

    const application = await prisma.application.findUnique({
      where: { id: numericAppId },
      include: {
        job: true,
        answers: true,
        student: {
          include: {
            user: { select: { name: true, email: true } },
            resumes: { where: { deletedAt: null }, orderBy: { uploadedAt: 'desc' }, take: 1 },
            skills: { where: { deletedAt: null } },
            projects: { where: { deletedAt: null } }
          }
        }
      }
    });

    if (!application || application.deletedAt) {
      throw { statusCode: 404, message: 'Application not found' };
    }

    // Authorization checks
    if (caller.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: BigInt(caller.userId) } });
      if (!student || application.studentId !== student.id) {
        throw { statusCode: 403, message: 'Forbidden' };
      }
    } else if (caller.role === 'ALUMNI') {
      const alumni = await prisma.alumni.findUnique({ where: { userId: BigInt(caller.userId) } });
      if (!alumni || application.job?.postedByAlumniId !== alumni.id) {
        throw { statusCode: 403, message: 'Forbidden' };
      }
    } else if (caller.role !== 'ADMIN' && caller.role !== 'SUPER_ADMIN') {
      throw { statusCode: 403, message: 'Forbidden' };
    }

    const student = application.student;
    const resume = student.resumes[0];
    const job = application.job || {};

    const companyName = job.companyName || job.company || '';
    const jobTitle = job.title || job.jobTitle || '';

    const salaryVal = job.salaryPackage || null;
    const locationVal = job.location || null;
    const typeVal = job.jobType || null;
    const expVal = job.experienceRequired || null;
    const openingsVal = job.openings != null ? job.openings : null;
    const deadlineVal = job.applicationDeadline || null;
    const deptVal = job.eligibleDepartments || null;
    const cgpaVal = job.requiredCgpa != null ? job.requiredCgpa : null;
    const semVal = job.eligibleSemester != null ? job.eligibleSemester : null;
    const backlogsVal = job.maxBacklogs != null ? job.maxBacklogs : null;
    const descVal = job.description || null;
    const skillsVal = job.requiredSkills || null;
    const logoVal = job.imageUrl || job.companyLogoUrl || null;
    const industryVal = job.industry || null;
    const sizeVal = job.companySize || null;
    const websiteVal = job.applicationLink || null;

    return {
      id: Number(application.id),
      applicationId: Number(application.id),
      jobId: Number(application.jobId),
      jobTitle: jobTitle,
      title: jobTitle,
      role: jobTitle,
      company: companyName,
      companyName: companyName,
      companyLogoUrl: logoVal,
      imageUrl: logoVal,
      companyIndustry: industryVal,
      industry: industryVal,
      companySizeInfo: sizeVal,
      companySize: sizeVal,
      companyWebsite: websiteVal,
      companyDescription: `${companyName} is an recruiter partner conducting placement drives.`,
      
      jobDescription: descVal,
      description: descVal,
      jobLocation: locationVal,
      location: locationVal,
      jobType: typeVal,
      employmentType: typeVal,
      packageDetails: salaryVal,
      salaryPackage: salaryVal,
      salary: salaryVal,
      package: salaryVal,
      experienceRequired: expVal,
      experience: expVal,
      openings: openingsVal,
      numberOfOpenings: openingsVal,
      expiryDate: deadlineVal,
      deadline: deadlineVal,
      applicationDeadline: deadlineVal,

      eligibleDepartments: deptVal,
      eligibleBranches: deptVal,
      minCgpa: cgpaVal,
      minimumCgpa: cgpaVal,
      requiredCgpa: cgpaVal,
      eligibleSemester: semVal,
      eligibleSemesterBatch: semVal,
      maxBacklogs: backlogsVal,
      activeBacklogs: backlogsVal,
      activeBacklogsAllowed: backlogsVal,
      requiredSkills: skillsVal,
      jobStatus: job.status || null,

      status: application.status,
      appliedAt: application.appliedAt,
      studentId: Number(student.id),
      studentName: student.user.name,
      rollNumber: student.rollNumber,
      department: student.department,
      cgpa: student.cgpa,
      email: student.user.email,
      mobileNumber: student.mobileNumber,
      profileImageUrl: student.profileImageUrl ? `/api/public/student/${student.id}/profile-image` : null,
      resumeUrl: resume?.fileUrl || null,
      resumeDownloadUrl: resume?.fileUrl ? `${resume.fileUrl}/download` : null,
      resumeFileName: resume?.fileName || null,
      academicYear: student.academicYear,
      semester: student.semester,
      section: student.section,
      verificationStatus: student.verificationStatus,
      githubUrl: student.githubUrl,
      linkedinUrl: student.linkedinUrl,
      leetcodeUrl: student.leetcodeUrl,
      codechefUrl: student.codechefUrl,
      gfgUrl: student.gfgUrl,
      hackerrankUrl: student.hackerrankUrl,
      gender: student.gender,
      dob: student.dob,
      address: student.address,
      backlogs: student.backlogs,
      skills: student.skills || [],
      projects: student.projects || [],
      screeningAnswers: (application.answers || []).map(a => ({
        id: Number(a.id),
        questionText: a.question,
        answer: a.answer
      })),
      job: {
        id: Number(job.id),
        title: jobTitle,
        company: companyName,
        companyName: companyName,
        company: {
          name: companyName,
          industry: industryVal || 'Technology & Services',
          companySize: sizeVal || 'Corporate'
        },
        description: descVal,
        jobDescription: descVal,
        location: locationVal,
        jobLocation: locationVal,
        jobType: typeVal,
        employmentType: typeVal,
        salaryPackage: salaryVal,
        salary: salaryVal,
        package: salaryVal,
        packageDetails: salaryVal,
        experienceRequired: expVal,
        experience: expVal,
        requiredSkills: skillsVal,
        imageUrl: logoVal,
        companyLogoUrl: logoVal,
        industry: industryVal,
        companySize: sizeVal,
        openings: openingsVal,
        numberOfOpenings: openingsVal,
        minCgpa: cgpaVal,
        minimumCgpa: cgpaVal,
        requiredCgpa: cgpaVal,
        eligibleSemester: semVal,
        eligibleSemesterBatch: semVal,
        maxBacklogs: backlogsVal,
        activeBacklogs: backlogsVal,
        activeBacklogsAllowed: backlogsVal,
        eligibleDepartments: deptVal,
        eligibleBranches: deptVal,
        deadline: deadlineVal,
        applicationDeadline: deadlineVal,
        expiryDate: deadlineVal
      }
    };
  }

  static async getApplicationResumeFile(applicationId, caller) {
    if (!applicationId || isNaN(Number(applicationId))) {
      throw { statusCode: 400, message: 'Invalid application ID' };
    }

    const numericAppId = BigInt(applicationId);

    const application = await prisma.application.findUnique({
      where: { id: numericAppId },
      include: {
        job: {
          select: { postedByAlumniId: true }
        },
        student: true
      }
    });

    if (!application || application.deletedAt) {
      throw { statusCode: 404, message: 'Application not found' };
    }

    // Authorization checks
    if (caller.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: BigInt(caller.userId) } });
      if (!student || application.studentId !== student.id) {
        throw { statusCode: 403, message: 'Forbidden' };
      }
    } else if (caller.role === 'ALUMNI') {
      const alumni = await prisma.alumni.findUnique({ where: { userId: BigInt(caller.userId) } });
      if (!alumni || application.job?.postedByAlumniId !== alumni.id) {
        throw { statusCode: 403, message: 'Forbidden' };
      }
    } else if (caller.role !== 'ADMIN' && caller.role !== 'SUPER_ADMIN') {
      throw { statusCode: 403, message: 'Forbidden' };
    }

    const student = application.student;

    const resumeRecord = await prisma.resume.findFirst({
      where: { studentId: student.id, deletedAt: null },
      orderBy: { uploadedAt: 'desc' }
    });

    if (!resumeRecord) {
      throw { statusCode: 404, message: 'Student has not uploaded a resume.' };
    }

    const { resolveResumeFilePath } = require('../utils/file.utils');
    const physicalPath = resolveResumeFilePath(resumeRecord.filePath);

    if (!physicalPath) {
      throw { statusCode: 404, message: 'Resume file is missing from storage. Please ask the student to re-upload the resume.' };
    }

    const mimeType = resumeRecord.fileType || 'application/pdf';
    const fileName = resumeRecord.fileName || `${student.rollNumber || 'Student'}_Resume.pdf`;

    return {
      filePath: physicalPath,
      fileName,
      mimeType
    };
  }
}

module.exports = ApplicationService;
