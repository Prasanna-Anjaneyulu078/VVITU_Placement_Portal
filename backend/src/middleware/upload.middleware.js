const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');

// Ensure upload directories exist
const uploadDirs = ['images', 'resumes', 'documents'];
uploadDirs.forEach((dir) => {
  const fullPath = path.join(env.uploadDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'documents';
    const ext = path.extname(file.originalname).toLowerCase();
    const originalUrl = req.originalUrl ? req.originalUrl.toLowerCase() : '';

    if (
      file.fieldname === 'profileImage' ||
      file.fieldname === 'image' ||
      file.mimetype.startsWith('image/')
    ) {
      folder = 'images';
    } else if (
      file.fieldname === 'resume' ||
      file.fieldname === 'file' ||
      originalUrl.includes('/resume') ||
      file.mimetype === 'application/pdf' ||
      file.mimetype.includes('wordprocessingml') ||
      file.mimetype.includes('msword') ||
      ext === '.pdf' ||
      ext === '.doc' ||
      ext === '.docx'
    ) {
      folder = 'resumes';
    }

    cb(null, path.join(env.uploadDir, folder));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const prefix = file.fieldname === 'profileImage' || file.fieldname === 'image' ? 'img' : 'student';
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'text/plain',
    'application/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx', '.csv', '.xls', '.xlsx'];

  if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    const err = new Error('Unsupported file type. Only standard documents, images, PDF, and spreadsheets are allowed.');
    err.statusCode = 400;
    cb(err);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

const anyUpload = upload.any();

// Universal single-pass multipart handler that accepts any field name ('file', 'resume', 'document', 'verificationDoc', etc.)
const uploadAnyFile = (req, res, next) => {
  anyUpload(req, res, (err) => {
    if (err) {
      return next(err);
    }
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.file = req.files.find((f) => f.fieldname === 'resume') ||
                 req.files.find((f) => f.fieldname === 'file') ||
                 req.files.find((f) => f.fieldname === 'document') ||
                 req.files.find((f) => f.fieldname === 'verificationDoc') ||
                 req.files.find((f) => f.fieldname === 'image') ||
                 req.files.find((f) => f.fieldname === 'profileImage') ||
                 req.files[0];
    }
    next();
  });
};

module.exports = upload;
module.exports.uploadAnyFile = uploadAnyFile;
module.exports.handleResumeUpload = uploadAnyFile;
