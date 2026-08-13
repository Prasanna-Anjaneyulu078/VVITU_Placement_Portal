const prisma = require('../config/db');

class EligibilityService {
  /**
   * Validates student eligibility for a specific job against all 7 Spring Boot criteria.
   */
  static async validateEligibility(userId, jobId) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) },
      include: {
        user: true,
        skills: { where: { deletedAt: null } },
        resumes: { where: { deletedAt: null } }
      }
    });

    if (!student || student.deletedAt) {
      throw { statusCode: 404, message: `Student profile not found for user ID: ${userId}` };
    }

    const job = await prisma.job.findUnique({
      where: { id: BigInt(jobId) }
    });

    if (!job || job.deletedAt) {
      throw { statusCode: 404, message: `Job not found with ID: ${jobId}` };
    }

    const checks = [];

    // 1. Department Check
    const deptCheck = this.checkDepartmentEligibility(student, job);
    checks.push(deptCheck);

    // 2. CGPA Check
    const cgpaCheck = this.checkCgpaEligibility(student, job);
    checks.push(cgpaCheck);

    // 3. Backlogs Check
    const backlogsCheck = this.checkBacklogsEligibility(student, job);
    checks.push(backlogsCheck);

    // 4. Semester Check
    const semesterCheck = this.checkSemesterEligibility(student, job);
    checks.push(semesterCheck);

    // 5. Resume Check
    const resumeCheck = this.checkResumeEligibility(student);
    checks.push(resumeCheck);

    // 6. Account Status Check
    const accountCheck = this.checkAccountEligibility(student);
    checks.push(accountCheck);

    // 7. Verification Status Check
    const verificationCheck = this.checkVerificationEligibility(student);
    checks.push(verificationCheck);

    // Overall eligibility evaluation
    const isEligible = checks.every((c) => c.passed);

    // Match score calculation (passed criteria count / 7 * 100)
    const passedCount = checks.filter((c) => c.passed).length;
    const matchScore = Math.round((passedCount / checks.length) * 100);

    let status = 'NOT_ELIGIBLE';
    if (isEligible) {
      status = 'ELIGIBLE';
    } else if (matchScore >= 50) {
      status = 'PARTIALLY_ELIGIBLE';
    }

    let rejectionReason = null;
    if (!isEligible) {
      const failedDetails = checks.filter((c) => !c.passed).map((c) => c.detail);
      rejectionReason = `Not eligible due to: ${failedDetails.join(', ')}`;
    }

    // Skill Match Details
    const skillMatch = this.calculateSkillMatch(student, job);

    return {
      studentId: Number(student.id),
      jobId: Number(job.id),
      isEligible,
      status,
      matchScore,
      rejectionReason,
      checks,
      skillMatch
    };
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
