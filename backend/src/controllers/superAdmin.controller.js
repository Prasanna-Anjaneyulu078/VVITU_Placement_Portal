const SuperAdminService = require('../services/superAdmin.service');

class SuperAdminController {
  static async getAllAdmins(req, res, next) {
    try {
      const admins = await SuperAdminService.getAllAdmins();
      res.status(200).json(admins);
    } catch (err) {
      next(err);
    }
  }

  static async getAdminById(req, res, next) {
    try {
      const admin = await SuperAdminService.getAdminById(req.params.id);
      res.status(200).json(admin);
    } catch (err) {
      next(err);
    }
  }

  static async createAdmin(req, res, next) {
    try {
      if (req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to create administrator accounts.'
        });
      }
      const result = await SuperAdminService.createAdmin(req.body, req.user?.email);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async updateAdminProfile(req, res, next) {
    try {
      const result = await SuperAdminService.updateAdminProfile(req.params.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async changeAdminEmail(req, res, next) {
    try {
      const { newEmail } = req.body;
      const result = await SuperAdminService.changeAdminEmail(req.params.id, newEmail);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async resetAdminPassword(req, res, next) {
    try {
      const result = await SuperAdminService.resetAdminPassword(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async toggleAdminStatus(req, res, next) {
    try {
      const status = req.query.status || req.body.status;
      const result = await SuperAdminService.toggleAdminStatus(req.params.id, status);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
  static async deleteAdmin(req, res, next) {
    try {
      const result = await SuperAdminService.deleteAdmin(req.params.id, req.user?.email);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SuperAdminController;
