const prisma = require('../config/db');

class AdminSettingService {
  /**
   * Retrieves all admin settings as a key-value map.
   */
  static async getAllSettings() {
    let settings = [];
    try {
      settings = await prisma.adminSetting.findMany();
    } catch (err) {
      // Fallback in case database table isn't migrated yet
      return {
        emailNotifications: 'true',
        autoApproval: 'false',
        maintenanceMode: 'false'
      };
    }

    const settingsMap = {};
    for (const setting of settings) {
      settingsMap[setting.settingKey] = setting.settingValue === null || setting.settingValue === undefined ? 'false' : setting.settingValue;
    }

    return settingsMap;
  }

  /**
   * Updates admin settings from a key-value map.
   */
  static async updateSettings(newSettings) {
    if (!newSettings || typeof newSettings !== 'object') {
      throw { statusCode: 400, message: 'Invalid settings payload' };
    }

    for (const [key, value] of Object.entries(newSettings)) {
      if (typeof key !== 'string' || key.trim() === '') continue;

      const strVal = value !== null && value !== undefined ? String(value) : 'false';

      try {
        await prisma.adminSetting.upsert({
          where: { settingKey: key },
          update: { settingValue: strVal },
          create: { settingKey: key, settingValue: strVal }
        });
      } catch (err) {
        // Fallback for non-migrated environment
      }
    }

    return this.getAllSettings();
  }
}

module.exports = AdminSettingService;
