const prisma = require('../config/db');
const AccessControlService = require('./accessControl.service');

class AdminService {
  static async getStats(accessScope) {
    const studentWhere = { deletedAt: null, ...AccessControlService.getDepartmentFilter(accessScope) };
    const alumniWhere = { deletedAt: null, ...AccessControlService.getDepartmentFilter(accessScope) };
    const appWhere = { deletedAt: null };
    if (accessScope && accessScope.type === 'DEPARTMENT') {
      appWhere.student = AccessControlService.getDepartmentFilter(accessScope);
    }
    const totalStudents = await prisma.student.count({ where: studentWhere });
    const totalVerifiedStudents = await prisma.student.count({ where: { ...studentWhere, verificationStatus: 'VERIFIED' } });
    const totalAlumni = await prisma.alumni.count({ where: alumniWhere });
    const totalVerifiedAlumni = await prisma.alumni.count({ where: { ...alumniWhere, verificationStatus: 'VERIFIED' } });
    const totalJobs = await prisma.job.count({ where: { deletedAt: null, ...AccessControlService.getJobDepartmentFilter(accessScope) } });
    const totalApplications = await prisma.application.count({ where: appWhere });
    const shortlisted = await prisma.application.count({ where: { ...appWhere, status: 'SHORTLISTED' } });
    const selected = await prisma.application.count({ where: { ...appWhere, status: 'SELECTED' } });
    const activeJobs = await prisma.job.count({ where: { status: 'APPROVED', deletedAt: null, ...AccessControlService.getJobDepartmentFilter(accessScope) } });

    const pendingStudentVerifications = await prisma.student.count({ where: { ...studentWhere, verificationStatus: 'PENDING' } });
    const pendingAlumniVerifications = await prisma.alumni.count({ where: { ...alumniWhere, verificationStatus: 'PENDING' } });
    const pendingVerifications = pendingStudentVerifications + pendingAlumniVerifications;

    let resumeWhere = { deletedAt: null };
    if (accessScope && accessScope.type === 'DEPARTMENT') {
      resumeWhere.student = AccessControlService.getDepartmentFilter(accessScope);
    }
    const resumesUploaded = await prisma.resume.count({ where: resumeWhere });

    const verifiedStudentsWithResume = await prisma.student.findMany({
      where: { ...studentWhere, verificationStatus: 'VERIFIED', cgpa: { gte: 6.5 } },
      include: { resumes: { where: { deletedAt: null } } }
    });
    const placementReady = verifiedStudentsWithResume.filter((s) => s.resumes && s.resumes.length > 0).length;

    return {
      totalStudents,
      totalVerifiedStudents,
      totalAlumni,
      totalVerifiedAlumni,
      totalJobs,
      totalApplications,
      shortlisted,
      selected,
      activeJobs,
      pendingVerifications,
      resumesUploaded,
      placementReady
    };
  }

  static async getDashboardMetrics(accessScope) {
    return this.getStats(accessScope);
  }

  static async getAdminProfile(userIdOrEmail) {
    let user = null;
    if (typeof userIdOrEmail === 'string' && userIdOrEmail.includes('@')) {
      user = await prisma.user.findUnique({
        where: { email: userIdOrEmail },
        include: { adminProfile: true }
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id: BigInt(userIdOrEmail) },
        include: { adminProfile: true }
      });
    }

    if (!user) {
      throw { statusCode: 404, message: 'Admin user not found' };
    }

    const p = user.adminProfile || {};

