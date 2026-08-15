const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: Number(user.id),
      email: user.email,
      role: user.role,
      sub: user.email
    },
    env.jwtSecret,
    { expiresIn: '24h' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: Number(user.id),
      email: user.email,
      sub: user.email,
      type: 'refresh'
    },
    env.jwtSecret,
    { expiresIn: '7d' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch (err) {
    return null;
  }
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProd = env.env === 'production';
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: env.jwtExpiration
  });

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: env.jwtRefreshExpiration
    });
  }
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  setAuthCookies,
  clearAuthCookies
};
