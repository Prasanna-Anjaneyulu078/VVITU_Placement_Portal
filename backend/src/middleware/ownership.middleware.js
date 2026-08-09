/**
 * IDOR (Insecure Direct Object Reference) Protection Middleware
 *
 * Reusable middleware that verifies resource ownership before allowing
 * mutating operations. The middleware follows the same access rules as
 * the Spring Boot reference implementation.
 *
 * Spring Boot references:
 *  - StudentProjectService.updateProject() / deleteProject() — ownership checked via student.getId().equals(student.getId())
 *  - StudentProjectService.deleteProject()                   — same check
 *  - ApplicationService.updateApplicationStatus()            — no explicit check (alumni already gated by getJobApplicationsForAlumni)
 */

const prisma = require('../config/db');

/**
 * Verifies that a StudentProject (req.params.id) belongs to the authenticated student.
 * Returns 403 Forbidden if the project belongs to a different student.
 */
const requireProjectOwnership = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const userId = req.user && req.user.id;

    if (!projectId || !userId) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }

    const project = await prisma.studentProject.findFirst({
      where: { id: BigInt(projectId), deletedAt: null },
      include: { student: { select: { userId: true } } }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (Number(project.student.userId) !== Number(userId)) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to modify this project' });
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Verifies that a StudentSkill (req.params.id) belongs to the authenticated student.
 * Returns 403 Forbidden if the skill belongs to a different student.
 */
const requireSkillOwnership = async (req, res, next) => {
  try {
    const skillId = req.params.id;
    const userId = req.user && req.user.id;

    if (!skillId || !userId) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }

    const skill = await prisma.studentSkill.findFirst({
      where: { id: BigInt(skillId), deletedAt: null },
      include: { student: { select: { userId: true } } }
    });

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    if (Number(skill.student.userId) !== Number(userId)) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this skill' });
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Verifies that an Application (req.params.id) belongs to a job posted by the
 * authenticated alumni. Alumni must not be able to update status on another
 * alumni's job applications.
 *
 * Spring Boot reference: ApplicationService.getJobApplicationsForAlumni() verifies
 * job.getPostedBy().getId().equals(alumni.getId()) before returning applications.
 * The status update must apply the same constraint.
 */
const requireApplicationJobOwnershipForAlumni = async (req, res, next) => {
  try {
    const applicationId = req.params.id;
    const userId = req.user && req.user.id;

    if (!applicationId || !userId) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }

    const alumni = await prisma.alumni.findUnique({
      where: { userId: BigInt(userId) }
    });

    if (!alumni) {
      return res.status(404).json({ message: 'Alumni profile not found' });
    }

    const application = await prisma.application.findFirst({
      where: { id: BigInt(applicationId), deletedAt: null },
      include: { job: { select: { postedByAlumniId: true } } }
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (!application.job || Number(application.job.postedByAlumniId) !== Number(alumni.id)) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to update the status of this application' });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requireProjectOwnership,
  requireSkillOwnership,
  requireApplicationJobOwnershipForAlumni
};
