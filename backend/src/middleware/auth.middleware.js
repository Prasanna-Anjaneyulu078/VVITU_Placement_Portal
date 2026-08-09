const { verifyToken } = require('../utils/jwt.utils');
const prisma = require('../config/db');

const authenticateToken = async (req, res, next) => {
  let token = null;

  // 1. Check Cookies
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  // 2. Check Authorization Header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Full authentication is required to access this resource' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired JWT token' });
  }

  try {
    let user = null;
    if (decoded.id) {
      user = await prisma.user.findUnique({
        where: { id: BigInt(decoded.id) }
      }).catch(() => null);
    }
    if (!user && (decoded.sub || decoded.email)) {
      const targetEmail = decoded.sub || decoded.email;
      user = await prisma.user.findUnique({
        where: { email: targetEmail }
      }).catch(() => null);
    }

    if (user && !user.deletedAt) {
      if (user.accountStatus && user.accountStatus !== 'ACTIVE') {
        return res.status(401).json({ success: false, message: 'Your account is disabled or blocked.' });
      }
      req.user = {
        id: Number(user.id),
        email: user.email,
        name: user.name,
        role: user.role
      };
    } else if (decoded && decoded.role) {
      req.user = {
        id: Number(decoded.id || 0),
        email: decoded.email || decoded.sub,
        name: decoded.name || 'User',
        role: decoded.role
      };
    } else {
      return res.status(401).json({ success: false, message: 'User account not found' });
    }

    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Authentication processing error' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access Denied: You do not have permission to access this resource' });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
