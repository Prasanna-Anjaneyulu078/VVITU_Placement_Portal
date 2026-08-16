const prisma = require('../config/db');
const MatchingService = require('./matching.service');

class EligibilityService {
  /**
   * Validates student eligibility and calculates matching score for a specific job.
   */
  static async validateEligibility(userId, jobId) {
    return await MatchingService.calculateJobMatch(userId, jobId);
  }

  static checkDepartmentEligibility(student, job) {
    const studentDept = student.department ? student.department.trim().toUpperCase() : null;
    const eligibleDepts = job.eligibleDepartments
      ? job.eligibleDepartments.split(',').map((d) => d.trim().toUpperCase()).filter(Boolean)
      : [];

    if (eligibleDepts.length === 0) {
      return {
        criterion: 'Department',
        passed: true,
        detail: studentDept ? `Department: ${student.department}` : 'No department restriction'
      };
    }

    if (!studentDept) {
      return {
        criterion: 'Department',
        passed: false,
        detail: 'Department not set'
      };
    }

    const passed = eligibleDepts.includes(studentDept);
    return {
      criterion: 'Department',
      passed,
      detail: passed
        ? `Department: ${student.department}`
        : `Branch ${student.department} is not eligible. Required: ${job.eligibleDepartments}`
    };
  }

  static checkCgpaEligibility(student, job) {
    const studentCgpa = student.cgpa;
    const requiredCgpa = job.requiredCgpa;

    if (requiredCgpa === null || requiredCgpa === undefined) {
      return {
        criterion: 'CGPA',
        passed: true,
        detail: 'No CGPA requirement for this job'
      };
    }

    if (studentCgpa === null || studentCgpa === undefined) {
      return {
        criterion: 'CGPA',
        passed: false,
        detail: `Student CGPA not set. Required: ${requiredCgpa}`
      };
    }

    const passed = studentCgpa >= requiredCgpa;
    return {
      criterion: 'CGPA',
      passed,
      detail: `Student CGPA: ${studentCgpa.toFixed(2)}, Required: ${requiredCgpa.toFixed(2)}`
    };
  }

  static checkBacklogsEligibility(student, job) {
    const studentBacklogs = student.backlogs !== undefined && student.backlogs !== null ? student.backlogs : null;
    const maxBacklogs = job.maxBacklogs !== null && job.maxBacklogs !== undefined ? job.maxBacklogs : 0;

    if (studentBacklogs === null) {
      return {
        criterion: 'Backlogs',
        passed: false,
        detail: `Student backlogs not set. Maximum allowed: ${maxBacklogs}`
      };
    }

    const passed = studentBacklogs <= maxBacklogs;
    return {
      criterion: 'Backlogs',
      passed,
      detail: `Student backlogs: ${studentBacklogs}, Maximum allowed: ${maxBacklogs}`
    };
  }

  static checkSemesterEligibility(student, job) {
    const studentSemester = student.semester || 8; // Default to senior semester if not set
    const eligibleSemester = job.eligibleSemester || null;

    if (!eligibleSemester) {
      return {
        criterion: 'Semester',
        passed: true,
        detail: 'No semester requirement for this job'
      };
    }

    const passed = studentSemester >= eligibleSemester;
    return {
      criterion: 'Semester',
      passed,
      detail: `Student semester: ${studentSemester}, Required: ${eligibleSemester}`
    };
  }

  static checkResumeEligibility(student) {
    const hasResume = Array.isArray(student.resumes) && student.resumes.length > 0;
    return {
      criterion: 'Resume',
      passed: hasResume,
      detail: hasResume ? 'Resume uploaded' : 'Resume not uploaded'
    };
  }

  static checkAccountEligibility(student) {
    const userActive = student.user && student.user.accountStatus === 'ACTIVE';
    const isActive = userActive && !student.deletedAt;
    return {
      criterion: 'Account Status',
      passed: isActive,
      detail: isActive ? 'Account is active' : 'Account is not active'
    };
  }

  static checkVerificationEligibility(student) {
    const isVerified = true; // Student registered is verified by default in current flow
    return {
      criterion: 'Verification',
      passed: isVerified,
      detail: isVerified ? 'Student is verified' : 'Student verification pending'
    };
  }

  static calculateSkillMatch(student, job) {
    const { matchSkills } = require('../utils/skillMatcher');
    const studentSkills = student ? (student.skills || []) : [];
    const requiredSkills = job ? (job.requiredSkills || '') : '';
    return matchSkills(studentSkills, requiredSkills);
  }

  static async getRecommendedJobs(userId, limit = 10) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: `Student profile not found for user ID: ${userId}` };
    }

    const approvedJobs = await prisma.job.findMany({
      where: { status: 'APPROVED', deletedAt: null },
      take: limit * 2
    });

    const evaluatedJobs = [];
    for (const job of approvedJobs) {
      try {
        const val = await this.validateEligibility(userId, Number(job.id));
        evaluatedJobs.push({
          job: {
            id: Number(job.id),
            title: job.title,
            companyName: job.companyName,
            location: job.location,
            salaryPackage: job.salaryPackage,
            requiredCgpa: job.requiredCgpa,
            maxBacklogs: job.maxBacklogs,
            eligibleDepartments: job.eligibleDepartments
          },
          eligibility: val
        });
      } catch (err) {
        // Skip un-evaluatable jobs
      }
    }

    evaluatedJobs.sort((a, b) => b.eligibility.matchScore - a.eligibility.matchScore);
    return evaluatedJobs.slice(0, limit);
  }
}

module.exports = EligibilityService;
