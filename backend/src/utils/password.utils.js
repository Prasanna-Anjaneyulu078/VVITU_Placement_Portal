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


module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordRequirements
};
