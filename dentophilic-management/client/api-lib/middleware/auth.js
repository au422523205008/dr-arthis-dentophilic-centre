const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'dentophilic_clinic_jwt_super_secret_key_2026_secure';

function authenticateToken(req, res, next) {
  let token = null;

  // 1. Try Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Try cookies
  if (!token && req.cookies) {
    token = req.cookies.access_token || req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: Please log in to proceed.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user still exists in database and is active
    const user = db.prepare(`
      SELECT id, username, name, email, role, status, lockedUntil, permissions, isDeleted 
      FROM users 
      WHERE id = ?
    `).get(decoded.id);

    if (!user || user.isDeleted === 1) {
      return res.status(401).json({
        success: false,
        message: 'Your account is no longer active. Please contact the administrator.'
      });
    }

    if (user.status === 'DISABLED') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact Dr. Arthi or the administrator.'
      });
    }

    // Check account lockout
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return res.status(403).json({
        success: false,
        message: `Account is temporarily locked due to failed attempts. Please try again after ${new Date(user.lockedUntil).toLocaleTimeString()}.`
      });
    }

    req.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions ? JSON.parse(user.permissions) : {}
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        tokenExpired: true,
        message: 'Session has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid session authentication. Please log in again.'
    });
  }
}

module.exports = { authenticateToken };
