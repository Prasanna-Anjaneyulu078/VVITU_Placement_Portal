const prisma = require('../config/db');
const path = require('path');
const fs = require('fs');

const DEFAULT_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

class PublicController {
  static sendImageFallback(res, statusCode = 404) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(statusCode).send(DEFAULT_AVATAR_SVG);
  }

  static async handleImageResponse(res, imageUrl) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (!imageUrl) {
      return PublicController.sendImageFallback(res, 404);
    }

    if (imageUrl.startsWith('data:image/')) {
      // Parse base64 string
      const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return PublicController.sendImageFallback(res, 400);
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(buffer);
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return res.redirect(302, imageUrl);
    }

    const env = require('../config/env');
    let cleanRelPath = imageUrl;
    if (cleanRelPath.startsWith('/uploads/')) {
      cleanRelPath = cleanRelPath.substring('/uploads/'.length);
    } else if (cleanRelPath.startsWith('uploads/')) {
      cleanRelPath = cleanRelPath.substring('uploads/'.length);
    } else if (cleanRelPath.startsWith('/')) {
      cleanRelPath = cleanRelPath.substring(1);
    }

    const possiblePaths = [
      path.resolve(env.uploadDir, cleanRelPath),
      path.resolve(env.uploadDir, 'images', cleanRelPath),
      path.resolve(env.uploadDir, 'images', path.basename(cleanRelPath)),
      path.resolve(env.uploadDir, path.basename(cleanRelPath))
    ];

    for (const physicalPath of possiblePaths) {
      if (fs.existsSync(physicalPath) && fs.statSync(physicalPath).isFile()) {
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
    }

    return PublicController.sendImageFallback(res, 404);
  }

  static async getAlumniProfileImage(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return PublicController.sendImageFallback(res, 400);
      }

      const alumni = await prisma.alumni.findUnique({
        where: { id: BigInt(id) }
      });

      if (!alumni || !alumni.profileImageUrl) {
        return PublicController.sendImageFallback(res, 404);
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
        return PublicController.sendImageFallback(res, 400);
      }

      const student = await prisma.student.findUnique({
        where: { id: BigInt(id) }
      });

      if (!student || !student.profileImageUrl) {
        return PublicController.sendImageFallback(res, 404);
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
        return PublicController.sendImageFallback(res, 400);
      }

      const user = await prisma.user.findUnique({
        where: { id: BigInt(id), role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
      });

      if (!user) {
        return PublicController.sendImageFallback(res, 404);
      }

      const adminProfile = await prisma.adminProfile.findUnique({
        where: { userId: user.id }
      });

      if (!adminProfile || !adminProfile.profileImageUrl) {
        return PublicController.sendImageFallback(res, 404);
      }

      return PublicController.handleImageResponse(res, adminProfile.profileImageUrl);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PublicController;
