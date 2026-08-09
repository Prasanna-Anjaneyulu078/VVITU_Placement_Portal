const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) return false;

  let cleanHash = hashedPassword;
  if (cleanHash.startsWith('{bcrypt}')) {
    cleanHash = cleanHash.replace('{bcrypt}', '');
  } else if (cleanHash.startsWith('{noop}')) {
    return password === cleanHash.replace('{noop}', '');
  }

  if (cleanHash.startsWith('$2a$') || cleanHash.startsWith('$2b$') || cleanHash.startsWith('$2y$')) {
    try {
      return await bcrypt.compare(password, cleanHash);
    } catch {
      return false;
    }
  }

  return password === cleanHash;
};

const validatePasswordRequirements = (password) => {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  return hasUpper && hasLower && hasDigit && hasSpecial;
};

const generateDefaultPassword = (rollNumber) => {
  if (!rollNumber || rollNumber.trim().length < 6) {
    return process.env.DEFAULT_PASSWORD || 'TempPass@123456';
  }
  const cleanRoll = rollNumber.trim();
  const firstTwo = cleanRoll.substring(0, 2);
  const lastFour = cleanRoll.substring(cleanRoll.length - 4);
  return (process.env.DEFAULT_PASSWORD_PREFIX || 'TempPass@') + firstTwo + lastFour;
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordRequirements,
  generateDefaultPassword
};
