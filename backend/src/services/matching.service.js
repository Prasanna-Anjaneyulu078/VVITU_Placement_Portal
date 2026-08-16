const prisma = require('../config/db');
const { MATCH_WEIGHTS, getMatchCategory } = require('../config/matchConfig');
const { matchSkills } = require('../utils/skillMatcher');
const { matchDepartment } = require('../utils/departmentMatcher');

class MatchingService {
  /**
   * Universal, Production-Ready Job–Student Matching Engine.
   * Dynamically evaluates ANY job requirements against student profile.
   * 
   * @param {number|string|BigInt} userId - Authenticated user ID or student ID
   * @param {number|string|BigInt} jobId  - Target job ID
   * @returns {Promise<Object>} Standardized Match Score & Breakdown payload
   */
  static async calculateJobMatch(userId, jobId) {
    // 1. Fetch Student Data with relations
    let student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) },
      include: {
        user: true,
        skills: { where: { deletedAt: null } },
        projects: { where: { deletedAt: null } },
        resumes: { where: { deletedAt: null } }
      }
    });

    // Fallback lookup by student.id if lookup by userId yielded null
    if (!student) {
      student = await prisma.student.findUnique({
        where: { id: BigInt(userId) },
        include: {
          user: true,
          skills: { where: { deletedAt: null } },
          projects: { where: { deletedAt: null } },
          resumes: { where: { deletedAt: null } }
        }
      });
    }

    if (!student || student.deletedAt) {
      throw { statusCode: 404, message: `Student profile not found for ID: ${userId}` };
    }

    // 2. Fetch Job Data
    const job = await prisma.job.findUnique({
      where: { id: BigInt(jobId) }
    });

    if (!job || job.deletedAt) {
      throw { statusCode: 404, message: `Job not found with ID: ${jobId}` };
    }

    // 3. Sub-Component 1: Universal Skills Match (Weight 50%)
    const skillResult = matchSkills(student, job.requiredSkills || '', job.preferredSkills || '');
    const skillsScore = skillResult.skillMatchPercentage;

    // 4. Sub-Component 2: Education Match (Weight 15%)
    const educationResult = this.evaluateEducation(student, job);
    const educationScore = educationResult.score;

    // 5. Sub-Component 3: Branch / Department Match (Weight 10%)
    const branchResult = matchDepartment(student.department, job.eligibleDepartments);
    const branchScore = branchResult.score;

    // 6. Sub-Component 4: Experience Match (Weight 10%)
    const experienceResult = this.evaluateExperience(student, job);
    const experienceScore = experienceResult.score;

    // 7. Sub-Component 5: Eligibility Criteria Checks (Weight 10%)
    const eligibilityResult = this.evaluateEligibilityChecks(student, job, branchResult);
    const eligibilityScore = eligibilityResult.score;

    // 8. Sub-Component 6: Certifications Match (Weight 5%)
    const certificationResult = this.evaluateCertifications(student, job);
    const certificationsScore = certificationResult.score;

    // 9. Overall Score Calculation (Universal Weighted Sum)
    const rawOverallScore =
      (skillsScore * MATCH_WEIGHTS.skills) +
      (educationScore * MATCH_WEIGHTS.education) +
      (branchScore * (MATCH_WEIGHTS.department || MATCH_WEIGHTS.branch)) +
      (experienceScore * MATCH_WEIGHTS.experience) +
      (eligibilityScore * MATCH_WEIGHTS.eligibility) +
      (certificationsScore * MATCH_WEIGHTS.certifications);

    const overallScore = Math.min(100, Math.max(0, Math.round(rawOverallScore)));
    const category = getMatchCategory(overallScore);

    // 10. Mandatory Hard Eligibility Evaluation
    const isEligible = eligibilityResult.passedAllMandatory;
    const status = isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE';

    const rejectionReason = isEligible
      ? null
      : `Not eligible due to: ${eligibilityResult.failedReasons.join(', ')}`;

    // Build human-readable explainability checklist
    const explanations = [];
    if (skillResult.matchedSkills.length > 0 || skillResult.missingSkills.length > 0) {
      const totalReq = skillResult.matchedSkills.length + skillResult.missingSkills.length;
      explanations.push(`✓ ${skillResult.matchedSkills.length} of ${totalReq} required skills matched`);
    } else {
      explanations.push('✓ No specific skill requirements');
    }

    if (student.cgpa !== null && student.cgpa !== undefined && job.requiredCgpa) {
      if (student.cgpa >= job.requiredCgpa) {
        explanations.push(`✓ CGPA requirement met (${student.cgpa.toFixed(2)} >= ${job.requiredCgpa.toFixed(2)})`);
      } else {
        explanations.push(`✕ CGPA below requirement (${student.cgpa.toFixed(2)} < ${job.requiredCgpa.toFixed(2)})`);
      }
    } else if (!job.requiredCgpa) {
      explanations.push('✓ No CGPA requirement');
    }

    if (branchResult.passed) {
      explanations.push(`✓ Department ${branchResult.studentDept} is eligible`);
    } else {
      explanations.push(`✕ Department ${branchResult.studentDept} is not eligible`);
    }

    if (student.semester && job.eligibleSemester) {
      if (student.semester >= job.eligibleSemester) {
        explanations.push(`✓ Semester requirement met (${student.semester} >= ${job.eligibleSemester})`);
      } else {
        explanations.push(`✕ Semester requirement not met (${student.semester} < ${job.eligibleSemester})`);
      }
    }

    if (skillResult.missingSkills.length > 0) {
      skillResult.missingSkills.forEach(skill => {
        explanations.push(`• Missing required skill: ${skill}`);
      });
    }

    return {
      jobId: Number(job.id),
      jobTitle: job.title || '',
      studentId: Number(student.id),
      isEligible,
      eligible: isEligible,
      status,
      overallScore,
      category,
      matchScore: overallScore,
      skillMatchPercentage: Math.round(skillsScore),
      rejectionReason,

      skillMatch: {
        percentage: Math.round(skillsScore),
        skillMatchPercentage: Math.round(skillsScore),
        requiredSkills: skillResult.requiredSkills,
        matchedSkills: skillResult.matchedSkills,
        missingSkills: skillResult.missingSkills,
        preferredSkills: skillResult.preferredSkills,
        matchedPreferredSkills: skillResult.matchedPreferredSkills,
        missingPreferredSkills: skillResult.missingPreferredSkills
      },

      breakdown: {
        skills: Math.round(skillsScore),
        education: Math.round(educationScore),
        department: Math.round(branchScore),
        branch: Math.round(branchScore),
        experience: Math.round(experienceScore),
        eligibility: Math.round(eligibilityScore),
        certifications: Math.round(certificationsScore)
      },

      eligibilityFailures: eligibilityResult.failedReasons,
      requiredSkills: skillResult.requiredSkills,
      matchedSkills: skillResult.matchedSkills,
      missingSkills: skillResult.missingSkills,
      preferredSkills: skillResult.preferredSkills,
      matchedPreferredSkills: skillResult.matchedPreferredSkills,
      missingPreferredSkills: skillResult.missingPreferredSkills,
      checks: eligibilityResult.checks,
      explanations
    };
  }

  /**
   * Universal Education Evaluation Helper
   */
  static evaluateEducation(student, job) {
    let score = 100;
    const details = [];

    // Check academic status
    if (student.academicStatus === 'SUSPENDED' || student.academicStatus === 'DISCONTINUED') {
      score -= 50;
      details.push(`Academic status is ${student.academicStatus}`);
    }

    // Check semester criteria
    if (job.eligibleSemester && student.semester) {
      if (student.semester < job.eligibleSemester) {
        score -= 40;
        details.push(`Current semester ${student.semester} is below required semester ${job.eligibleSemester}`);
      } else {
        details.push(`Semester ${student.semester} meets required semester ${job.eligibleSemester}`);
      }
    }

    return {
      score: Math.max(0, score),
      details
    };
  }

  /**
   * Universal Experience Evaluation Helper
   */
  static evaluateExperience(student, job) {
    const requiredExpStr = (job.experienceRequired || '').toLowerCase();
    const hasProjects = Array.isArray(student.projects) && student.projects.length > 0;
    const projectCount = hasProjects ? student.projects.length : 0;

    // Freshers / 0-1 / 0-2 years jobs
    if (!requiredExpStr || requiredExpStr.includes('fresher') || requiredExpStr.includes('0-1') || requiredExpStr.includes('0-2') || requiredExpStr.includes('0 year')) {
      return {
        score: 100,
        detail: 'Entry level / Fresher position — 100% experience match'
      };
    }

    // Job requires experienced candidates (e.g., 2+ years, 3+ years, senior)
    if (requiredExpStr.includes('2+') || requiredExpStr.includes('3+') || requiredExpStr.includes('senior')) {
      if (projectCount >= 3) {
        return { score: 75, detail: 'High project activity compensates for required industry experience' };
      } else if (projectCount >= 1) {
        return { score: 50, detail: 'Partial experience match based on student projects' };
      } else {
        return { score: 30, detail: 'Entry-level student profile for experienced role' };
      }
    }

    return {
      score: hasProjects ? 100 : 80,
      detail: hasProjects ? `${projectCount} student projects found` : 'No student projects listed'
    };
  }

  /**
   * Universal Eligibility Checks & Mandatory Failures Helper
   */
  static evaluateEligibilityChecks(student, job, branchResult) {
    const checks = [];
    const failedReasons = [];

    // 1. Department Check
    checks.push({
      criterion: 'Department',
      passed: branchResult.passed,
      detail: branchResult.detail
    });
    if (!branchResult.passed) failedReasons.push(branchResult.detail);

    // 2. CGPA Check
    const studentCgpa = student.cgpa;
    const requiredCgpa = job.requiredCgpa;
    let cgpaPassed = true;
    let cgpaDetail = 'No CGPA requirement';

    if (requiredCgpa !== null && requiredCgpa !== undefined) {
      if (studentCgpa === null || studentCgpa === undefined) {
        cgpaPassed = false;
        cgpaDetail = `CGPA not set in profile (Required: ${requiredCgpa.toFixed(2)})`;
      } else {
        cgpaPassed = studentCgpa >= requiredCgpa;
        cgpaDetail = `Student CGPA: ${studentCgpa.toFixed(2)}, Required: ${requiredCgpa.toFixed(2)}`;
      }
    }
    checks.push({ criterion: 'CGPA', passed: cgpaPassed, detail: cgpaDetail });
    if (!cgpaPassed) failedReasons.push(cgpaDetail);

    // 3. Backlogs Check
    const studentBacklogs = student.backlogs !== undefined && student.backlogs !== null ? student.backlogs : 0;
    const maxBacklogs = job.maxBacklogs !== null && job.maxBacklogs !== undefined ? job.maxBacklogs : 0;
    const backlogsPassed = studentBacklogs <= maxBacklogs;
    const backlogsDetail = `Student backlogs: ${studentBacklogs}, Maximum allowed: ${maxBacklogs}`;
    checks.push({ criterion: 'Backlogs', passed: backlogsPassed, detail: backlogsDetail });
    if (!backlogsPassed) failedReasons.push(backlogsDetail);

    // 4. Semester Check
    let semesterPassed = true;
    let semesterDetail = 'No semester requirement';
    if (job.eligibleSemester && student.semester) {
      semesterPassed = student.semester >= job.eligibleSemester;
      semesterDetail = `Student semester: ${student.semester}, Required: ${job.eligibleSemester}`;
    }
    checks.push({ criterion: 'Semester', passed: semesterPassed, detail: semesterDetail });
    if (!semesterPassed) failedReasons.push(semesterDetail);

    // 5. Resume Check
    const hasResume = Array.isArray(student.resumes) && student.resumes.length > 0;
    checks.push({
      criterion: 'Resume',
      passed: hasResume,
      detail: hasResume ? 'Resume uploaded' : 'Resume not uploaded'
    });

    // 6. Account Status Check
    const isActive = student.user && student.user.accountStatus === 'ACTIVE' && !student.deletedAt;
    checks.push({
      criterion: 'Account Status',
      passed: isActive,
      detail: isActive ? 'Account is active' : 'Account is not active'
    });
    if (!isActive) failedReasons.push('Account is not active');

    // Calculate percentage score of passed checks
    const passedCount = checks.filter(c => c.passed).length;
    const score = Math.round((passedCount / checks.length) * 100);

    const passedAllMandatory = branchResult.passed && cgpaPassed && backlogsPassed && isActive;

    return {
      score,
      checks,
      passedAllMandatory,
      failedReasons
    };
  }

  /**
   * Universal Certifications Evaluation Helper
   */
  static evaluateCertifications(student, job) {
    const jobSkillsStr = (job.requiredSkills || '').toLowerCase();
    const jobDescStr = (job.description || '').toLowerCase();
    const combinedJobStr = `${jobSkillsStr} ${jobDescStr}`;

    const certKeywords = ['certified', 'certification', 'aws certified', 'oracle certified', 'cisco', 'pmp', 'az-900', 'ckad'];
    const requiredCerts = certKeywords.filter(kw => combinedJobStr.includes(kw));

    if (requiredCerts.length === 0) {
      return {
        score: 100,
        detail: 'No specific certifications required — 100% score awarded'
      };
    }

    // Check if student skills or project descriptions contain certification keywords
    const studentSkillNames = (student.skills || []).map(s => (s.skillName || '').toLowerCase());
    const studentProjectDescs = (student.projects || []).map(p => `${p.title || ''} ${p.description || ''}`).join(' ').toLowerCase();
    const combinedStudentStr = `${studentSkillNames.join(' ')} ${studentProjectDescs}`;

    const matchedCerts = requiredCerts.filter(cert => combinedStudentStr.includes(cert));

    const score = Math.round((matchedCerts.length / requiredCerts.length) * 100);

    return {
      score,
      detail: `${matchedCerts.length} of ${requiredCerts.length} requested certifications matched`
    };
  }
}

module.exports = MatchingService;
