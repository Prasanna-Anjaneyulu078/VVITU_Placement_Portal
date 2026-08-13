const prisma = require('../config/db');
const path = require('path');
const fs = require('fs');

class PublicController {
  static async handleImageResponse(res, imageUrl) {
    if (!imageUrl) {
      return res.status(404).json({ success: false, message: 'Profile image not found' });
    }

    if (imageUrl.startsWith('data:image/')) {
      // Parse base64 string
      const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ success: false, message: 'Invalid base64 image data' });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(buffer);
    } else if (imageUrl.startsWith('/uploads/')) {
      const env = require('../config/env');
      const relativePath = imageUrl.substring('/uploads/'.length);
      const physicalPath = path.resolve(env.uploadDir, relativePath);

      if (fs.existsSync(physicalPath)) {
        const ext = path.extname(physicalPath).toLowerCase();
        let contentType = 'image/jpeg';
        if (ext === '.png') contentType = 'image/png';
        if (ext === '.webp') contentType = 'image/webp';
        if (ext === '.gif') contentType = 'image/gif';
        if (ext === '.svg') contentType = 'image/svg+xml';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.sendFile(physicalPath);
      }
      return res.status(404).json({ success: false, message: 'Profile image file not found on server' });
    } else if (imageUrl.startsWith('http')) {
      return res.redirect(302, imageUrl);
    } else {
      return res.status(404).json({ success: false, message: 'Profile image not found' });
    }
  }

  static async getAlumniProfileImage(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ success: false, message: 'Invalid alumni ID' });
      }

      const alumni = await prisma.alumni.findUnique({
        where: { id: BigInt(id) }
      });

      if (!alumni || !alumni.profileImageUrl) {
        return res.status(404).json({ success: false, message: 'Profile image not found' });
      }

      return PublicController.handleImageResponse(res, alumni.profileImageUrl);
    } catch (err) {
      next(err);
    }
  }

  static async getStudentProfileImage(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ success: false, message: 'Invalid student ID' });
      }

      const student = await prisma.student.findUnique({
        where: { id: BigInt(id) }
      });

      if (!student || !student.profileImageUrl) {
        return res.status(404).json({ success: false, message: 'Profile image not found' });
      }

      return PublicController.handleImageResponse(res, student.profileImageUrl);
    } catch (err) {
      next(err);
    }
  }

  static async getAdminProfileImage(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ success: false, message: 'Invalid admin ID' });
      }

      const user = await prisma.user.findUnique({
        where: { id: BigInt(id), role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }

      const adminProfile = await prisma.adminProfile.findUnique({
        where: { userId: user.id }
      });

      if (!adminProfile || !adminProfile.profileImageUrl) {
        return res.status(404).json({ success: false, message: 'Profile image not found' });
      }

      return PublicController.handleImageResponse(res, adminProfile.profileImageUrl);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PublicController;
