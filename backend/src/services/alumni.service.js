const prisma = require('../config/db');

class AlumniService {
  static async getProfile(userId) {
    const alumni = await prisma.alumni.findUnique({
      where: { userId: BigInt(userId) },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, accountStatus: true, lastLogin: true, createdAt: true }
        }
      }
    });

    if (!alumni) {
      throw { statusCode: 404, message: 'Alumni profile not found' };
    }

    return {
      id: Number(alumni.id),
      userId: Number(alumni.userId),
      name: alumni.user ? alumni.user.name : null,
      email: alumni.user ? alumni.user.email : null,
      role: alumni.user ? alumni.user.role : 'ALUMNI',
      company: alumni.company,
      designation: alumni.designation,
      passingYear: alumni.passingYear,
      rollNumber: alumni.rollNumber,
      department: alumni.department,
      mobileNumber: alumni.mobileNumber,
      gender: alumni.gender,
      linkedinUrl: alumni.linkedinUrl,
      degree: alumni.degree,
      verificationStatus: alumni.verificationStatus,
      profileImageUrl: alumni.profileImageUrl ? `/api/public/alumni/${alumni.id}/profile-image` : null,
      user: alumni.user ? {
        id: Number(alumni.user.id),
        name: alumni.user.name,
        email: alumni.user.email,
        role: alumni.user.role || 'ALUMNI',
        accountStatus: alumni.user.accountStatus || 'ACTIVE',
        lastLogin: alumni.user.lastLogin || null,
        createdAt: alumni.user.createdAt || alumni.createdAt || null
      } : null,
      account: alumni.user ? {
        email: alumni.user.email,
        role: alumni.user.role || 'ALUMNI',
        status: alumni.user.accountStatus || 'ACTIVE',
        createdAt: alumni.user.createdAt || alumni.createdAt || null,
        lastLogin: alumni.user.lastLogin || null
      } : null,
      accountInformation: alumni.user ? {
        email: alumni.user.email,
        role: alumni.user.role || 'ALUMNI',
        status: alumni.user.accountStatus || 'ACTIVE',
        createdAt: alumni.user.createdAt || alumni.createdAt || null,
        lastLogin: alumni.user.lastLogin || null
      } : null,
      accountStatus: alumni.user ? (alumni.user.accountStatus || 'ACTIVE') : 'ACTIVE',
      lastLogin: alumni.user ? alumni.user.lastLogin : null,
      createdAt: alumni.user ? (alumni.user.createdAt || alumni.createdAt || null) : null
    };
  }

  static async getDashboardStats(userId) {
    const alumni = await prisma.alumni.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!alumni) {
      throw { statusCode: 404, message: 'Alumni profile not found' };
    }

    const jobs = await prisma.job.findMany({
      where: { postedByAlumniId: alumni.id, deletedAt: null },
      include: { _count: { select: { applications: true } } }
    });

    const activeJobs = jobs.filter(j => j.status === 'APPROVED').length;
    const jobsPosted = jobs.length;
    const totalApplicants = jobs.reduce((acc, job) => acc + job._count.applications, 0);

    return {
      jobsPosted,
      activeJobs,
      totalApplicants
    };
  }

  static async updateProfile(userId, updateData) {
    const alumni = await prisma.alumni.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!alumni) {
      throw { statusCode: 404, message: 'Alumni profile not found' };
    }

    const { company, designation, passingYear } = updateData;

    const updated = await prisma.alumni.update({
      where: { id: alumni.id },
      data: {
        ...(company !== undefined && { company }),
        ...(designation !== undefined && { designation }),
        ...(passingYear !== undefined && { passingYear: parseInt(passingYear, 10) })
      }
    });

    return { success: true, message: 'Alumni profile updated successfully', alumni: updated };
  }

  static async getPostedJobs(userId) {
    const alumni = await prisma.alumni.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!alumni) {
      throw { statusCode: 404, message: 'Alumni profile not found' };
    }

    const jobs = await prisma.job.findMany({
      where: {
        postedByAlumniId: alumni.id,
        deletedAt: null
      },
      include: {
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return jobs.map((job) => ({
      id: Number(job.id),
      title: job.title,
      companyName: job.companyName,
      description: job.description,
      location: job.location,
      salaryPackage: job.salaryPackage,
      requiredCgpa: job.requiredCgpa,
      maxBacklogs: job.maxBacklogs,
      eligibleDepartments: job.eligibleDepartments,
      status: job.status,
      applicationDeadline: job.applicationDeadline,
      requiredSkills: job.requiredSkills,
      applicationCount: job._count.applications,
      createdAt: job.createdAt
    }));
  }

  static async createJob(userId, jobData) {
    const alumni = await prisma.alumni.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!alumni) {
      throw { statusCode: 404, message: 'Alumni profile not found' };
    }

    if (alumni.verificationStatus !== 'VERIFIED') {
      throw { statusCode: 403, message: 'Your alumni account must be verified by an Admin before posting jobs.' };
    }

    const {
      title,
      companyName,
      description,
      location,
      salaryPackage,
      requiredCgpa,
      maxBacklogs,
      eligibleDepartments,
      applicationDeadline,
      requiredSkills
    } = jobData;

    if (!title || !companyName) {
      throw { statusCode: 400, message: 'Job title and company name are required' };
    }

    const newJob = await prisma.job.create({
      data: {
        title: title.trim(),
        companyName: companyName.trim(),
        description: description ? description.trim() : null,
        location: location ? location.trim() : null,
        salaryPackage: salaryPackage ? parseFloat(salaryPackage) : null,
        requiredCgpa: requiredCgpa ? parseFloat(requiredCgpa) : null,
        maxBacklogs: maxBacklogs ? parseInt(maxBacklogs, 10) : null,
        eligibleDepartments: Array.isArray(eligibleDepartments) ? eligibleDepartments.join(',') : eligibleDepartments,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        requiredSkills: requiredSkills ? requiredSkills.trim() : null,
        postedByAlumniId: alumni.id,
        status: 'PENDING'
      }
    });

    return { success: true, message: 'Job submitted for admin approval', job: newJob };
  }

  static async updateProfileImage(userId, file) {
    if (!file) {
      throw { statusCode: 400, message: 'Profile picture file is required' };
    }

    const alumni = await prisma.alumni.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!alumni) {
      throw { statusCode: 404, message: 'Alumni profile not found' };
    }

    const imageUrl = `/uploads/images/${file.filename}`;
    const now = new Date();

    const [updated] = await prisma.$transaction([
      prisma.alumni.update({
        where: { id: alumni.id },
        data: { profileImageUrl: imageUrl }
      }),
      prisma.user.update({
        where: { id: BigInt(userId) },
        data: { updatedAt: now }
      })
    ]);

    return {
      success: true,
      message: 'Profile picture updated successfully',
      profileImageUrl: imageUrl,
      url: imageUrl,
      updatedAt: now.toISOString(),
      alumni: updated
    };
  }
}

module.exports = AlumniService;
