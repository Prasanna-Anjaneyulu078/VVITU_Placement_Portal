const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: parseInt(process.env.PORT || '8082', 10),
  env: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: parseInt(process.env.JWT_EXPIRATION || '86400000', 10),
  jwtRefreshExpiration: parseInt(process.env.JWT_REFRESH_EXPIRATION || '604800000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173').split(','),
  uploadDir: process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(__dirname, '../../uploads'),
  geminiApiKey: process.env.GEMINI_API_KEY || ''
};
