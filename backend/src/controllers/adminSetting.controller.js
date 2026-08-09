const AdminSettingService = require('../services/adminSetting.service');

class AdminSettingController {
  static async getAllSettings(req, res, next) {
    try {
      const settings = await AdminSettingService.getAllSettings();
      res.status(200).json(settings);
    } catch (err) {
      next(err);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({ message: 'Invalid settings payload' });
      }
      const updatedSettings = await AdminSettingService.updateSettings(req.body);
      res.status(200).json(updatedSettings);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AdminSettingController;