    return {
      id: Number(user.id),
      name: user.name || '',
      email: user.email || '',
      mobileNumber: p.mobileNumber || '',
      location: p.location || '',
      gender: p.gender || '',
      department: p.department || 'Administration',
      designation: p.designation || 'System Admin',
      employeeId: p.employeeId || '',
      officeLocation: p.officeLocation || '',
      profileImageUrl: p.profileImageUrl,
      role: user.role || 'ADMIN',
      status: user.accountStatus || 'ACTIVE',
      accountCreatedDate: user.createdAt ? user.createdAt.toISOString() : null
    };
  }

  static async updateAdminProfile(userIdOrEmail, updateData) {
    let user = null;
    if (typeof userIdOrEmail === 'string' && userIdOrEmail.includes('@')) {
      user = await prisma.user.findUnique({ where: { email: userIdOrEmail } });
    } else {
      user = await prisma.user.findUnique({ where: { id: BigInt(userIdOrEmail) } });
    }

    if (!user) {
      throw { statusCode: 404, message: 'Admin user not found' };
    }

    const { name, mobileNumber, location, gender, department, designation, employeeId, officeLocation, profileImageUrl } = updateData;

    let cleanEmpId = undefined;
    if (employeeId !== undefined) {
      cleanEmpId = employeeId ? String(employeeId).trim() : null;
      if (cleanEmpId === '') cleanEmpId = null;

      if (cleanEmpId !== null) {
        const existingWithEmpId = await prisma.adminProfile.findFirst({
          where: {
            employeeId: cleanEmpId,
            userId: { not: user.id },
            deletedAt: null
          }
        });
        if (existingWithEmpId) {
          throw { statusCode: 400, message: 'Employee ID already exists. Please enter a different Employee ID.' };
        }
      }
    }

    if (name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name }
      });
    }

    await prisma.adminProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        mobileNumber: mobileNumber || null,
        location: location || null,
        gender: gender || null,
        department: department || null,
        designation: designation || null,
        employeeId: cleanEmpId !== undefined ? cleanEmpId : null,
        officeLocation: officeLocation || null,
        ...(profileImageUrl !== undefined && { profileImageUrl })
      },
      update: {
        ...(mobileNumber !== undefined && { mobileNumber }),
        ...(location !== undefined && { location }),
        ...(gender !== undefined && { gender }),
        ...(department !== undefined && { department }),
        ...(designation !== undefined && { designation }),
        ...(cleanEmpId !== undefined && { employeeId: cleanEmpId }),
        ...(officeLocation !== undefined && { officeLocation }),
        ...(profileImageUrl !== undefined && { profileImageUrl })
      }
    });

    return this.getAdminProfile(user.id);
  }

  static async updateAdminProfileImage(userIdOrEmail, imageUrl) {
    let user = null;
    if (typeof userIdOrEmail === 'string' && userIdOrEmail.includes('@')) {
      user = await prisma.user.findUnique({ where: { email: userIdOrEmail } });
    } else {
      user = await prisma.user.findUnique({ where: { id: BigInt(userIdOrEmail) } });
    }

    if (!user) throw { statusCode: 404, message: 'Admin user not found' };

    const now = new Date();

    await prisma.$transaction([
      prisma.adminProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, profileImageUrl: imageUrl },
        update: { profileImageUrl: imageUrl }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: now }
      })
    ]);

    return { 
      success: true, 
      imageUrl: imageUrl, 
      profileImageUrl: imageUrl,
      url: imageUrl,
      updatedAt: now.toISOString() 
    };
  }

  static async deleteAdminProfileImage(userIdOrEmail) {
    let user = null;
    if (typeof userIdOrEmail === 'string' && userIdOrEmail.includes('@')) {
      user = await prisma.user.findUnique({ where: { email: userIdOrEmail } });
    } else {
      user = await prisma.user.findUnique({ where: { id: BigInt(userIdOrEmail) } });
    }

    if (!user) throw { statusCode: 404, message: 'Admin user not found' };

    await prisma.adminProfile.updateMany({
      where: { userId: user.id },
      data: { profileImageUrl: null }
    });

    return { success: true, message: 'Profile image deleted successfully' };
  }

  static async getShortlistedApplications(accessScope) {
    const statuses = ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'OFFER_RELEASED'];
    
    let whereClause = {
      status: { in: statuses },
      deletedAt: null
    };

    if (accessScope && accessScope.type === 'DEPARTMENT') {
      whereClause.student = AccessControlService.getDepartmentFilter(accessScope);
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        job: true,
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    return applications.map((app) => {
      const j = app.job || {};
      const s = app.student || {};
      const u = s.user || {};

      return {
        id: Number(app.id),
        status: app.status,
        appliedAt: app.appliedAt,
        shortlistedDate: app.appliedAt,
        jobId: j.id ? Number(j.id) : null,
        jobTitle: j.title || '',
        company: j.companyName || j.company || '',
        job: {
          id: j.id ? Number(j.id) : null,
          title: j.title || '',
          company: j.companyName || j.company || ''
        },
        studentId: s.id ? Number(s.id) : null,
        studentName: u.name || '',
        email: u.email || '',
        rollNumber: s.rollNumber || '',
        department: s.department || '',
        section: s.section || '',
        cgpa: s.cgpa || null,
        academicYear: s.academicYear || '',
        mobileNumber: s.mobileNumber || '',
        profileImageUrl: s.profileImageUrl,
        user: {
          id: u.id ? Number(u.id) : null,
          name: u.name || '',
          email: u.email || '',
          studentProfile: {
            id: s.id ? Number(s.id) : null,
            rollNumber: s.rollNumber || '',
            department: s.department || '',
            section: s.section || '',
            cgpa: s.cgpa || null,
            academicYear: s.academicYear || '',
            mobileNumber: s.mobileNumber || '',
            profileImageUrl: s.profileImageUrl
          }
        }
      };
    });
  }

  static async getAllStudents(query = {}, accessScope) {
    try {
      const page = Math.max(parseInt(query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
      const search = (query.search || '').trim();
      const verificationStatus = (query.verificationStatus || '').trim();
      
      let departmentFilter = {};
      if (accessScope && accessScope.type === 'DEPARTMENT') {
        departmentFilter = AccessControlService.getDepartmentFilter(accessScope, 'department');
      } else {
        const department = (query.department || '').trim();
        if (department) {
          departmentFilter = { department: { equals: department, mode: 'insensitive' } };
        }
      }

      const where = {
        deletedAt: null,
        ...departmentFilter,
        ...(verificationStatus && { verificationStatus: { equals: verificationStatus, mode: 'insensitive' } }),
        ...(search && {
          OR: [
            { rollNumber: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } }
          ]
        })
      };

      const totalItems = await prisma.student.count({ where });
      const skip = (page - 1) * limit;

      const students = await prisma.student.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true, accountStatus: true } },
          skills: { where: { deletedAt: null } },
          projects: { where: { deletedAt: null } }
        },
        orderBy: { id: 'desc' },
        skip: query.page || query.limit ? skip : undefined,
        take: query.page || query.limit ? limit : undefined
      });

      const data = students.map((s) => ({
        id: Number(s.id),
        userId: Number(s.userId),
        user: {
          id: Number(s.user?.id || 0),
          name: s.user?.name || '',
          email: s.user?.email || '',
          role: s.user?.role || 'STUDENT',
          accountStatus: s.user?.accountStatus || 'ACTIVE'
        },
        name: s.user?.name || '',
        email: s.user?.email || '',
        rollNumber: s.rollNumber,
        department: s.department,
        mobileNumber: s.mobileNumber,
        location: s.location,
        githubUrl: s.githubUrl,
        linkedinUrl: s.linkedinUrl,
        profileImageUrl: s.profileImageUrl,
        cgpa: s.cgpa,
        backlogs: s.backlogs,
        verificationStatus: s.verificationStatus || 'VERIFIED',
        skillsCount: s.skills.length,
        skills: s.skills.map((sk) => sk.skillName),
        projectsCount: s.projects.length,
        projects: s.projects.map((pr) => ({
          id: Number(pr.id),
          title: pr.title,
          description: pr.description,
          githubLink: pr.sourceUrl,
          liveLink: pr.demoUrl
        })),
        createdAt: s.createdAt
      }));

      const totalPages = Math.ceil(totalItems / limit) || 1;
      const pagination = {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      };

      if (query.page !== undefined || query.limit !== undefined) {
        return { data, pagination };
      }

      data.pagination = pagination;
      return data;
    } catch (err) {
      console.warn('[ADMIN-SERVICE] getAllStudents database error:', err.message);
      return [];
    }
  }

  static async getAlumniDocument(id, accessScope) {
    const alumni = await prisma.alumni.findUnique({
      where: { id: BigInt(id) }
    });

    if (!alumni) {
      throw { statusCode: 404, message: 'Alumni not found' };
    }

    if (accessScope && accessScope.type === 'DEPARTMENT' && !AccessControlService.canAccessDepartment(accessScope, alumni.department)) {
      throw { statusCode: 403, message: 'Forbidden: Cannot access documents of alumni from other departments.' };
    }

    if (!alumni.verificationDocumentUrl) {
      throw { statusCode: 404, message: 'No verification document uploaded.' };
    }

    const { resolveResumeFilePath } = require('../utils/file.utils');
    const isUrl = alumni.verificationDocumentUrl.startsWith('http://') || alumni.verificationDocumentUrl.startsWith('https://');
    let diskPath = alumni.verificationDocumentUrl;

    if (!isUrl) {
      diskPath = resolveResumeFilePath(alumni.verificationDocumentUrl);
      const fs = require('fs');
      if (!diskPath || !fs.existsSync(diskPath)) {
        throw { statusCode: 404, message: 'Verification document is missing from storage. Please request the alumni to upload the document again.' };
      }
    }

    const path = require('path');
    const ext = path.extname(diskPath).toLowerCase();
    
    let mimeType = 'application/octet-stream';
    if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.doc') mimeType = 'application/msword';
    else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    return {
      diskPath,
      mimeType,
      fileName: alumni.verificationDocumentName || `alumni_${id}_document${ext}`
    };
  }

  static async getAllAlumni(query = {}, accessScope) {
    const { sortBy, sortOrder, order, search, verificationStatus } = query;
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
    const direction = (sortOrder || order || '').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let departmentFilter = {};
    if (accessScope && accessScope.type === 'DEPARTMENT') {
      departmentFilter = AccessControlService.getDepartmentFilter(accessScope, 'department');
    } else {
      const department = (query.department || '').trim();
      if (department) {
        departmentFilter = { department: { equals: department, mode: 'insensitive' } };
      }
    }

    const allowedFields = {
      company: { company: direction },
      designation: { designation: direction },
      passingYear: { passingYear: direction },
      verificationStatus: { verificationStatus: direction },
      department: { department: direction },
      rollNumber: { rollNumber: direction },
      mobileNumber: { mobileNumber: direction },
      gender: { gender: direction },
      degree: { degree: direction },
      isActive: { isActive: direction },
      ocrVerified: { ocrVerified: direction },
      name: { user: { name: direction } },
      id: { id: direction }
    };

    const orderByClause = allowedFields[sortBy] || { id: 'desc' };

    const where = {
      deletedAt: null,
      ...departmentFilter,
      ...(verificationStatus && { verificationStatus: { equals: verificationStatus, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { company: { contains: search, mode: 'insensitive' } },
          { designation: { contains: search, mode: 'insensitive' } },
          { rollNumber: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ]
      })
    };

    const totalItems = await prisma.alumni.count({ where });
    const skip = (page - 1) * limit;

    const alumniList = await prisma.alumni.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: orderByClause,
      skip: query.page || query.limit ? skip : undefined,
      take: query.page || query.limit ? limit : undefined
    });

    const data = alumniList.map((a) => ({
      id: Number(a.id),
      userId: Number(a.userId),
      name: a.user?.name || '',
      email: a.user?.email || '',
      company: a.company,
      designation: a.designation,
      passingYear: a.passingYear,
      verificationStatus: a.verificationStatus,
      profileImageUrl: a.profileImageUrl,
      department: a.department,
      rollNumber: a.rollNumber,
      mobileNumber: a.mobileNumber,
      user: a.user ? { name: a.user.name, email: a.user.email } : null
    }));

    const totalPages = Math.ceil(totalItems / limit) || 1;
    const pagination = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };

    if (query.page !== undefined || query.limit !== undefined) {
      return { data, pagination };
    }

    data.pagination = pagination;
    return data;
  }

  static async verifyAlumni(alumniId, status, accessScope) {
    const validStatuses = ['VERIFIED', 'REJECTED', 'NEEDS_CORRECTION'];
    if (!validStatuses.includes(status)) {
      throw { statusCode: 400, message: 'Invalid verification status' };
    }

    const alumni = await prisma.alumni.findUnique({
      where: { id: BigInt(alumniId) }
    });

    if (!alumni) {
      throw { statusCode: 404, message: 'Alumni account not found.' };
    }
    
    if (accessScope && accessScope.type === 'DEPARTMENT' && !AccessControlService.canAccessDepartment(accessScope, alumni.department)) {
      throw { statusCode: 403, message: 'Forbidden: Cannot verify alumni from other departments.' };
    }

    const updated = await prisma.alumni.update({
      where: { id: BigInt(alumniId) },
      data: { 
        verificationStatus: status,
        manualReviewRequired: false
      }
    });

    const actionText = status === 'VERIFIED' ? 'approved' : status === 'REJECTED' ? 'rejected' : 'updated';
    return { success: true, message: `Alumni ${actionText} successfully.`, alumni: updated };
  }

  static async getAllJobs() {
    const jobs = await prisma.job.findMany({
      where: { deletedAt: null },
      include: {
        postedByAlumni: {
          include: { user: { select: { name: true, email: true } } }
        },
        _count: { select: { applications: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return jobs.map((j) => ({
      id: Number(j.id),
      title: j.title,
      companyName: j.companyName,
      location: j.location,
      salaryPackage: j.salaryPackage,
      status: j.status,
      postedBy: j.postedByAlumni?.user?.name || 'Admin',
      applicationCount: j._count.applications,
      createdAt: j.createdAt
    }));
  }

  static async updateJobStatus(jobId, status) {
    const validStatuses = ['APPROVED', 'REJECTED', 'PENDING', 'EXPIRED'];
    if (!validStatuses.includes(status)) {
      throw { statusCode: 400, message: 'Invalid job status' };
    }

    const updated = await prisma.job.update({
      where: { id: BigInt(jobId) },
      data: { status }
    });

    return { success: true, message: `Job status updated to ${status}`, job: updated };
  }

  static async deleteStudent(studentId, accessScope, operatorEmail = null, ipAddress = null) {
    let student;
    try {
      student = await prisma.student.findUnique({
        where: { id: BigInt(studentId) },
        include: { user: true, resumes: true }
      });
    } catch (err) {
      throw { statusCode: 404, message: 'Student account not found.' };
    }

    if (!student) {
      throw { statusCode: 404, message: 'Student account not found.' };
    }
    
    if (accessScope && accessScope.type === 'DEPARTMENT' && !AccessControlService.canAccessDepartment(accessScope, student.department)) {
      throw { statusCode: 403, message: 'Forbidden: Cannot delete students from other departments.' };
    }

    const sid = student.id;
    const uid = student.userId;
    const studentName = student.user?.name || 'Unknown';
    const rollNumber = student.rollNumber;
    const userEmail = student.user?.email || '';

    await prisma.$transaction(async (tx) => {
      const apps = await tx.application.findMany({
        where: { studentId: sid },
        select: { id: true }
      });
      const appIds = apps.map((a) => a.id);
      if (appIds.length > 0) {
        await tx.applicationScreeningAnswer.deleteMany({
          where: { applicationId: { in: appIds } }
        });
      }

      await tx.application.deleteMany({ where: { studentId: sid } });
      await tx.studentSkill.deleteMany({ where: { studentId: sid } });
      await tx.studentProject.deleteMany({ where: { studentId: sid } });
      await tx.resume.deleteMany({ where: { studentId: sid } });
      await tx.student.delete({ where: { id: sid } });

      if (uid) {
        await tx.auditLog.deleteMany({ where: { performedBy: uid } });
        await tx.user.delete({ where: { id: uid } });
      }

      await tx.auditLog.create({
        data: {
          action: 'PERMANENT_STUDENT_DELETE',
          details: `Permanently deleted student account: Name=${studentName}, RollNumber=${rollNumber}, Email=${userEmail}`
        }
      });
    });

    return {
      success: true,
      message: 'Student account has been permanently deleted.'
    };
  }

  static async deleteAlumni(alumniId, accessScope, operatorEmail = null, ipAddress = null) {
    let alumni;
    try {
      alumni = await prisma.alumni.findUnique({
        where: { id: BigInt(alumniId) },
        include: { user: true }
      });
    } catch (err) {
      throw { statusCode: 404, message: 'Alumni account not found.' };
    }

    if (!alumni) {
      throw { statusCode: 404, message: 'Alumni account not found.' };
    }
    
    if (accessScope && accessScope.type === 'DEPARTMENT' && !AccessControlService.canAccessDepartment(accessScope, alumni.department)) {
      throw { statusCode: 403, message: 'Forbidden: Cannot delete alumni from other departments.' };
    }

    if (alumni.user?.role === 'ADMIN' || alumni.user?.role === 'SUPER_ADMIN') {
      throw { statusCode: 403, message: 'Cannot delete admin accounts through this endpoint.' };
    }

    const aid = alumni.id;
    const uid = alumni.userId;
    const alumniName = alumni.user?.name || 'Unknown';
    const userEmail = alumni.user?.email || '';

    // Delete associated files (profile image, verification document)
    const fs = require('fs');
    const { resolveResumeFilePath } = require('../utils/file.utils');
    const path = require('path');
    const env = require('../config/env');

    if (alumni.profileImageUrl) {
      const pPath = path.join(env.uploadDir, 'images', path.basename(alumni.profileImageUrl));
      if (fs.existsSync(pPath)) {
        try { fs.unlinkSync(pPath); } catch (e) {}
      }
    }

    if (alumni.verificationDocumentUrl) {
      const dPath = resolveResumeFilePath(alumni.verificationDocumentUrl);
      if (dPath && fs.existsSync(dPath)) {
        try { fs.unlinkSync(dPath); } catch (e) {}
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete alumni record
      await tx.alumni.delete({ where: { id: aid } });

      // 2. Delete user record & audit logs
      if (uid) {
        await tx.auditLog.deleteMany({ where: { performedBy: uid } });
        await tx.ocrAuditLog.deleteMany({ where: { performedBy: uid } });
        await tx.user.delete({ where: { id: uid } });
      }

      await tx.auditLog.create({
        data: {
          action: 'PERMANENT_ALUMNI_DELETE',
          details: `Permanently deleted alumni account: Name=${alumniName}, Email=${userEmail}`
        }
      });
    });

    return {
      success: true,
      message: 'Alumni account has been permanently deleted.'
    };
  }

  static async resetStudentPassword(studentId, accessScope) {
    const { hashPassword } = require('../utils/password.utils');
    const { generateStudentDefaultPassword } = require('../utils/studentPassword.util');
    let student;
    try {
      student = await prisma.student.findUnique({
        where: { id: BigInt(studentId) },
        include: { user: true }
      });
    } catch (err) {
      throw { statusCode: 404, message: 'Student account not found.' };
    }

    if (!student || !student.user) {
      throw { statusCode: 404, message: 'Student account not found.' };
    }
    
    if (accessScope && accessScope.type === 'DEPARTMENT' && !AccessControlService.canAccessDepartment(accessScope, student.department)) {
      throw { statusCode: 403, message: 'Forbidden: Cannot reset password for students from other departments.' };
    }

    const rollNumber = student.rollNumber;
    const tempPassword = generateStudentDefaultPassword(rollNumber);
    const hashedPassword = await hashPassword(tempPassword);

    await prisma.user.update({
      where: { id: student.userId },
      data: {
        password: hashedPassword,
        passwordChanged: false
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'Password Reset',
        details: `Reset password for student: ${student.user.name} (${rollNumber})`
      }
    });

    return {
      name: student.user.name,
      email: student.user.email,
      password: tempPassword,
      temporaryPassword: tempPassword,
      rollNumber: rollNumber
    };
  }

  static async addStudent(request) {
    const { hashPassword } = require('../utils/password.utils');
    const { generateStudentDefaultPassword } = require('../utils/studentPassword.util');
    const { name, email, rollNumber, mobileNumber, department, semester, academicYear } = request;

    if (!email || !rollNumber || !name) {
      throw { statusCode: 400, message: 'Name, email, and roll number are required' };
    }

    const existingEmailUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (existingEmailUser && !existingEmailUser.deletedAt) {
      throw { statusCode: 400, message: 'This email address is already associated with an existing student account.' };
    }

    const existingRollStudent = await prisma.student.findUnique({
      where: { rollNumber: rollNumber.trim().toUpperCase() }
    });
    if (existingRollStudent && !existingRollStudent.deletedAt) {
      throw { statusCode: 400, message: 'This roll number is already associated with an existing student account.' };
    }

    const tempPassword = generateStudentDefaultPassword(rollNumber.trim().toUpperCase());
    const hashedPassword = await hashPassword(tempPassword);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          role: 'STUDENT',
          accountStatus: 'ACTIVE',
          passwordChanged: false
        }
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          rollNumber: rollNumber.trim().toUpperCase(),
          mobileNumber: mobileNumber ? mobileNumber.trim() : null,
          department: department ? department.trim() : null,
          semester: semester ? parseInt(semester, 10) : 1,
          academicYear: academicYear ? academicYear.trim() : null,
          verificationStatus: 'VERIFIED'
        }
      });

      return { user, student };
    });

    return {
      name: result.user.name,
      email: result.user.email,
      identifier: result.student.rollNumber,
      temporaryPassword: tempPassword
    };
  }

  static async approveStudent(studentId) {
    let student = null;
    try {
      student = await prisma.student.findUnique({
        where: { id: BigInt(studentId) }
      });
    } catch (e) {
      throw { statusCode: 404, message: 'Student account not found' };
    }

    if (!student) {
      throw { statusCode: 404, message: 'Student account not found' };
    }
    
    if (accessScope && accessScope.type === 'DEPARTMENT' && !AccessControlService.canAccessDepartment(accessScope, student.department)) {
      throw { statusCode: 403, message: 'Forbidden: Cannot approve students from other departments.' };
    }

    if (student.verificationStatus === 'VERIFIED') {
      return { success: false, message: 'Student is already approved' };
    }

    await prisma.student.update({
      where: { id: student.id },
      data: { verificationStatus: 'VERIFIED' }
    });

    return { success: true, message: 'Student approved successfully' };
  }

  static async toggleStudentStatus(studentIdOrUserId, status, accessScope) {
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: BigInt(studentIdOrUserId) }
      });
    } catch (e) {}

    if (!user) {
      const student = await prisma.student.findUnique({
        where: { id: BigInt(studentIdOrUserId) }
      });
      if (student && student.userId) {
        user = await prisma.user.findUnique({ where: { id: student.userId } });
      }
    }

    if (!user) {
      throw { statusCode: 404, message: 'User account not found' };
    }

    if (accessScope && accessScope.type === 'DEPARTMENT') {
      const student = await prisma.student.findUnique({
        where: { userId: user.id }
      });
      if (student && !AccessControlService.canAccessDepartment(accessScope, student.department)) {
        throw { statusCode: 403, message: 'Forbidden: Cannot toggle status for students from other departments.' };
      }
    }

    const nextStatus = (status || '').toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED';

    await prisma.user.update({
      where: { id: user.id },
      data: { accountStatus: nextStatus === 'ACTIVE' ? 'ACTIVE' : 'BLOCKED' }
    });

    return { success: true, message: `Account status updated to ${nextStatus}` };
  }

  static async getStudentDetails(studentIdParam, accessScope) {
    let studentId;
    try {
      studentId = BigInt(studentIdParam);
    } catch (err) {
      throw { statusCode: 400, message: 'Invalid student ID format' };
    }

    let student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        resumes: { where: { deletedAt: null }, orderBy: { id: 'desc' }, take: 1 },
        skills: { where: { deletedAt: null } },
        projects: { where: { deletedAt: null } }
      }
    });

    if (!student || student.deletedAt) {
      student = await prisma.student.findUnique({
        where: { userId: studentId },
        include: {
          user: true,
          resumes: { where: { deletedAt: null }, orderBy: { id: 'desc' }, take: 1 },
          skills: { where: { deletedAt: null } },
          projects: { where: { deletedAt: null } }
        }
      });
    }

    if (!student || student.deletedAt) {
      throw { statusCode: 404, message: 'Student account not found.' };
    }
    
    if (accessScope && accessScope.type === 'DEPARTMENT' && !AccessControlService.canAccessDepartment(accessScope, student.department)) {
      throw { statusCode: 403, message: 'Forbidden: Cannot view details of students from other departments.' };
    }

    const user = student.user || {};
    const resume = (student.resumes && student.resumes.length > 0) ? student.resumes[0] : null;
    const sId = Number(student.id);

    return {
      id: sId,
      studentId: sId,
      userId: Number(student.userId),
      studentName: user.name || `Student #${sId}`,
      name: user.name || `Student #${sId}`,
      email: user.email || null,
      rollNumber: student.rollNumber || '',
      department: student.department || '',
      semester: student.semester || null,
      academicYear: student.academicYear || '2026',
      graduationYear: student.academicYear || '2026',
      cgpa: student.cgpa || null,
      backlogs: student.backlogs || 0,
      profileImageUrl: student.profileImageUrl,
      mobileNumber: student.mobileNumber || null,
      location: student.location || null,
      verificationStatus: student.verificationStatus || 'VERIFIED',
      academicStatus: student.academicStatus || 'PURSUING',
      hasResume: Boolean(resume),

      // Education
      degree: 'B.Tech',
      college: 'Vasireddy Venkatadri Institute of Technology',
      branch: student.department || '',

      // Profiles
      githubUrl: student.githubUrl || null,
      linkedinUrl: student.linkedinUrl || null,
      leetcodeUrl: student.leetcodeUrl || null,
      codechefUrl: student.codechefUrl || null,
      gfgUrl: student.gfgUrl || null,
      hackerrankUrl: student.hackerrankUrl || null,

      // Resume
      resumeFileName: resume ? (resume.fileName || `${student.rollNumber || 'Student'}_Resume.pdf`) : null,
      resumeUrl: resume ? `/api/admin/users/students/${sId}/resume/view` : null,
      resumeDownloadUrl: resume ? `/api/admin/users/students/${sId}/resume/download` : null,
      resumeViewUrl: resume ? `/api/admin/users/students/${sId}/resume/view` : null,
      resume: resume ? {
        id: Number(resume.id),
        fileName: resume.fileName || `${student.rollNumber || 'Student'}_Resume.pdf`,
        originalFileName: resume.fileName || `${student.rollNumber || 'Student'}_Resume.pdf`,
        fileUrl: resume.filePath,
        mimeType: resume.fileType || 'application/pdf',
        uploadedAt: resume.uploadedAt
      } : null,

      // Skills
      skills: (student.skills || []).map(s => s.skillName).filter(Boolean),

      // Projects
      projects: (student.projects || []).map(p => ({
        id: Number(p.id),
        studentId: sId,
        title: p.title || '',
        description: p.description || '',
        technologies: p.techStack || '',
        techStack: p.techStack || '',
        githubUrl: p.sourceUrl || null,
        sourceUrl: p.sourceUrl || null,
        liveDemoUrl: p.demoUrl || null,
        demoUrl: p.demoUrl || null,
        projectType: 'Academic',
        status: 'Completed'
      }))
    };
  }

  static async getStudentResumeFile(studentIdParam, accessScope) {
    let studentId;
    try {
      studentId = BigInt(studentIdParam);
    } catch (err) {
      throw { statusCode: 400, message: 'Invalid student ID format' };
    }

    let student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student || student.deletedAt) {
      student = await prisma.student.findUnique({
        where: { userId: studentId }
      });
    }

    if (!student || student.deletedAt) {
      throw { statusCode: 404, message: 'Student not found.' };
    }
    
    if (accessScope && accessScope.type === 'DEPARTMENT' && !AccessControlService.canAccessDepartment(accessScope, student.department)) {
      throw { statusCode: 403, message: 'Forbidden: Cannot access resumes of students from other departments.' };
    }

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

module.exports = AdminService;
