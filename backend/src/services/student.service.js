const fs = require('fs');
const prisma = require('../config/db');

class StudentService {
  static async getProfile(userId) {
    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) },
      include: {
        user: {
          select: { name: true, email: true, role: true }
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
      githubUrl: student.githubUrl,
      linkedinUrl: student.linkedinUrl,
      hackerrankUrl: student.hackerrankUrl,
      profileImageUrl: student.profileImageUrl,
      cgpa: student.cgpa,
      semester: student.semester,
      backlogs: student.backlogs,
      academicStatus: student.academicStatus,
      verificationStatus: student.verificationStatus || 'VERIFIED',
      user: {
        id: Number(student.userId),
        name: student.user.name,
        email: student.user.email,
        role: student.user.role
      },
      skills: student.skills.map((s) => ({
        id: Number(s.id),
        skillName: s.skillName,
        name: s.skillName
      })),
      projects: student.projects.map((p) => ({
        id: Number(p.id),
        title: p.title,
        description: p.description,
        techStack: p.techStack,
        technologies: p.techStack,
        demoUrl: p.demoUrl,
        liveLink: p.demoUrl,
        sourceUrl: p.sourceUrl,
        githubLink: p.sourceUrl
      })),
      resumes: student.resumes.map((r) => ({
        id: Number(r.id),
        fileName: r.fileName,
        fileUrl: r.fileUrl,
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

    const mappedSkills = skills.map((s) => ({
      id: Number(s.id),
      studentId: Number(s.studentId),
      skillName: s.skillName,
      name: s.skillName
    }));

    return [
      {
        categoryName: 'Technical Skills',
        skills: mappedSkills
      }
    ];
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

    return projects.map((p) => ({
      id: Number(p.id),
      studentId: Number(p.studentId),
      title: p.title,
      description: p.description,
      techStack: p.techStack,
      technologies: p.techStack,
      demoUrl: p.demoUrl,
      liveLink: p.demoUrl,
      sourceUrl: p.sourceUrl,
      githubLink: p.sourceUrl
    }));
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
      githubUrl,
      linkedinUrl,
      hackerrankUrl,
      profileImageUrl,
      cgpa,
      backlogs,
      academicStatus
    } = updateData;

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        ...(department !== undefined && { department }),
        ...(mobileNumber !== undefined && { mobileNumber }),
        ...(location !== undefined && { location }),
        ...(githubUrl !== undefined && { githubUrl }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(hackerrankUrl !== undefined && { hackerrankUrl }),
        ...(profileImageUrl !== undefined && { profileImageUrl }),
        ...(cgpa !== undefined && { cgpa: parseFloat(cgpa) }),
        ...(backlogs !== undefined && { backlogs: parseInt(backlogs, 10) }),
        ...(academicStatus !== undefined && { academicStatus })
      }
    });

    return { success: true, message: 'Profile updated successfully', student: updated };
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
        skillName: skillName.trim()
      }
    });

    return {
      success: true,
      message: 'Skill added successfully',
      skill: {
        id: Number(newSkill.id),
        studentId: Number(newSkill.studentId),
        skillName: newSkill.skillName,
        name: newSkill.skillName
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
      githubLink, sourceUrl,
      liveLink, demoUrl
    } = projectData;
    if (!title) {
      throw { statusCode: 400, message: 'Project title is required' };
    }

    const newProject = await prisma.studentProject.create({
      data: {
        studentId: student.id,
        title: title.trim(),
        description: description ? description.trim() : null,
        techStack: (techStack || technologies) ? (techStack || technologies).trim() : null,
        sourceUrl: (sourceUrl || githubLink) ? (sourceUrl || githubLink).trim() : null,
        demoUrl: (demoUrl || liveLink) ? (demoUrl || liveLink).trim() : null
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
        sourceUrl: newProject.sourceUrl,
        githubLink: newProject.sourceUrl
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

    // IDOR protection: verify the project belongs to this student (mirrors Spring Boot StudentProjectService.updateProject)
    const project = await prisma.studentProject.findFirst({
      where: { id: BigInt(projectId), deletedAt: null }
    });

    if (!project) {
      throw { statusCode: 404, message: 'Project not found' };
    }

    if (Number(project.studentId) !== Number(student.id)) {
      throw { statusCode: 403, message: 'Forbidden: You do not have permission to edit this project' };
    }

    const updated = await prisma.studentProject.update({
      where: { id: BigInt(projectId) },
      data: {
        ...(projectData.title && { title: projectData.title.trim() }),
        ...(projectData.description !== undefined && { description: projectData.description }),
        // Accept both canonical and frontend alias field names
        ...((projectData.techStack !== undefined || projectData.technologies !== undefined) && {
          techStack: projectData.techStack || projectData.technologies || null
        }),
        ...((projectData.sourceUrl !== undefined || projectData.githubLink !== undefined) && {
          sourceUrl: projectData.sourceUrl || projectData.githubLink || null
        }),
        ...((projectData.demoUrl !== undefined || projectData.liveLink !== undefined) && {
          demoUrl: projectData.demoUrl || projectData.liveLink || null
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
        sourceUrl: updated.sourceUrl,
        githubLink: updated.sourceUrl
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
    let imageUrl = body.profileImageUrl || body.url || body.imageUrl;

    if (file) {
      if (file.buffer) {
        const base64 = file.buffer.toString('base64');
        imageUrl = `data:${file.mimetype};base64,${base64}`;
      } else if (file.path && fs.existsSync(file.path)) {
        const buffer = fs.readFileSync(file.path);
        imageUrl = `data:${file.mimetype || 'image/png'};base64,${buffer.toString('base64')}`;
      } else if (file.filename) {
        imageUrl = `http://localhost:8082/uploads/images/${file.filename}`;
      }
    }

    if (!imageUrl) {
      throw { statusCode: 400, message: 'Profile photo is required' };
    }

    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    await prisma.student.update({
      where: { id: student.id },
      data: { profileImageUrl: imageUrl }
    });

    return {
      success: true,
      message: 'Profile photo updated successfully',
      url: imageUrl,
      profileImageUrl: imageUrl
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
    const path = require('path');
    const env = require('../config/env');

    const student = await prisma.student.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!student) {
      throw { statusCode: 404, message: 'Student profile not found' };
    }

    let resumeRecord = null;
    if (resumeId) {
      resumeRecord = await prisma.resume.findFirst({
        where: { id: BigInt(resumeId), studentId: student.id, deletedAt: null }
      });
    } else {
      resumeRecord = await prisma.resume.findFirst({
        where: { studentId: student.id, deletedAt: null },
        orderBy: { uploadedAt: 'desc' }
      });
    }

    if (!resumeRecord) {
      throw { statusCode: 404, message: 'Resume file not found. Please upload your resume again.' };
    }

    // Schema field is filePath (mapped from file_path column)
    const storedPath = resumeRecord.filePath;
    if (!storedPath) {
      throw { statusCode: 404, message: 'Resume file path not recorded. Please re-upload your resume.' };
    }
    const baseFileName = path.basename(storedPath);
    const filePath = path.join(env.uploadDir, 'resumes', baseFileName);

    if (!fs.existsSync(filePath)) {
      throw { statusCode: 404, message: 'Resume file missing from storage. Please re-upload your resume.' };
    }

    return {
      filePath,
      fileName: resumeRecord.fileName || `${student.rollNumber || 'Student'}_Resume.pdf`,
      mimeType: resumeRecord.fileType || 'application/pdf'
    };
  }
}

module.exports = StudentService;
