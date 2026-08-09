import fs from 'fs';
import dotenv from 'dotenv';

// If building for production, we want to ensure VITE_API_BASE_URL is set,
// either in the environment or in the .env.production file.

console.log('Validating environment variables for production build...');

// Load environment variables from .env.production if it exists
if (fs.existsSync('.env.production')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env.production'));
  for (const k in envConfig) {
    if (!process.env[k]) {
        process.env[k] = envConfig[k];
    }
  }
}

if (!process.env.VITE_API_BASE_URL) {
  console.error('\nERROR: Missing VITE_API_BASE_URL environment variable.');
  console.error('Please define it in .env.production or set it in your CI/CD pipeline before building.');
  console.error('Example: VITE_API_BASE_URL=https://api.vvitplacement.com/api\n');
  process.exit(1);
}

console.log('Environment validation passed. Proceeding with build.');
