const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 8082,
  env: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/vvit_placement_db',
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: process.env.DB_PORT || 3306,
  dbName: process.env.DB_NAME || 'vvit_placement_db',
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || 'password',
  jwtSecret: process.env.JWT_SECRET || 'dnZpdF9wbGFjZW1lbnRfcG9ydGFsX3N1cGVyX3NlY3JldF9qd3Rfa2V5XzIwMjRfZG9fbm90X2V4cG9zZQ==',
  jwtExpiration: parseInt(process.env.JWT_EXPIRATION || '86400000', 10),
  jwtRefreshExpiration: parseInt(process.env.JWT_REFRESH_EXPIRATION || '604800000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173').split(','),
  uploadDir: path.join(__dirname, '../../uploads'),
  geminiApiKey: process.env.GEMINI_API_KEY || ''
};
