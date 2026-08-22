const prisma = require('../config/db');

const DEPARTMENTS = [
  { code: 'CSE', name: 'Computer Science and Engineering' },
  { code: 'IT', name: 'Information Technology' },
  { code: 'AIML', name: 'Artificial Intelligence and Machine Learning' },
  { code: 'CSM', name: 'Computer Science and Engineering (Artificial Intelligence & Machine Learning)' },
  { code: 'AIDS', name: 'Artificial Intelligence and Data Science' },
  { code: 'CSO', name: 'Computer Science and Engineering (Internet of Things)' },
  { code: 'CIC', name: 'Computer Science and Information Technology' },
  { code: 'ECE', name: 'Electronics and Communication Engineering' },
  { code: 'EEE', name: 'Electrical and Electronics Engineering' },
  { code: 'CIVIL', name: 'Civil Engineering' },
  { code: 'MECH', name: 'Mechanical Engineering' }
];

class AccessControlService {
  /**
   * Retrieves the access scope for an admin user based on their role and department.
   * @param {string|number} userIdOrEmail - The user ID or email of the admin
   * @returns {Promise<{ type: 'GLOBAL' | 'DEPARTMENT', departmentId?: string, departmentCodes?: string[] }>}
   */
  static async getAdminAccessScope(userIdOrEmail) {
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

    // Super Admins have global access
    if (user.role === 'SUPER_ADMIN') {
      return { type: 'GLOBAL' };
    }

    // If not a SUPER_ADMIN but they don't have an admin profile, fail safely to restricted access (empty department)
    const department = user.adminProfile?.department?.trim();
    if (!department) {
      return { type: 'DEPARTMENT', departmentId: '' }; // Restricted with no valid department
    }

    // Placement Cell admins have global access
    if (department.toLowerCase() === 'placement cell') {
      return { type: 'GLOBAL' };
    }

    // Normal admins are restricted to their department
    const deptLower = department.toLowerCase();
    const deptInfo = DEPARTMENTS.find(d => d.code.toLowerCase() === deptLower || d.name.toLowerCase() === deptLower);
    
    return { 
      type: 'DEPARTMENT', 
      departmentId: department,
      departmentCodes: deptInfo ? [deptInfo.code, deptInfo.name] : [department]
    };
  }

  /**
   * Verifies if the scope can access the given department.
   * @param {Object} accessScope - The scope object from getAdminAccessScope
   * @param {string} targetDepartment - The department to check access against
   * @returns {boolean}
   */
  static canAccessDepartment(accessScope, targetDepartment) {
    if (accessScope.type === 'GLOBAL') return true;
    if (!targetDepartment) return false;
    
    const targetLower = targetDepartment.trim().toLowerCase();
    if (accessScope.departmentCodes && accessScope.departmentCodes.length > 0) {
       return accessScope.departmentCodes.some(c => c.toLowerCase() === targetLower);
    }
    
    return accessScope.departmentId.toLowerCase() === targetLower;
  }

  /**
   * Generates a Prisma 'where' clause fragment for filtering by department if necessary.
   * @param {Object} accessScope - The scope object from getAdminAccessScope
   * @param {string} departmentField - The field name in the Prisma model (default: 'department')
   * @returns {Object}
   */
  static getDepartmentFilter(accessScope, departmentField = 'department') {
    if (accessScope.type === 'GLOBAL') {
      return {};
    }
    if (accessScope.departmentCodes && accessScope.departmentCodes.length > 0) {
      return {
        [departmentField]: { in: accessScope.departmentCodes, mode: 'insensitive' }
      };
    }
    return {
      [departmentField]: { equals: accessScope.departmentId, mode: 'insensitive' }
    };
  }

  /**
   * Generates a Prisma 'where' clause fragment for filtering jobs by department.
   * Admins can see jobs ONLY if they are posted by an Alumni or Admin from their same department,
   * OR if the job is a global job posted by the Placement Cell / Super Admin.
   */
  static getJobDepartmentFilter(accessScope) {
    if (accessScope.type === 'GLOBAL') {
      return {};
    }
    if (accessScope.departmentCodes && accessScope.departmentCodes.length > 0) {
      const orConditions = [
        ...accessScope.departmentCodes.map(code => ({
          postedByAlumni: { department: { equals: code, mode: 'insensitive' } }
        })),
        ...accessScope.departmentCodes.map(code => ({
          createdBy: { adminProfile: { department: { equals: code, mode: 'insensitive' } } }
        })),
        { createdBy: { role: 'SUPER_ADMIN' } },
        { createdBy: { adminProfile: { department: { equals: 'Placement Cell', mode: 'insensitive' } } } },
        { createdBy: { adminProfile: null } },
        { createdById: null, postedByAlumniId: null } // Seeded jobs
      ];
      return { AND: [{ OR: orConditions }] };
    }
    return {};
  }

  /**
   * Checks if a specific job object can be accessed by the given access scope.
   */
  static canAccessJob(accessScope, job) {
    if (!accessScope || accessScope.type === 'GLOBAL') {
      return true;
    }
    
    if (accessScope.type === 'DEPARTMENT') {
      // Check if posted by global admin or seeded job
      if (!job.createdBy && !job.postedByAlumni) return true;
      if (job.createdBy) {
        if (job.createdBy.role === 'SUPER_ADMIN') return true;
        if (!job.createdBy.adminProfile) return true;
        if (job.createdBy.adminProfile.department?.toLowerCase() === 'placement cell') return true;
      }

      // Check if posted by alumni from same department
      if (job.postedByAlumni && job.postedByAlumni.department) {
        return this.canAccessDepartment(accessScope, job.postedByAlumni.department);
      }
      // Check if posted by admin from same department
      if (job.createdBy && job.createdBy.adminProfile && job.createdBy.adminProfile.department) {
        return this.canAccessDepartment(accessScope, job.createdBy.adminProfile.department);
      }
      
      return false; // Not accessible
    }
    
    return false;
  }
}

module.exports = AccessControlService;
