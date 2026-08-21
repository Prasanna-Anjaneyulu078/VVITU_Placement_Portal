const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const env = require('../config/env');

let useCloudinary = false;

// Configure Cloudinary
if (env.cloudinary && env.cloudinary.cloudName) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret
  });
  useCloudinary = true;
} else {
  console.warn('[WARNING] Cloudinary is not configured. Falling back to local disk storage.');
}

let storage;
if (useCloudinary) {
  storage = multer.memoryStorage();
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let folder = 'documents';
      const ext = path.extname(file.originalname).toLowerCase();
      if (file.mimetype.startsWith('image/')) folder = 'images';
      else if (file.mimetype === 'application/pdf' || ext === '.pdf') folder = 'resumes';
      else if (file.mimetype.startsWith('video/')) folder = 'videos';

      const destPath = path.join(env.uploadDir || path.join(__dirname, '../../uploads'), folder);
      fs.mkdirSync(destPath, { recursive: true });
      cb(null, destPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
    }
  });
}

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

    const uploadToCloudinary = (file) => {
      return new Promise((resolve, reject) => {
        const ext = path.extname(file.originalname).toLowerCase();
        let folder = 'documents';
        let resourceType = 'raw';
        
        if (file.mimetype.startsWith('image/')) {
          folder = 'images';
          resourceType = 'auto';
        } else if (file.mimetype.startsWith('video/')) {
          resourceType = 'auto';
        } else if (file.mimetype === 'application/pdf' || ext === '.pdf') {
          folder = 'resumes';
          resourceType = 'raw';
        }

        const options = {
          folder: `vvitu_placement_portal/${folder}`,
          resource_type: resourceType
        };

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    stream.end(file.buffer);
  });
};

const uploadAnyFile = (req, res, next) => {
  anyUpload(req, res, async (err) => {
    if (err) return next(err);

    const files = req.files || [];
    let fileToProcess = null;

    if (files.length > 0) {
      fileToProcess = files.find((f) => f.fieldname === 'resume') ||
                 files.find((f) => f.fieldname === 'file') ||
                 files.find((f) => f.fieldname === 'document') ||
                 files.find((f) => f.fieldname === 'verificationDoc') ||
                 files.find((f) => f.fieldname === 'image') ||
                 files.find((f) => f.fieldname === 'profileImage') ||
                 files[0];
    } else if (req.file) {
      fileToProcess = req.file;
    }

    if (fileToProcess) {
      if (useCloudinary && fileToProcess.buffer) {
        try {
          const result = await uploadToCloudinary(fileToProcess);
          fileToProcess.relativePath = result.secure_url;
          fileToProcess.path = result.secure_url; // Some parts might expect file.path
          req.file = fileToProcess;
        } catch (uploadErr) {
          return next(uploadErr);
        }
      } else if (!useCloudinary && fileToProcess.filename) {
        // Local upload case
        const folderName = path.basename(path.dirname(fileToProcess.path));
        fileToProcess.relativePath = `/uploads/${folderName}/${fileToProcess.filename}`;
        req.file = fileToProcess;
      }
    }
    
    next();
  });
};

module.exports = upload;
module.exports.uploadAnyFile = uploadAnyFile;
module.exports.handleResumeUpload = uploadAnyFile;
