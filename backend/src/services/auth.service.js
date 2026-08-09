const prisma = require('../config/db');
const { hashPassword, comparePassword, validatePasswordRequirements } = require('../utils/password.utils');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt.utils');

class AuthService {
  static async login(email, password) {
    if (!email || !email.trim() || !password) {
      throw { statusCode: 400, message: 'Email and password are required' };
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: { email: cleanEmail },
      include: {
        student: true,
        alumni: true
      }
    });

    if (!user || user.deletedAt) {
      throw { statusCode: 401, message: 'Invalid email or password. Please check your credentials and try again.' };
    }

    if (user.accountStatus && user.accountStatus !== 'ACTIVE') {
      throw { statusCode: 401, message: 'Your account is disabled or blocked. Please contact admin.' };
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Invalid email or password. Please check your credentials and try again.' };
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    let verificationStatus = null;
    if (user.role === 'ALUMNI' && user.alumni) {
      verificationStatus = user.alumni.verificationStatus || null;
    } else if (user.role === 'STUDENT' && user.student) {
      verificationStatus = user.student.verificationStatus || 'VERIFIED';
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus
      }
    };
  }

  static async registerStudent(data) {
    const { name, email, password, rollNumber, department, mobileNumber } = data;

    if (!name || !email || !password || !rollNumber) {
      throw { statusCode: 400, message: 'Name, email, password, and roll number are required' };
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findFirst({ where: { email: cleanEmail } });
    if (existingUser) {
      throw { statusCode: 400, message: 'User with this email already exists' };
    }

    const existingRoll = await prisma.student.findUnique({ where: { rollNumber: rollNumber.trim() } });
    if (existingRoll) {
      throw { statusCode: 400, message: 'Student with this roll number already registered' };
    }

    const hashedPassword = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: hashedPassword,
          role: 'STUDENT',
          accountStatus: 'ACTIVE'
        }
      });

      const newStudent = await tx.student.create({
        data: {
          userId: newUser.id,
          rollNumber: rollNumber.trim(),
          department: department ? department.trim() : null,
          mobileNumber: mobileNumber ? mobileNumber.trim() : null
        }
      });

      return { newUser, newStudent };
    });

    return { success: true, message: 'Student registered successfully' };
  }

  static async registerAlumni(data, file) {
    const { name, email, password, company, designation, passingYear } = data;

    if (!name || !email || !password) {
      throw { statusCode: 400, message: 'Name, email, and password are required' };
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findFirst({ where: { email: cleanEmail } });
    if (existingUser) {
      throw { statusCode: 400, message: 'User with this email already exists' };
    }

    const hashedPassword = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: hashedPassword,
          role: 'ALUMNI',
          accountStatus: 'ACTIVE'
        }
      });

      await tx.alumni.create({
        data: {
          userId: newUser.id,
          company: company ? company.trim() : null,
          designation: designation ? designation.trim() : null,
          passingYear: passingYear ? parseInt(passingYear, 10) : null,
          verificationStatus: 'PENDING',
          profileImageUrl: file ? `/uploads/documents/${file.filename}` : null
        }
      });
    });

    return { success: true, message: 'Alumni registered successfully! Pending verification.' };
  }

  static async changePassword(userId, currentPassword, newPassword, confirmPassword) {
    if (!currentPassword) {
      throw { statusCode: 400, message: 'Current password is required' };
    }
    if (newPassword !== confirmPassword) {
      throw { statusCode: 400, message: 'New password and confirm password do not match' };
    }
    if (!validatePasswordRequirements(newPassword)) {
      throw { statusCode: 400, message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.' };
    }

    const user = await prisma.user.findUnique({ where: { id: BigInt(userId) } });
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      throw { statusCode: 400, message: 'Current password is incorrect' };
    }

    const newHashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: newHashedPassword,
        passwordChanged: true
      }
    });

    return { success: true, message: 'Password changed successfully' };
  }
}

module.exports = AuthService;
