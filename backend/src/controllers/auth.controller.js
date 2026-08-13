const AuthService = require('../services/auth.service');
const { setAuthCookies, clearAuthCookies } = require('../utils/jwt.utils');

class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      
      setAuthCookies(res, result.accessToken, result.refreshToken);

      console.log(`[AUTH] Login successful for user ${result.user.email} with role ${result.user.role}`);

      res.status(200).json({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        verificationStatus: result.user.verificationStatus,
        token: result.accessToken,
        refreshToken: result.refreshToken,
        success: true,
        message: 'Authentication successful',
        user: result.user
      });
    } catch (err) {
      next(err);
    }
  }

  static async registerStudent(req, res, next) {
    try {
      const result = await AuthService.registerStudent(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async registerAlumni(req, res, next) {
    try {
      console.log("[ALUMNI-REGISTER-UPLOAD]", {
        hasFile: !!req.file,
        originalName: req.file?.originalname,
        mimeType: req.file?.mimetype,
        size: req.file?.size,
        storedPath: req.file?.path
      });
      
      const result = await AuthService.registerAlumni(req.body, req.file, req.ip);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, oldPassword, newPassword, confirmPassword } = req.body;
      const pwdToVerify = currentPassword || oldPassword;
      
      const result = await AuthService.changePassword(userId, pwdToVerify, newPassword, confirmPassword);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async changeEmail(req, res, next) {
    try {
      const userId = req.user.id;
      const { newEmail, currentPassword, password } = req.body;
      const pwdToVerify = currentPassword || password;

      const result = await AuthService.changeEmail(userId, newEmail, pwdToVerify);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res) {
    clearAuthCookies(res);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }
}

module.exports = AuthController;
