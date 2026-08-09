const prisma = require('../config/db');
const { hashPassword } = require('../utils/password.utils');

class SuperAdminService {
  static async getAllAdmins() {
    const adminProfiles = await prisma.adminProfile.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, accountStatus: true, createdAt: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return adminProfiles.map((ap) => ({
      id: Number(ap.id),
      userId: Number(ap.userId),
      name: ap.user?.name || '',
      email: ap.user?.email || '',
      role: ap.user?.role || 'ADMIN',
      accountStatus: ap.user?.accountStatus || 'ACTIVE',
      department: ap.department || 'Administration',
      designation: ap.designation || 'System Admin',
      phone: ap.phone || '',
      createdAt: ap.user?.createdAt || ap.createdAt
    }));
  }

  static async getAdminById(adminId) {
    const admin = await prisma.adminProfile.findUnique({
      where: { id: BigInt(adminId) },
      include: { user: true }
    });

    if (!admin || admin.deletedAt) {
      throw { statusCode: 404, message: `Admin profile not found with ID: ${adminId}` };
    }

    return {
      id: Number(admin.id),
      userId: Number(admin.userId),
      name: admin.user?.name || '',
      email: admin.user?.email || '',
      role: admin.user?.role || 'ADMIN',
      accountStatus: admin.user?.accountStatus || 'ACTIVE',
      department: admin.department || 'Administration',
      designation: admin.designation || 'System Admin',
      phone: admin.phone || '',
      createdAt: admin.user?.createdAt || admin.createdAt
    };
  }

  static async createAdmin(data, operatorEmail = null) {
    const { name, email, password, department, designation, phone, role } = data;

    if (!email || !email.trim()) {
      throw { statusCode: 400, message: 'Email is required' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      throw { statusCode: 400, message: 'User with this email already exists' };
    }

    const tempPassword = password || `VVIT@Admin${Math.floor(100 + Math.random() * 900)}`;
    const hashedPassword = await hashPassword(tempPassword);
    const assignedRole = role && ['ADMIN', 'SUPER_ADMIN'].includes(role) ? role : 'ADMIN';

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name ? name.trim() : 'Admin User',
          email: cleanEmail,
          password: hashedPassword,
          role: assignedRole,
          accountStatus: 'ACTIVE'
        }
      });

      const newAdminProfile = await tx.adminProfile.create({
        data: {
          userId: newUser.id,
          department: department ? department.trim() : 'Administration',
          designation: designation ? designation.trim() : 'System Admin',
          phone: phone ? phone.trim() : null
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE_ADMIN',
          details: `Created admin account: Name=${newUser.name}, Email=${cleanEmail}, Role=${assignedRole}`
        }
      });

      return { newUser, newAdminProfile };
    });

    return {
      name: result.newUser.name,
      email: result.newUser.email,
      password: tempPassword,
      temporaryPassword: tempPassword,
      role: result.newUser.role
    };
  }

  static async updateAdminProfile(adminId, updateData) {
    const admin = await prisma.adminProfile.findUnique({
      where: { id: BigInt(adminId) },
      include: { user: true }
    });

    if (!admin || !admin.user) {
      throw { statusCode: 404, message: `Admin profile not found with ID: ${adminId}` };
    }

    const { name, department, designation, phone, role } = updateData;

    await prisma.$transaction(async (tx) => {
      if (name || role) {
        await tx.user.update({
          where: { id: admin.userId },
          data: {
            ...(name && { name: name.trim() }),
            ...(role && ['ADMIN', 'SUPER_ADMIN'].includes(role) && { role })
          }
        });
      }

      await tx.adminProfile.update({
        where: { id: admin.id },
        data: {
          ...(department !== undefined && { department: department ? department.trim() : null }),
          ...(designation !== undefined && { designation: designation ? designation.trim() : null }),
          ...(phone !== undefined && { phone: phone ? phone.trim() : null })
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'ADMIN_PROFILE_UPDATED',
          details: `Updated profile for admin ID ${adminId}`
        }
      });
    });

    return this.getAdminById(adminId);
  }

  static async changeAdminEmail(adminId, newEmail) {
    if (!newEmail || !newEmail.trim()) {
      throw { statusCode: 400, message: 'New email address is required' };
    }

    const cleanEmail = newEmail.trim().toLowerCase();

    const admin = await prisma.adminProfile.findUnique({
      where: { id: BigInt(adminId) },
      include: { user: true }
    });

    if (!admin || !admin.user) {
      throw { statusCode: 404, message: `Admin profile not found with ID: ${adminId}` };
    }

    if (admin.user.email.toLowerCase() === cleanEmail) {
      return this.getAdminById(adminId);
    }

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      throw { statusCode: 400, message: 'This email address is already associated with another account.' };
    }

    await prisma.user.update({
      where: { id: admin.userId },
      data: { email: cleanEmail }
    });

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_EMAIL_CHANGED',
        details: `Changed email for admin ID ${adminId} to ${cleanEmail}`
      }
    });

    return this.getAdminById(adminId);
  }

  static async resetAdminPassword(adminId) {
    const admin = await prisma.adminProfile.findUnique({
      where: { id: BigInt(adminId) },
      include: { user: true }
    });

    if (!admin || !admin.user) {
      throw { statusCode: 404, message: `Admin profile not found with ID: ${adminId}` };
    }

    const tempPassword = `VVIT@Admin${Math.floor(100 + Math.random() * 900)}`;
    const hashedPassword = await hashPassword(tempPassword);

    await prisma.user.update({
      where: { id: admin.userId },
      data: {
        password: hashedPassword,
        passwordChanged: false
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_PASSWORD_RESET',
        details: `Reset password for admin: ${admin.user.name} (${admin.user.email})`
      }
    });

    return {
      name: admin.user.name,
      email: admin.user.email,
      password: tempPassword,
      temporaryPassword: tempPassword,
      designation: admin.designation
    };
  }

  static async toggleAdminStatus(adminId, status) {
    const validStatuses = ['ACTIVE', 'INACTIVE', 'BLOCKED'];
    if (!status || !validStatuses.includes(status)) {
      throw { statusCode: 400, message: 'Invalid account status' };
    }

    const admin = await prisma.adminProfile.findUnique({
      where: { id: BigInt(adminId) },
      include: { user: true }
    });

    if (!admin || !admin.user) {
      throw { statusCode: 404, message: `Admin profile not found with ID: ${adminId}` };
    }

    await prisma.user.update({
      where: { id: admin.userId },
      data: { accountStatus: status }
    });

    await prisma.auditLog.create({
      data: {
        action: status === 'ACTIVE' ? 'ADMIN_ACCOUNT_ACTIVATED' : 'ADMIN_ACCOUNT_DEACTIVATED',
        details: `Toggled status for admin ID ${adminId} to ${status}`
      }
    });

    return this.getAdminById(adminId);
  }
}

module.exports = SuperAdminService;
