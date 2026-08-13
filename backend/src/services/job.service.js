const path = require('path');
const fs = require('fs');
const prisma = require('../config/db');
const env = require('../config/env');

// Ensure job image directory exists
const jobImageDirs = ['job-logos'];
jobImageDirs.forEach((dir) => {
  const fullPath = path.join(env.uploadDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

class JobService {
  static async getApprovedJobs(filters = {}) {
    const { search } = filters;

    const where = {
      status: 'APPROVED',
      deletedAt: null,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const jobs = await prisma.job.findMany({
      where,
      include: {
        _count: { select: { applications: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return jobs.map((job) => ({
      id: Number(job.id),
      title: job.title || '',
      companyName: job.companyName || '',
      company: job.companyName || '',
      description: job.description || '',
      location: job.location || '',
      jobType: job.jobType || '',
      salaryPackage: job.salaryPackage || '',
      packageDetails: job.salaryPackage || '',
      experienceRequired: job.experienceRequired || '',
      requiredCgpa: job.requiredCgpa != null ? job.requiredCgpa : null,
      minCgpa: job.requiredCgpa != null ? job.requiredCgpa : null,
      minimumCgpa: job.requiredCgpa != null ? job.requiredCgpa : null,
      eligibleSemester: job.eligibleSemester != null ? job.eligibleSemester : null,
      maxBacklogs: job.maxBacklogs != null ? job.maxBacklogs : null,
      activeBacklogsAllowed: job.maxBacklogs != null ? job.maxBacklogs : null,
      eligibleDepartments: job.eligibleDepartments || '',
      eligibleBranches: job.eligibleDepartments || '',
      status: job.status || 'APPROVED',
      applicationDeadline: job.applicationDeadline || null,
      expiryDate: job.applicationDeadline || null,
      openings: job.openings || null,
      imageUrl: job.imageUrl || null,
      companyLogoUrl: job.imageUrl || null,
      rejectionReason: job.rejectionReason || null,
      enableScreening: job.enableScreening ?? false,
      useDefaultScreening: job.useDefaultScreening ?? true,
      applicationCount: job._count.applications,
      createdAt: job.createdAt || null
    }));
  }

  static async getOpenJobs(filters = {}) {
    const { search } = filters;
    const now = new Date();

    const where = {
      status: 'APPROVED',
      deletedAt: null,
      OR: [
        { applicationDeadline: null },
        { applicationDeadline: { gte: now } }
      ],
      ...(search && {
        AND: [
          {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { companyName: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } }
            ]
          }
        ]
      })
    };

    const jobs = await prisma.job.findMany({
      where,
      include: {
        _count: { select: { applications: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return jobs.map((job) => ({
      id: Number(job.id),
      title: job.title || '',
      companyName: job.companyName || '',
      company: job.companyName || '',
      description: job.description || '',
      location: job.location || '',
      jobType: job.jobType || '',
      salaryPackage: job.salaryPackage || '',
      packageDetails: job.salaryPackage || '',
      experienceRequired: job.experienceRequired || '',
      requiredSkills: job.requiredSkills || '',
      requiredCgpa: job.requiredCgpa || null,
      minCgpa: job.requiredCgpa || null,
      eligibleSemester: job.eligibleSemester || null,
      maxBacklogs: job.maxBacklogs || null,
      eligibleDepartments: job.eligibleDepartments || '',
      status: job.status || 'APPROVED',
      applicationDeadline: job.applicationDeadline || null,
      expiryDate: job.applicationDeadline || null,
      openings: job.openings || null,
      imageUrl: job.imageUrl || null,
      companyLogoUrl: job.imageUrl || null,
      rejectionReason: job.rejectionReason || null,
      enableScreening: job.enableScreening ?? false,
      useDefaultScreening: job.useDefaultScreening ?? true,
      applicationCount: job._count.applications,
      createdAt: job.createdAt || null
    }));
  }

  static async getClosedJobs(filters = {}) {
    const now = new Date();

    const where = {
      deletedAt: null,
      OR: [
        { status: 'EXPIRED' },
        { applicationDeadline: { lt: now } }
      ]
    };

    const jobs = await prisma.job.findMany({
      where,
      include: {
        _count: { select: { applications: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return jobs.map((job) => ({
      id: Number(job.id),
      title: job.title || '',
      companyName: job.companyName || '',
      company: job.companyName || '',
      description: job.description || '',
      location: job.location || '',
      jobType: job.jobType || '',
      salaryPackage: job.salaryPackage || '',
      packageDetails: job.salaryPackage || '',
      experienceRequired: job.experienceRequired || '',
      requiredSkills: job.requiredSkills || '',
      requiredCgpa: job.requiredCgpa || null,
      minCgpa: job.requiredCgpa || null,
      eligibleSemester: job.eligibleSemester || null,
      maxBacklogs: job.maxBacklogs || null,
      eligibleDepartments: job.eligibleDepartments || '',
      status: 'CLOSED',
      applicationDeadline: job.applicationDeadline || null,
      expiryDate: job.applicationDeadline || null,
      openings: job.openings || null,
      imageUrl: job.imageUrl || null,
      companyLogoUrl: job.imageUrl || null,
      rejectionReason: job.rejectionReason || null,
      enableScreening: job.enableScreening ?? false,
      useDefaultScreening: job.useDefaultScreening ?? true,
      applicationCount: job._count.applications,
      createdAt: job.createdAt || null
    }));
  }

  static async getJobStatistics(jobId) {
    const job = await prisma.job.findUnique({
      where: { id: BigInt(jobId) }
    });

    if (!job || job.deletedAt) {
      throw { statusCode: 404, message: 'Job posting not found' };
    }

    const applications = await prisma.application.findMany({
      where: { jobId: BigInt(jobId), deletedAt: null },
      select: { status: true }
    });

    let total = applications.length;
    let pending = 0;
    let shortlisted = 0;
    let selected = 0;
    let rejected = 0;

    applications.forEach((app) => {
      const s = (app.status || '').toUpperCase();
      if (s === 'APPLIED' || s === 'UNDER_REVIEW') {
        pending++;
      } else if (s === 'SHORTLISTED' || s === 'INTERVIEW_SCHEDULED') {
        shortlisted++;
      } else if (s === 'SELECTED' || s === 'ACCEPTED' || s === 'OFFERED' || s === 'OFFER_RELEASED') {
        selected++;
      } else if (s === 'REJECTED') {
        rejected++;
      }
    });

    const activeStudents = await prisma.student.findMany({
      where: { deletedAt: null },
      select: { cgpa: true, backlogs: true, semester: true, department: true }
    });

    const eligible = activeStudents.filter((student) => {
      if (job.requiredCgpa != null && (student.cgpa == null || Number(student.cgpa) < Number(job.requiredCgpa))) return false;
      if (job.maxBacklogs != null && (student.backlogs == null || Number(student.backlogs) > Number(job.maxBacklogs))) return false;
      if (job.eligibleSemester != null && (student.semester == null || Number(student.semester) < Number(job.eligibleSemester))) return false;
      if (job.eligibleDepartments && job.eligibleDepartments.trim() !== '') {
        if (!student.department) return false;
        const validDepts = job.eligibleDepartments.split(',').map((d) => d.trim().toUpperCase());
        if (!validDepts.includes(String(student.department).toUpperCase())) return false;
      }
      return true;
    }).length;

    const totalOpenings = job.openings ? Number(job.openings) : 0;
    const remainingOpenings = Math.max(0, totalOpenings - selected);

    return {
      jobId: Number(job.id),
      total,
      totalApplications: total,
      eligible,
      eligibleStudents: eligible,
      pending,
      pendingReview: pending,
      shortlisted,
      shortlistedStudents: shortlisted,
      selected,
      selectedStudents: selected,
      rejected,
      totalOpenings,
      remainingOpenings
    };
  }

  static async getAllJobs(filters = {}) {
    const { search, status, department } = filters;

    const where = {
      deletedAt: null,
      ...(status && { status: status.toUpperCase() }),
      ...(department && { eligibleDepartments: { contains: department, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const jobs = await prisma.job.findMany({
      where,
      include: {
        postedByAlumni: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } }
        },
        _count: { select: { applications: true } }
      },
      orderBy: { id: 'desc' }
    });

    return jobs.map((job) => ({
      id: Number(job.id),
      title: job.title || '',
      companyName: job.companyName || '',
      company: job.companyName || '',
      description: job.description || '',
      location: job.location || '',
      jobType: job.jobType || '',
      salaryPackage: job.salaryPackage || '',
      packageDetails: job.salaryPackage || '',
      experienceRequired: job.experienceRequired || '',
      requiredSkills: job.requiredSkills || '',
      requiredCgpa: job.requiredCgpa || null,
      minCgpa: job.requiredCgpa || null,
      eligibleSemester: job.eligibleSemester || null,
      maxBacklogs: job.maxBacklogs || null,
      eligibleDepartments: job.eligibleDepartments || '',
      status: job.status || 'PENDING',
      applicationDeadline: job.applicationDeadline || null,
      expiryDate: job.applicationDeadline || null,
      openings: job.openings || null,
      imageUrl: job.imageUrl || null,
      companyLogoUrl: job.imageUrl || null,
      rejectionReason: job.rejectionReason || null,
      enableScreening: job.enableScreening ?? false,
      useDefaultScreening: job.useDefaultScreening ?? true,
      postedBy: job.postedByAlumni?.user?.name || 'Admin',
      postedById: job.postedByAlumni?.user?.id ? Number(job.postedByAlumni.user.id) : null,
      postedByRole: job.postedByAlumni?.user?.role || 'ADMIN',
      applicationCount: job._count.applications,
      createdAt: job.createdAt || null
    }));
  }

  static async getJobById(jobIdParam) {
    let jobId;
    try {
      jobId = BigInt(jobIdParam);
    } catch (e) {
      throw { statusCode: 400, message: 'Invalid job ID format' };
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        postedByAlumni: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } }
        },
        _count: { select: { applications: true } }
      }
    });

    if (!job || job.deletedAt) {
      throw { statusCode: 404, message: 'Job not found' };
    }

    const posterName = job.postedByAlumni?.user?.name || (job.postedByAlumniId ? null : 'Placement Administration');
    const posterRole = job.postedByAlumni ? 'ALUMNI' : (job.postedByAlumniId ? 'UNKNOWN' : 'ADMIN');
    const posterType = job.postedByAlumni ? 'Alumni' : (job.postedByAlumniId ? null : 'Admin');

    return {
      id: Number(job.id),
      title: job.title || '',
      companyName: job.companyName || '',
      company: job.companyName || '',
      description: job.description || '',
      location: job.location || '',
      jobType: job.jobType || '',
      salaryPackage: job.salaryPackage || '',
      packageDetails: job.salaryPackage || '',
      experienceRequired: job.experienceRequired || '',
      requiredCgpa: job.requiredCgpa != null ? job.requiredCgpa : null,
      minCgpa: job.requiredCgpa != null ? job.requiredCgpa : null,
      minimumCgpa: job.requiredCgpa != null ? job.requiredCgpa : null,
      eligibleSemester: job.eligibleSemester != null ? job.eligibleSemester : null,
      maxBacklogs: job.maxBacklogs != null ? job.maxBacklogs : null,
      activeBacklogsAllowed: job.maxBacklogs != null ? job.maxBacklogs : null,
      eligibleDepartments: job.eligibleDepartments || '',
      eligibleBranches: job.eligibleDepartments || '',
      status: job.status || 'PENDING',
      applicationDeadline: job.applicationDeadline || null,
      expiryDate: job.applicationDeadline || null,
      openings: job.openings || null,
      imageUrl: job.imageUrl || null,
      companyLogoUrl: job.imageUrl || null,
      rejectionReason: job.rejectionReason || null,
      enableScreening: job.enableScreening ?? false,
      useDefaultScreening: job.useDefaultScreening ?? true,
      postedBy: {
        id: job.postedByAlumni?.user?.id ? Number(job.postedByAlumni.user.id) : null,
        name: posterName,
        role: posterRole,
        type: posterType
      },
      postedByName: posterName,
      postedByType: posterType,
      postedByRole: posterRole,
      postedById: job.postedByAlumni?.user?.id ? Number(job.postedByAlumni.user.id) : null,
      applicationCount: job._count.applications,
      createdAt: job.createdAt || null
    };
  }

  static async getStudentJobDetails(userId, jobIdParam) {
    if (!jobIdParam || isNaN(Number(jobIdParam))) {
      throw { statusCode: 400, message: 'Invalid job ID.' };
    }

    const jobId = BigInt(jobIdParam);

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        postedByAlumni: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } }
        },
        _count: { select: { applications: true } }
      }
    });

    if (!job || job.deletedAt) {
      throw { statusCode: 404, message: 'Job not found.' };
    }

    const statusUpper = (job.status || '').toUpperCase();
    if (statusUpper === 'PENDING' || statusUpper === 'REJECTED') {
      throw { statusCode: 404, message: 'Job not found or not available.' };
    }

    let hasApplied = false;
    let applicationStatus = null;

    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (student) {
      const existingApp = await prisma.application.findFirst({
        where: {
          jobId: job.id,
          studentId: student.id,
          deletedAt: null
        }
      });
      if (existingApp) {
        hasApplied = true;
        applicationStatus = existingApp.status;
      }
    }

    let skillMatchPercentage = 100;
    let matchedSkills = [];
    let missingSkills = [];
    let isEligible = true;
    let eligibilityDetails = null;

    try {
      const EligibilityService = require('./eligibility.service');
      const eligibility = await EligibilityService.validateEligibility(userId, Number(job.id));
      isEligible = eligibility.isEligible;
      eligibilityDetails = eligibility;
      if (eligibility.skillMatch) {
        skillMatchPercentage = eligibility.skillMatch.skillMatchPercentage ?? 100;
        matchedSkills = eligibility.skillMatch.matchedSkills || [];
        missingSkills = eligibility.skillMatch.missingSkills || [];
      }
    } catch (e) {
      // Safe fallback if student profile or eligibility check fails
    }

    const posterName = job.postedByAlumni?.user?.name || (job.postedByAlumniId ? null : 'Placement Administration');
    const posterRole = job.postedByAlumni ? 'ALUMNI' : (job.postedByAlumniId ? 'UNKNOWN' : 'ADMIN');
    const posterType = job.postedByAlumni ? 'Alumni' : (job.postedByAlumniId ? null : 'Admin');

    return {
      id: Number(job.id),
      title: job.title || '',
      companyName: job.companyName || '',
      company: job.companyName || '',
      description: job.description || '',
      location: job.location || '',
      jobType: job.jobType || '',
      salaryPackage: job.salaryPackage || '',
      packageDetails: job.salaryPackage || '',
      experienceRequired: job.experienceRequired || '',
      requiredSkills: job.requiredSkills || '',
      requiredSkillsList: job.requiredSkills ? job.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      requiredCgpa: job.requiredCgpa || null,
      minCgpa: job.requiredCgpa || null,
      eligibleSemester: job.eligibleSemester || null,
      maxBacklogs: job.maxBacklogs || null,
      eligibleDepartments: job.eligibleDepartments || '',
      status: job.status || 'APPROVED',
      applicationDeadline: job.applicationDeadline || null,
      expiryDate: job.applicationDeadline || null,
      openings: job.openings || null,
      imageUrl: job.imageUrl || null,
      companyLogoUrl: job.imageUrl || null,
      rejectionReason: job.rejectionReason || null,
      enableScreening: job.enableScreening ?? false,
      useDefaultScreening: job.useDefaultScreening ?? true,
      postedBy: {
        id: job.postedByAlumni?.user?.id ? Number(job.postedByAlumni.user.id) : null,
        name: posterName,
        role: posterRole,
        type: posterType
      },
      postedByName: posterName,
      postedByType: posterType,
      postedByRole: posterRole,
      postedById: job.postedByAlumni?.user?.id ? Number(job.postedByAlumni.user.id) : null,
      applicationCount: job._count.applications,
      hasApplied,
      applicationStatus,
      skillMatchPercentage,
      matchedSkills,
      missingSkills,
      isEligible,
      eligibilityDetails,
      createdAt: job.createdAt || null
    };
  }

  /**
   * Create a job — called from POST /api/jobs/post
   * Supports ALUMNI (must be VERIFIED) and ADMIN roles.
   * Maps frontend field names to DB/Prisma field names:
   *   company       → companyName
   *   packageDetails→ salaryPackage
   *   expiryDate    → applicationDeadline
   *   minCgpa       → requiredCgpa
   */
  static async createJob(userId, userRole, jobData, files = {}) {
    let postedByAlumniId = null;

    if (userRole === 'ALUMNI') {
      const alumni = await prisma.alumni.findUnique({
        where: { userId: BigInt(userId) }
      });

      if (!alumni) {
        throw { statusCode: 404, message: 'Alumni profile not found. Please complete your profile first.' };
      }

      if (alumni.verificationStatus !== 'VERIFIED') {
        throw {
          statusCode: 403,
          message: 'Your alumni account must be verified by an Admin before you can post jobs.'
        };
      }

      postedByAlumniId = alumni.id;
    }

    // Map frontend field names → Prisma model field names
    let {
      title,
      company,            // frontend sends "company" → DB column "company" (Prisma field "companyName")
      companyName,        // fallback if companyName is sent directly
      location,
      jobType,
      packageDetails,     // frontend sends "packageDetails" → DB column "package_details" (Prisma "salaryPackage")
      salaryPackage,      // fallback
      experienceRequired,
      applicationLink,
      description,
      requiredSkills,
      requiredSkillsList, // array or string from input
      expiryDate,         // frontend sends "expiryDate" → DB column "expiry_date" (Prisma "applicationDeadline")
      applicationDeadline, // fallback
      minCgpa,            // frontend sends "minCgpa" → DB column "min_cgpa" (Prisma "requiredCgpa")
      requiredCgpa,       // fallback
      eligibleSemester,
      maxBacklogs,
      industry,
      companySize,
      openings,
      enableScreening,
      useDefaultScreening,
      eligibleDepartments
    } = jobData;

    const resolvedCompanyName = (company || companyName || '').trim();
    const resolvedTitle = (title || '').trim();

    if (!resolvedTitle) {
      throw { statusCode: 400, message: 'Job title is required.' };
    }
    if (!resolvedCompanyName) {
      throw { statusCode: 400, message: 'Company name is required.' };
    }

    // Parse requiredSkillsList if passed as JSON string in FormData
    if (typeof requiredSkillsList === 'string') {
      try {
        const parsed = JSON.parse(requiredSkillsList);
        if (Array.isArray(parsed)) requiredSkillsList = parsed;
      } catch {
        requiredSkillsList = requiredSkillsList.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    // Build skills string from array (requiredSkillsList) or plain string (requiredSkills) preserving order with unique values
    let skillsArray = [];
    if (Array.isArray(requiredSkillsList) && requiredSkillsList.length > 0) {
      skillsArray = requiredSkillsList.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof requiredSkills === 'string' && requiredSkills.trim()) {
      skillsArray = requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    }
    const uniqueSkills = [...new Set(skillsArray)];
    const skillsString = uniqueSkills.join(', ');

    const resolvedSalaryPackage = packageDetails || salaryPackage || null;
    const resolvedDeadline = expiryDate || applicationDeadline || null;
    const resolvedCgpa = minCgpa || requiredCgpa || null;

    // Process logo file if provided in files
    let logoUrl = null;
    const logoFile = files?.companyLogo?.[0] || (files?.fieldname === 'companyLogo' ? files : null);
    if (logoFile) {
      const targetDir = path.join(env.uploadDir, 'job-logos');
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      const ext = path.extname(logoFile.originalname) || '.png';
      const newFilename = `logo-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const newFilePath = path.join(targetDir, newFilename);
      fs.renameSync(logoFile.path, newFilePath);
      logoUrl = `/uploads/job-logos/${newFilename}`;
    }

    const isEnableScreening = enableScreening === true || enableScreening === 'true';
    const isUseDefaultScreening = useDefaultScreening === undefined ? true : (useDefaultScreening === true || useDefaultScreening === 'true');

    const newJob = await prisma.job.create({
      data: {
        title: resolvedTitle,
        companyName: resolvedCompanyName,
        description: description ? description.trim() : null,
        location: location ? location.trim() : null,
        jobType: jobType || null,
        salaryPackage: resolvedSalaryPackage ? String(resolvedSalaryPackage).trim() : null,
        experienceRequired: experienceRequired ? String(experienceRequired).trim() : null,
        applicationLink: applicationLink ? applicationLink.trim() : null,
        requiredSkills: skillsString ? skillsString.trim() : null,
        requiredCgpa: resolvedCgpa ? parseFloat(resolvedCgpa) : null,
        eligibleSemester: eligibleSemester !== undefined && eligibleSemester !== '' ? parseInt(eligibleSemester, 10) : null,
        maxBacklogs: maxBacklogs !== undefined && maxBacklogs !== '' ? parseInt(maxBacklogs, 10) : null,
        industry: industry ? industry.trim() : null,
        companySize: companySize ? companySize.trim() : null,
        openings: openings !== undefined && openings !== '' ? parseInt(openings, 10) : null,
        eligibleDepartments: Array.isArray(eligibleDepartments)
          ? eligibleDepartments.join(',')
          : (eligibleDepartments || null),
        applicationDeadline: resolvedDeadline ? new Date(resolvedDeadline) : null,
        imageUrl: logoUrl,
        enableScreening: isEnableScreening,
        useDefaultScreening: isUseDefaultScreening,
        postedByAlumniId: postedByAlumniId,
        status: 'PENDING'
      }
    });

    return {
      id: Number(newJob.id),
      title: newJob.title,
      companyName: newJob.companyName,
      company: newJob.companyName,
      status: newJob.status,
      imageUrl: newJob.imageUrl,
      companyLogoUrl: newJob.imageUrl,
      createdAt: newJob.createdAt,
      message: userRole === 'ALUMNI'
        ? 'Job submitted for admin approval.'
        : 'Job posted successfully.'
    };
  }

  /**
   * Get jobs posted by the authenticated user.
   *   ALUMNI → their own posted jobs
   *   ADMIN  → all jobs
   */
  static async getMyJobs(userId, userRole) {
    if (userRole === 'ADMIN') {
      return JobService.getAllJobs({});
    }

    const alumni = await prisma.alumni.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!alumni) {
      throw { statusCode: 404, message: 'Alumni profile not found' };
    }

    const jobs = await prisma.job.findMany({
      where: { postedByAlumniId: alumni.id, deletedAt: null },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return jobs.map((job) => ({
      id: Number(job.id),
      title: job.title || '',
      companyName: job.companyName || '',
      company: job.companyName || '',
      description: job.description || '',
      location: job.location || '',
      jobType: job.jobType || '',
      salaryPackage: job.salaryPackage || '',
      packageDetails: job.salaryPackage || '',
      requiredSkills: job.requiredSkills || '',
      requiredCgpa: job.requiredCgpa || null,
      minCgpa: job.requiredCgpa || null,
      eligibleSemester: job.eligibleSemester || null,
      maxBacklogs: job.maxBacklogs || null,
      eligibleDepartments: job.eligibleDepartments || '',
      status: job.status || 'PENDING',
      applicationDeadline: job.applicationDeadline || null,
      expiryDate: job.applicationDeadline || null,
      openings: job.openings || null,
      imageUrl: job.imageUrl || null,
      companyLogoUrl: job.imageUrl || null,
      rejectionReason: job.rejectionReason || null,
      enableScreening: job.enableScreening ?? false,
      useDefaultScreening: job.useDefaultScreening ?? true,
      applicationCount: job._count.applications,
      createdAt: job.createdAt || null
    }));
  }

  /**
   * Save a job logo image file and update the DB record.
   */
  static async saveJobImage(jobIdParam, file, type = 'logo') {
    let jobId;
    try {
      jobId = BigInt(jobIdParam);
    } catch (e) {
      throw { statusCode: 400, message: 'Invalid job ID format' };
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.deletedAt) {
      throw { statusCode: 404, message: 'Job not found' };
    }

    const subDir = 'job-logos';
    const targetDir = path.join(env.uploadDir, subDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = path.extname(file.originalname);
    const newFilename = `logo-${jobIdParam}-${Date.now()}${ext}`;
    const newFilePath = path.join(targetDir, newFilename);

    fs.renameSync(file.path, newFilePath);

    const fileUrl = `/uploads/${subDir}/${newFilename}`;
    await prisma.job.update({ where: { id: jobId }, data: { imageUrl: fileUrl } });

    return fileUrl;
  }

  /**
   * Update a job.
   * ALUMNI can only update their own jobs.
   * ADMIN can update any job.
   * Maps frontend field names to Prisma field names.
   */
  static async updateJob(jobIdParam, userId, userRole, jobData) {
    let jobId;
    try {
      jobId = BigInt(jobIdParam);
    } catch (e) {
      throw { statusCode: 400, message: 'Invalid job ID format' };
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.deletedAt) {
      throw { statusCode: 404, message: 'Job not found' };
    }

    // Ownership check for alumni
    if (userRole === 'ALUMNI') {
      const alumni = await prisma.alumni.findUnique({ where: { userId: BigInt(userId) } });
      if (!alumni || job.postedByAlumniId !== alumni.id) {
        throw { statusCode: 403, message: 'You do not have permission to edit this job' };
      }
    }

    const {
      title,
      company,
      companyName,
      location,
      jobType,
      packageDetails,
      salaryPackage,
      experienceRequired,
      applicationLink,
      description,
      requiredSkills,
      requiredSkillsList,
      expiryDate,
      applicationDeadline,
      minCgpa,
      requiredCgpa,
      eligibleSemester,
      maxBacklogs,
      industry,
      companySize,
      openings,
      enableScreening,
      useDefaultScreening,
      eligibleDepartments
    } = jobData;

    let skillsArray = [];
    if (Array.isArray(requiredSkillsList) && requiredSkillsList.length > 0) {
      skillsArray = requiredSkillsList.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof requiredSkills === 'string' && requiredSkills.trim()) {
      skillsArray = requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    }
    const uniqueSkills = [...new Set(skillsArray)];
    const skillsString = uniqueSkills.length > 0 ? uniqueSkills.join(', ') : (requiredSkills || null);

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...((company || companyName) !== undefined && { companyName: (company || companyName || '').trim() }),
        ...(description !== undefined && { description: description ? description.trim() : null }),
        ...(location !== undefined && { location: location ? location.trim() : null }),
        ...(jobType !== undefined && { jobType }),
        ...((packageDetails || salaryPackage) !== undefined && {
          salaryPackage: packageDetails || salaryPackage ? String(packageDetails || salaryPackage).trim() : null
        }),
        ...(experienceRequired !== undefined && { experienceRequired: experienceRequired ? String(experienceRequired).trim() : null }),
        ...(applicationLink !== undefined && { applicationLink: applicationLink ? applicationLink.trim() : null }),
        ...(skillsString !== undefined && { requiredSkills: skillsString ? skillsString.trim() : null }),
        ...((minCgpa || requiredCgpa) !== undefined && {
          requiredCgpa: (minCgpa || requiredCgpa) ? parseFloat(minCgpa || requiredCgpa) : null
        }),
        ...(eligibleSemester !== undefined && {
          eligibleSemester: eligibleSemester !== '' ? parseInt(eligibleSemester, 10) : null
        }),
        ...(maxBacklogs !== undefined && {
          maxBacklogs: maxBacklogs !== '' ? parseInt(maxBacklogs, 10) : null
        }),
        ...(industry !== undefined && { industry: industry ? industry.trim() : null }),
        ...(companySize !== undefined && { companySize: companySize ? companySize.trim() : null }),
        ...(openings !== undefined && {
          openings: openings !== '' ? parseInt(openings, 10) : null
        }),
        ...(eligibleDepartments !== undefined && {
          eligibleDepartments: Array.isArray(eligibleDepartments)
            ? eligibleDepartments.join(',')
            : (eligibleDepartments || null)
        }),
        ...((expiryDate || applicationDeadline) !== undefined && {
          applicationDeadline: (expiryDate || applicationDeadline) ? new Date(expiryDate || applicationDeadline) : null
        }),
        ...(enableScreening !== undefined && { enableScreening }),
        ...(useDefaultScreening !== undefined && { useDefaultScreening })
      }
    });

    return {
      id: Number(updated.id),
      title: updated.title,
      companyName: updated.companyName,
      status: updated.status,
      message: 'Job updated successfully.'
    };
  }

  /**
   * Soft-delete a job.
   * ALUMNI can only delete their own jobs.
   * ADMIN can delete any job.
   */
  static async deleteJob(jobIdParam, userId, userRole) {
    let jobId;
    try {
      jobId = BigInt(jobIdParam);
    } catch (e) {
      throw { statusCode: 400, message: 'Invalid job ID format' };
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.deletedAt) {
      throw { statusCode: 404, message: 'Job not found' };
    }

    if (userRole === 'ALUMNI') {
      const alumni = await prisma.alumni.findUnique({ where: { userId: BigInt(userId) } });
      if (!alumni || job.postedByAlumniId !== alumni.id) {
        throw { statusCode: 403, message: 'You do not have permission to delete this job' };
      }
    }

    await prisma.job.update({ where: { id: jobId }, data: { deletedAt: new Date() } });
  }

  /**
   * Update a job's status (admin moderation: APPROVED / REJECTED / EXPIRED).
   */
  static async updateJobStatus(jobIdParam, status, reason) {
    let jobId;
    try {
      jobId = BigInt(jobIdParam);
    } catch (e) {
      throw { statusCode: 400, message: 'Invalid job ID format' };
    }

    if (!status) {
      throw { statusCode: 400, message: 'Status is required' };
    }

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'];
    const normalizedStatus = status.toUpperCase();
    if (!validStatuses.includes(normalizedStatus)) {
      throw { statusCode: 400, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.deletedAt) {
      throw { statusCode: 404, message: 'Job not found' };
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: normalizedStatus,
        ...(reason !== undefined && { rejectionReason: reason || null })
      }
    });

    return {
      id: Number(updated.id),
      title: updated.title,
      status: updated.status,
      rejectionReason: updated.rejectionReason,
      message: `Job status updated to ${normalizedStatus}.`
    };
  }
}

module.exports = JobService;
