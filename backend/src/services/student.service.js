const fs = require('fs');
const prisma = require('../config/db');

function normalizeProjectUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Handle concatenated URLs e.g. "https://github.com/userhttps://github.com/user"
  const httpMatches = trimmed.match(/https?:\/\/[^\s]+/gi);
  if (httpMatches && httpMatches.length > 0) {
    return httpMatches[0].trim();
  }

  if (trimmed.includes('.') || trimmed.includes('/')) {
    return `https://${trimmed.replace(/^https?:\/\//i, '')}`;
  }

  return trimmed;
}

class StudentService {
  static async getProfile(userId) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, accountStatus: true, lastLogin: true, createdAt: true }
        },
        skills: {
          where: { deletedAt: null }
        },
        projects: {
          where: { deletedAt: null }
        },
        resumes: {
          where: { deletedAt: null },
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    return {
      id: Number(student.id),
      userId: Number(student.userId),
      name: student.user.name,
      studentName: student.user.name,
      email: student.user.email,
      rollNumber: student.rollNumber,
      department: student.department,
      mobileNumber: student.mobileNumber,
      location: student.location,
      gender: student.gender,
      dob: student.dob,
      address: student.address || student.location,
      section: student.section,
      githubUrl: student.githubUrl,
      linkedinUrl: student.linkedinUrl,
      leetcodeUrl: student.leetcodeUrl,
      codechefUrl: student.codechefUrl,
      gfgUrl: student.gfgUrl,
      hackerrankUrl: student.hackerrankUrl,
      profileImageUrl: student.profileImageUrl ? `/api/public/student/${student.id}/profile-image` : null,
      cgpa: student.cgpa,
      semester: student.semester,
      backlogs: student.backlogs,
      academicYear: student.academicYear,
      academicStatus: student.academicStatus,
      verificationStatus: student.verificationStatus || 'VERIFIED',
      user: {
        id: Number(student.userId),
        name: student.user.name,
        email: student.user.email,
        role: student.user.role || 'STUDENT',
        accountStatus: student.user.accountStatus || 'ACTIVE',
        lastLogin: student.user.lastLogin || null,
        createdAt: student.user.createdAt || student.createdAt || null
      },
      account: {
        email: student.user.email,
        role: student.user.role || 'STUDENT',
        status: student.user.accountStatus || 'ACTIVE',
        createdAt: student.user.createdAt || student.createdAt || null,
        lastLogin: student.user.lastLogin || null
      },
      accountInformation: {
        email: student.user.email,
        role: student.user.role || 'STUDENT',
        status: student.user.accountStatus || 'ACTIVE',
        createdAt: student.user.createdAt || student.createdAt || null,
        lastLogin: student.user.lastLogin || null
      },
      accountStatus: student.user.accountStatus || 'ACTIVE',
      lastLogin: student.user.lastLogin || null,
      createdAt: student.user.createdAt || student.createdAt || null,
      skills: student.skills.map((s) => ({
        id: Number(s.id),
        skillName: s.skillName,
        name: s.skillName
      })),
      projects: student.projects.map((p) => {
        const srcUrl = normalizeProjectUrl(p.sourceUrl);
        const demoUrl = normalizeProjectUrl(p.demoUrl);
        return {
          id: Number(p.id),
          title: p.title,
          description: p.description,
          techStack: p.techStack,
          technologies: p.techStack,
          demoUrl,
          liveLink: demoUrl,
          liveDemoUrl: demoUrl,
          liveDemoURL: demoUrl,
          sourceUrl: srcUrl,
          githubLink: srcUrl,
          githubUrl: srcUrl,
          gitUrl: srcUrl,
          githubURL: srcUrl,
          projectUrl: demoUrl || srcUrl
        };
      }),
      hasResume: student.resumes.length > 0,
      resumeFileName: student.resumes[0]?.fileName || null,
      resumeFileType: student.resumes[0]?.fileType || null,
      resumeUploadedAt: student.resumes[0]?.uploadedAt || null,
      resumes: student.resumes.map((r) => ({
        id: Number(r.id),
        fileName: r.fileName,
        fileUrl: r.filePath,
        filePath: r.filePath,
        uploadedAt: r.uploadedAt
      }))
    };
  }

  static async getSkills(userId) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    const skills = await prisma.studentSkill.findMany({
      where: { studentId: student.id, deletedAt: null }
    });

    // Return a flat array of skills as requested
    return skills.map((s) => ({
      id: Number(s.id),
      studentId: Number(s.studentId),
      skillName: s.skillName,
      name: s.skillName,
      source: s.source || 'MANUAL'
    }));
  }

  static async getProjects(userId) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    const projects = await prisma.studentProject.findMany({
      where: { studentId: student.id, deletedAt: null }
    });

    return projects.map((p) => {
      const srcUrl = normalizeProjectUrl(p.sourceUrl);
      const demoUrl = normalizeProjectUrl(p.demoUrl);
      return {
        id: Number(p.id),
        studentId: Number(p.studentId),
        title: p.title,
        description: p.description,
        techStack: p.techStack,
        technologies: p.techStack,
        demoUrl,
        liveLink: demoUrl,
        liveDemoUrl: demoUrl,
        liveDemoURL: demoUrl,
        sourceUrl: srcUrl,
        githubLink: srcUrl,
        githubUrl: srcUrl,
        gitUrl: srcUrl,
        githubURL: srcUrl,
        projectUrl: demoUrl || srcUrl
      };
    });
  }

  static async getProjectById(userId, projectId) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    const p = await prisma.studentProject.findFirst({
      where: { id: BigInt(projectId), deletedAt: null }
    });

    if (!p) {
      throw { statusCode: 404, message: 'Project not found' };
    }

    if (Number(p.studentId) !== Number(student.id)) {
      throw { statusCode: 403, message: 'Forbidden: You do not have permission to view this project' };
    }

    const srcUrl = normalizeProjectUrl(p.sourceUrl);
    const demoUrl = normalizeProjectUrl(p.demoUrl);

    return {
      id: Number(p.id),
      studentId: Number(p.studentId),
      title: p.title,
      description: p.description,
      techStack: p.techStack,
      technologies: p.techStack,
      demoUrl,
      liveLink: demoUrl,
      liveDemoUrl: demoUrl,
      liveDemoURL: demoUrl,
      sourceUrl: srcUrl,
      githubLink: srcUrl,
      githubUrl: srcUrl,
      gitUrl: srcUrl,
      githubURL: srcUrl,
      projectUrl: demoUrl || srcUrl
    };
  }

  static async updateProfile(userId, updateData) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    const {
      department,
      mobileNumber,
      location,
      gender,
      dob, dateOfBirth,
      address,
      githubUrl,
      linkedinUrl,
      leetcodeUrl,
      codechefUrl,
      gfgUrl,
      hackerrankUrl,
      profileImageUrl,
      cgpa,
      semester,
      backlogs,
      academicYear,
      academicStatus,
      section
    } = updateData;

    const resolvedDob = dob !== undefined ? dob : dateOfBirth;

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        ...(department !== undefined && { department: department ? String(department).trim() : null }),
        ...(mobileNumber !== undefined && { mobileNumber: mobileNumber ? String(mobileNumber).trim() : null }),
        ...(location !== undefined && { location: location ? String(location).trim() : null }),
        ...(gender !== undefined && { gender: gender ? String(gender).trim() : null }),
        ...(resolvedDob !== undefined && { dob: resolvedDob ? String(resolvedDob).trim() : null }),
        ...(address !== undefined && { address: address ? String(address).trim() : null }),
        ...(githubUrl !== undefined && { githubUrl: githubUrl ? String(githubUrl).trim() : null }),
        ...(linkedinUrl !== undefined && { linkedinUrl: linkedinUrl ? String(linkedinUrl).trim() : null }),
        ...(leetcodeUrl !== undefined && { leetcodeUrl: leetcodeUrl ? String(leetcodeUrl).trim() : null }),
        ...(codechefUrl !== undefined && { codechefUrl: codechefUrl ? String(codechefUrl).trim() : null }),
        ...(gfgUrl !== undefined && { gfgUrl: gfgUrl ? String(gfgUrl).trim() : null }),
        ...(hackerrankUrl !== undefined && { hackerrankUrl: hackerrankUrl ? String(hackerrankUrl).trim() : null }),
        ...(profileImageUrl !== undefined && { profileImageUrl }),
        ...(cgpa !== undefined && { cgpa: (cgpa !== null && cgpa !== '') ? parseFloat(cgpa) : null }),
        ...(semester !== undefined && { semester: (semester !== null && semester !== '') ? parseInt(semester, 10) : null }),
        ...(backlogs !== undefined && { backlogs: (backlogs !== null && backlogs !== '') ? parseInt(backlogs, 10) : 0 }),
        ...(academicYear !== undefined && { academicYear: academicYear ? String(academicYear).trim() : null }),
        ...(academicStatus !== undefined && { academicStatus }),
        ...(section !== undefined && { section: section ? String(section).trim() : null })
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, accountStatus: true, lastLogin: true, createdAt: true } },
        skills: { where: { deletedAt: null } },
        projects: { where: { deletedAt: null } },
        resumes: { where: { deletedAt: null }, orderBy: { uploadedAt: 'desc' } }
      }
    });

    return {
      id: Number(updated.id),
      userId: Number(updated.userId),
      name: updated.user.name,
      studentName: updated.user.name,
      email: updated.user.email,
      rollNumber: updated.rollNumber,
      department: updated.department,
      mobileNumber: updated.mobileNumber,
      location: updated.location,
      gender: updated.gender,
      dob: updated.dob,
      address: updated.address || updated.location,
      section: updated.section,
      githubUrl: updated.githubUrl,
      linkedinUrl: updated.linkedinUrl,
      leetcodeUrl: updated.leetcodeUrl,
      codechefUrl: updated.codechefUrl,
      gfgUrl: updated.gfgUrl,
      hackerrankUrl: updated.hackerrankUrl,
      profileImageUrl: updated.profileImageUrl ? `/api/public/student/${updated.id}/profile-image` : null,
      cgpa: updated.cgpa,
      semester: updated.semester,
      backlogs: updated.backlogs,
      academicYear: updated.academicYear,
      academicStatus: updated.academicStatus,
      verificationStatus: updated.verificationStatus || 'VERIFIED',
      user: {
        id: Number(updated.userId),
        name: updated.user.name,
        email: updated.user.email,
        role: updated.user.role || 'STUDENT',
        accountStatus: updated.user.accountStatus || 'ACTIVE',
        lastLogin: updated.user.lastLogin || null,
        createdAt: updated.user.createdAt || updated.createdAt || null
      },
      account: {
        email: updated.user.email,
        role: updated.user.role || 'STUDENT',
        status: updated.user.accountStatus || 'ACTIVE',
        createdAt: updated.user.createdAt || updated.createdAt || null,
        lastLogin: updated.user.lastLogin || null
      },
      accountInformation: {
        email: updated.user.email,
        role: updated.user.role || 'STUDENT',
        status: updated.user.accountStatus || 'ACTIVE',
        createdAt: updated.user.createdAt || updated.createdAt || null,
        lastLogin: updated.user.lastLogin || null
      },
      accountStatus: updated.user.accountStatus || 'ACTIVE',
      lastLogin: updated.user.lastLogin || null,
      createdAt: updated.user.createdAt || updated.createdAt || null,
      section: updated.section,
      githubUrl: updated.githubUrl,
      linkedinUrl: updated.linkedinUrl,
      leetcodeUrl: updated.leetcodeUrl,
      codechefUrl: updated.codechefUrl,
      gfgUrl: updated.gfgUrl,
      hackerrankUrl: updated.hackerrankUrl,
      profileImageUrl: updated.profileImageUrl ? `/api/public/student/${updated.id}/profile-image` : null,
      cgpa: updated.cgpa,
      semester: updated.semester,
      backlogs: updated.backlogs,
      academicYear: updated.academicYear,
      academicStatus: updated.academicStatus,
      verificationStatus: updated.verificationStatus || 'VERIFIED',
      user: {
        id: Number(updated.userId),
        name: updated.user.name,
        email: updated.user.email,
        role: updated.user.role
      },
      skills: updated.skills.map((s) => ({ id: Number(s.id), skillName: s.skillName, name: s.skillName })),
      projects: updated.projects.map((p) => ({
        id: Number(p.id),
        title: p.title,
        description: p.description,
        techStack: p.techStack,
        technologies: p.techStack,
        demoUrl: p.demoUrl,
        liveLink: p.demoUrl,
        liveDemoUrl: p.demoUrl,
        sourceUrl: p.sourceUrl,
        githubLink: p.sourceUrl,
        githubUrl: p.sourceUrl
      })),
      hasResume: updated.resumes.length > 0,
      resumeFileName: updated.resumes[0]?.fileName || null,
      resumeFileType: updated.resumes[0]?.fileType || null,
      resumeUploadedAt: updated.resumes[0]?.uploadedAt || null,
      resumes: updated.resumes.map((r) => ({ id: Number(r.id), fileName: r.fileName, fileUrl: r.filePath, uploadedAt: r.uploadedAt }))
    };
  }

  static async addSkill(userId, skillData) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    const { skillName } = skillData;
    if (!skillName) {
      throw { statusCode: 400, message: 'Skill name is required' };
    }

    // Check for duplicate skill (case-insensitive) for this student
    const existingSkill = await prisma.studentSkill.findFirst({
      where: {
        studentId: student.id,
        skillName: { equals: skillName.trim() },
        deletedAt: null
      }
    });
    if (existingSkill) {
      throw { statusCode: 409, message: `Skill '${skillName}' already exists in your profile` };
    }

    const newSkill = await prisma.studentSkill.create({
      data: {
        studentId: student.id,
        skillName: skillName.trim(),
        source: 'MANUAL'
      }
    });

    return {
      success: true,
      message: 'Skill added successfully',
      skill: {
        id: Number(newSkill.id),
        studentId: Number(newSkill.studentId),
        skillName: newSkill.skillName,
        name: newSkill.skillName,
        source: newSkill.source
      }
    };
  }

  static async deleteSkill(userId, skillId) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    // IDOR protection: verify the skill belongs to this student
    const skill = await prisma.studentSkill.findFirst({
      where: { id: BigInt(skillId), deletedAt: null }
    });

    if (!skill) {
      throw { statusCode: 404, message: 'Skill not found' };
    }

    if (Number(skill.studentId) !== Number(student.id)) {
      throw { statusCode: 403, message: 'Forbidden: You do not have permission to delete this skill' };
    }

    await prisma.studentSkill.update({
      where: { id: BigInt(skillId) },
      data: { deletedAt: new Date() }
    });

    return { success: true, message: 'Skill deleted successfully' };
  }

  static async addProject(userId, projectData) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    // Accept both frontend aliases and canonical Prisma field names
    const {
      title,
      description,
      technologies, techStack,
      githubLink, sourceUrl, githubUrl, gitUrl, githubURL,
      liveLink, demoUrl, liveDemoUrl, liveDemoURL
    } = projectData;
    if (!title) {
      throw { statusCode: 400, message: 'Project title is required' };
    }

    const rawSrc = sourceUrl || githubLink || githubUrl || gitUrl || githubURL;
    const rawDemo = demoUrl || liveLink || liveDemoUrl || liveDemoURL;

    const srcUrlVal = normalizeProjectUrl(rawSrc);
    const demoUrlVal = normalizeProjectUrl(rawDemo);

    const newProject = await prisma.studentProject.create({
      data: {
        studentId: student.id,
        title: title.trim(),
        description: description ? description.trim() : null,
        techStack: (techStack || technologies) ? (techStack || technologies).trim() : null,
        sourceUrl: srcUrlVal,
        demoUrl: demoUrlVal
      }
    });

    return {
      success: true,
      message: 'Project added successfully',
      project: {
        id: Number(newProject.id),
        studentId: Number(newProject.studentId),
        title: newProject.title,
        description: newProject.description,
        techStack: newProject.techStack,
        technologies: newProject.techStack,
        demoUrl: newProject.demoUrl,
        liveLink: newProject.demoUrl,
        liveDemoUrl: newProject.demoUrl,
        liveDemoURL: newProject.demoUrl,
        sourceUrl: newProject.sourceUrl,
        githubLink: newProject.sourceUrl,
        githubUrl: newProject.sourceUrl,
        gitUrl: newProject.sourceUrl,
        githubURL: newProject.sourceUrl,
        projectUrl: newProject.demoUrl || newProject.sourceUrl
      }
    };
  }

  static async updateProject(userId, projectId, projectData) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    const project = await prisma.studentProject.findFirst({
      where: { id: BigInt(projectId), deletedAt: null }
    });

    if (!project) {
      throw { statusCode: 404, message: 'Project not found' };
    }

    if (Number(project.studentId) !== Number(student.id)) {
      throw { statusCode: 403, message: 'Forbidden: You do not have permission to edit this project' };
    }

    const srcInput = projectData.sourceUrl ?? projectData.githubLink ?? projectData.githubUrl ?? projectData.gitUrl ?? projectData.githubURL;
    const demoInput = projectData.demoUrl ?? projectData.liveLink ?? projectData.liveDemoUrl ?? projectData.liveDemoURL;

    const updated = await prisma.studentProject.update({
      where: { id: BigInt(projectId) },
      data: {
        ...(projectData.title && { title: projectData.title.trim() }),
        ...(projectData.description !== undefined && { description: projectData.description }),
        ...((projectData.techStack !== undefined || projectData.technologies !== undefined) && {
          techStack: projectData.techStack || projectData.technologies || null
        }),
        ...(srcInput !== undefined && {
          sourceUrl: normalizeProjectUrl(srcInput)
        }),
        ...(demoInput !== undefined && {
          demoUrl: normalizeProjectUrl(demoInput)
        })
      }
    });

    return {
      success: true,
      message: 'Project updated successfully',
      project: {
        id: Number(updated.id),
        studentId: Number(updated.studentId),
        title: updated.title,
        description: updated.description,
        techStack: updated.techStack,
        technologies: updated.techStack,
        demoUrl: updated.demoUrl,
        liveLink: updated.demoUrl,
        liveDemoUrl: updated.demoUrl,
        liveDemoURL: updated.demoUrl,
        sourceUrl: updated.sourceUrl,
        githubLink: updated.sourceUrl,
        githubUrl: updated.sourceUrl,
        gitUrl: updated.sourceUrl,
        githubURL: updated.sourceUrl,
        projectUrl: updated.demoUrl || updated.sourceUrl
      }
    };
  }

  static async deleteProject(userId, projectId) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    // IDOR protection: verify the project belongs to this student (mirrors Spring Boot StudentProjectService.deleteProject)
    const project = await prisma.studentProject.findFirst({
      where: { id: BigInt(projectId), deletedAt: null }
    });

    if (!project) {
      throw { statusCode: 404, message: 'Project not found' };
    }

    if (Number(project.studentId) !== Number(student.id)) {
      throw { statusCode: 403, message: 'Forbidden: You do not have permission to delete this project' };
    }

    await prisma.studentProject.update({
      where: { id: BigInt(projectId) },
      data: { deletedAt: new Date() }
    });

    return { success: true, message: 'Project deleted successfully' };
  }

  static async updateProfileImage(userId, file, body = {}) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    let imageUrl = body.profileImageUrl || body.url || body.imageUrl;

    if (file) {
      const path = require('path');
      const env = require('../config/env');
      const imagesDir = path.join(env.uploadDir, 'images');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      if (file.filename) {
        imageUrl = `/uploads/images/${file.filename}`;
      } else if (file.buffer) {
        const ext = file.mimetype ? (file.mimetype.split('/')[1] || 'png') : 'png';
        const filename = `student-${student.id}-${Date.now()}.${ext}`;
        const targetPath = path.join(imagesDir, filename);
        fs.writeFileSync(targetPath, file.buffer);
        imageUrl = `/uploads/images/${filename}`;
      } else if (file.path && fs.existsSync(file.path)) {
        const ext = path.extname(file.path) || '.png';
        const filename = `student-${student.id}-${Date.now()}${ext}`;
        const targetPath = path.join(imagesDir, filename);
        fs.copyFileSync(file.path, targetPath);
        imageUrl = `/uploads/images/${filename}`;
      }
    }

    if (!imageUrl) {
      throw { statusCode: 400, message: 'Profile photo is required' };
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.student.update({
        where: { id: student.id },
        data: { profileImageUrl: imageUrl }
      }),
      prisma.user.update({
        where: { id: BigInt(userId) },
        data: { updatedAt: now }
      })
    ]);

    const publicUrl = `/api/public/student/${student.id}/profile-image`;

    return {
      success: true,
      message: 'Profile photo updated successfully',
      url: publicUrl,
      profileImageUrl: publicUrl,
      updatedAt: now.toISOString()
    };
  }

  static async getResumeDetails(userId) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    const latestResume = await prisma.resume.findFirst({
      where: {
        studentId: student.id,
        deletedAt: null
      },
      orderBy: { uploadedAt: 'desc' }
    });

    if (!latestResume) {
      return {
        hasResume: false,
        fileName: null,
        fileUrl: null,
        uploadedAt: null,
        fileSize: null
      };
    }

    return {
      hasResume: true,
      id: Number(latestResume.id),
      fileName: latestResume.fileName,
      fileUrl: latestResume.filePath,    // schema field is filePath
      filePath: latestResume.filePath,
      fileType: latestResume.fileType || 'application/pdf',
      uploadedAt: latestResume.uploadedAt
    };
  }

  static async getResumeFile(userId, resumeId = null) {
    const ResumeService = require('./resume.service');
    return ResumeService.getResumeFileById(userId, resumeId, 'STUDENT');
  }

  static async reExtractSkills(userId) {
    console.log(`[SKILLS-REEXTRACT] studentId=${userId}`);
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    const latestResume = await prisma.resume.findFirst({
      where: { studentId: student.id, deletedAt: null },
      orderBy: { uploadedAt: 'desc' }
    });

    if (!latestResume || !latestResume.filePath) {
      throw { statusCode: 404, message: 'No resume found. Please upload a resume first.' };
    }

    console.log(`[SKILLS-REEXTRACT] resumeId=${latestResume.id}`);
    console.log(`[SKILLS-REEXTRACT] filename=${latestResume.fileName}`);

    const { resolveResumeFilePath } = require('../utils/file.utils');
    const diskPath = resolveResumeFilePath(latestResume.filePath);
    console.log(`[SKILLS-REEXTRACT] resolvedPath=${diskPath}`);

    const fs = require('fs');
    const path = require('path');
    const fileExists = fs.existsSync(diskPath);
    console.log(`[SKILLS-REEXTRACT] fileExists=${fileExists}`);

    if (!fileExists) {
      throw { statusCode: 404, message: 'Resume file is missing from storage. Please re-upload your resume.' };
    }

    const ext = path.extname(diskPath).toLowerCase();
    const mimetype = ext === '.pdf' ? 'application/pdf' : (ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : (ext === '.doc' ? 'application/msword' : 'text/plain'));
    console.log(`[SKILLS-REEXTRACT] extension=${ext}`);
    console.log(`[SKILLS-REEXTRACT] mimeType=${mimetype}`);

    let rawText = '';
    try {
      const OcrService = require('./ocr.service');
      const buffer = fs.readFileSync(diskPath);
      
      const fileObj = {
        buffer,
        mimetype,
        originalname: latestResume.fileName
      };

      // Ensure proper text extraction across PDF/DOCX/Images
      rawText = await OcrService.extractText(fileObj);
    } catch (e) {
      console.error('[SKILLS-REEXTRACT] Extraction error:', e);
      
      if (e.message.startsWith('PDF_SERVICE_ERROR')) {
        throw { statusCode: 500, message: 'PDF text extraction service failed.' };
      }
      if (e.message.startsWith('PDF_UNREADABLE')) {
        throw { statusCode: 422, message: 'Unable to read this PDF. Please upload a valid PDF resume.' };
      }
      if (e.message.startsWith('PDF_NO_TEXT')) {
        throw { statusCode: 422, message: 'This PDF does not contain extractable text. Please upload a text-based PDF or DOCX resume.' };
      }
      if (e.message.includes('Legacy')) {
        throw { statusCode: 422, message: e.message };
      }
      if (mimetype === 'application/pdf') {
        throw { statusCode: 422, message: 'Unable to extract text from this PDF. Please upload a valid text-based resume.' };
      }
      if (ext === '.docx' || ext === '.doc') {
        throw { statusCode: 422, message: 'Unable to read this Word document. Please upload a valid DOCX resume.' };
      }
      throw { statusCode: 500, message: 'Unable to extract skills at the moment. Please try again.' };
    }

    if (!rawText || !rawText.trim()) {
       throw { statusCode: 422, message: 'The resume contains no machine-readable text. Please upload a text-based PDF or use a supported DOCX resume.' };
    }

    console.log(`[SKILLS-REEXTRACT] textLength=${rawText.length}`);

    const { extractSkills } = require('../utils/skillExtraction');
    const extractedSkills = extractSkills(rawText, 0.5);

    if (extractedSkills.length === 0) {
       throw { statusCode: 422, message: 'No supported technical skills were detected in this resume.' };
    }

    console.log(`[SKILLS-REEXTRACT] detectedSkills=${extractedSkills.join(', ')}`);

    await prisma.$transaction(async (tx) => {
      // Delete old AUTO_EXTRACTED skills but preserve MANUAL ones
      await tx.studentSkill.deleteMany({
        where: {
          studentId: student.id,
          source: 'RESUME'
        }
      });

      // Insert new ones, ignoring duplicates against MANUAL skills
      const existingManualSkills = await tx.studentSkill.findMany({
        where: { studentId: student.id, source: 'MANUAL', deletedAt: null }
      });
      const existingNamesLower = new Set(existingManualSkills.map(s => s.skillName.toLowerCase()));

      for (const skillName of extractedSkills) {
        if (!existingNamesLower.has(skillName.toLowerCase())) {
          await tx.studentSkill.create({
            data: {
              studentId: student.id,
              skillName,
              source: 'RESUME'
            }
          });
          existingNamesLower.add(skillName.toLowerCase()); // Avoid duplicates within extracted list
        }
      }
    });

    const allSkills = await prisma.studentSkill.findMany({
      where: { studentId: student.id, deletedAt: null }
    });

    return {
      success: true,
      message: 'Skills re-extracted successfully from your resume.',
      totalSkills: allSkills.length,
      skills: allSkills.map(s => ({
        id: Number(s.id),
        name: s.skillName,
        source: s.source
      }))
    };
  }
}

module.exports = StudentService;
