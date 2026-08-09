const prisma = require('../config/db');

class AlumniService {
  static async getProfile(userId) {
    const alumni = await prisma.alumni.findUnique({
      where: { userId: BigInt(userId) },
      include: {
        user: {
          select: { name: true, email: true, role: true }
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
      company: alumni.company,
      designation: alumni.designation,
      passingYear: alumni.passingYear,
      location: null,
      verificationStatus: alumni.verificationStatus,
      profileImageUrl: alumni.profileImageUrl
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
}

module.exports = AlumniService;
