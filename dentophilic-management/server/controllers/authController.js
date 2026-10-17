const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { logAudit } = require('../middleware/audit');
const { sendPasswordResetOtpEmail, DOCTOR_EMAIL } = require('../services/mailService');

const JWT_SECRET = process.env.JWT_SECRET || 'dentophilic_clinic_jwt_super_secret_key_2026_secure';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dentophilic_clinic_refresh_secret_key_2026_secure';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Check if the clinic management system needs initial first-run setup
 */
function checkSetupStatus(req, res) {
  try {
    const adminCount = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN' AND isDeleted = 0`).get();
    return res.json({
      success: true,
      setupRequired: adminCount.count === 0,
      hasAdmin: adminCount.count > 0
    });
  } catch (err) {
    console.error('Error checking setup status:', err);
    return res.status(500).json({ success: false, message: 'Server error checking setup status' });
  }
}

/**
 * First-run Setup: Create the initial Admin (Doctor) account
 */
async function setupFirstAdmin(req, res) {
  try {
    const adminCount = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN' AND isDeleted = 0`).get();
    if (adminCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Setup has already been completed. An administrator account already exists.'
      });
    }

    const { username, name, email, phone, password } = req.body;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
    }
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Doctor/Admin full name is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO users (
        username, name, email, phone, passwordHash, role, status,
        failedLoginAttempts, createdAt, updatedAt, isDeleted
      ) VALUES (
        @username, @name, @email, @phone, @passwordHash, 'ADMIN', 'ACTIVE',
        0, @createdAt, @updatedAt, 0
      )
    `);

    insert.run({
      username: cleanUsername,
      name: name.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      passwordHash,
      createdAt: now,
      updatedAt: now
    });

    const newAdmin = db.prepare('SELECT id, username, name, email, role FROM users WHERE username = ?').get(cleanUsername);

    // Auto-login after setup
    const token = jwt.sign(
      { id: newAdmin.id, username: newAdmin.username, role: newAdmin.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000
    });

    logAudit(req, {
      action: 'SETUP',
      entityType: 'USER',
      entityId: newAdmin.id,
      newValues: { username: newAdmin.username, role: newAdmin.role }
    });

    return res.status(201).json({
      success: true,
      message: 'Master administrator account created successfully! Welcome to Dr. Arthi\'s Dentophilic Centre Management.',
      token,
      user: newAdmin
    });
  } catch (err) {
    console.error('Error during first-run setup:', err);
    return res.status(500).json({ success: false, message: 'Failed to create administrator account' });
  }
}

/**
 * Login handler with password hashing, account lockout & audit logging
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = db.prepare(`
      SELECT * FROM users WHERE username = ? AND isDeleted = 0
    `).get(cleanUsername);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Check account lockout
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const waitMinutes = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
      return res.status(403).json({
        success: false,
        message: `Account is temporarily locked due to repeated failed attempts. Please retry in ${waitMinutes} minute(s).`
      });
    }

    // Check disabled status
    if (user.status === 'DISABLED') {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated by the administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      let lockedUntil = null;

      if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString();
      }

      db.prepare(`
        UPDATE users 
        SET failedLoginAttempts = ?, lockedUntil = ?, updatedAt = datetime('now')
        WHERE id = ?
      `).run(failedAttempts, lockedUntil, user.id);

      logAudit(req, {
        action: 'LOGIN_FAILED',
        entityType: 'USER',
        entityId: user.id,
        newValues: { username: user.username, failedAttempts }
      });

      if (lockedUntil) {
        return res.status(403).json({
          success: false,
          message: `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`
        });
      }

      return res.status(401).json({
        success: false,
        message: `Invalid credentials. (${MAX_FAILED_ATTEMPTS - failedAttempts} attempts remaining before temporary lock)`
      });
    }

    // Reset failed attempts & update last login
    db.prepare(`
      UPDATE users 
      SET failedLoginAttempts = 0, lockedUntil = null, lastLoginAt = datetime('now'), updatedAt = datetime('now')
      WHERE id = ?
    `).run(user.id);

    // Generate tokens
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Set HTTP-Only Cookie
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    logAudit({ user, ip: req.ip }, {
      action: 'LOGIN_SUCCESS',
      entityType: 'USER',
      entityId: user.id
    });

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions ? JSON.parse(user.permissions) : {}
      }
    });
  } catch (err) {
    console.error('Error during login:', err);
    return res.status(500).json({ success: false, message: 'Server error during login authentication' });
  }
}

/**
 * Get currently authenticated user info
 */
function getMe(req, res) {
  try {
    return res.json({
      success: true,
      user: req.user
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving user profile' });
  }
}

/**
 * Logout handler - clears cookies and session
 */
function logout(req, res) {
  try {
    if (req.user) {
      logAudit(req, {
        action: 'LOGOUT',
        entityType: 'USER',
        entityId: req.user.id
      });
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error during logout' });
  }
}

/**
 * Change own password
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password (min 6 characters) are required.'
      });
    }

    const user = db.prepare('SELECT passwordHash FROM users WHERE id = ?').get(userId);
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.'
      });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    db.prepare(`
      UPDATE users SET passwordHash = ?, updatedAt = datetime('now') WHERE id = ?
    `).run(newHash, userId);

    logAudit(req, {
      action: 'PASSWORD_CHANGE',
      entityType: 'USER',
      entityId: userId
    });

    return res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    console.error('Error changing password:', err);
    return res.status(500).json({ success: false, message: 'Failed to update password' });
  }
}

/**
 * Request password reset OTP
 * Sends 6-digit OTP code to Dr. Arthi's official email (for both Doctor and Attender resets)
 */
async function requestPasswordResetOtp(req, res) {
  try {
    const { username } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Username is required to request a password reset OTP.'
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = db.prepare(`
      SELECT id, username, name, email, role, status, isDeleted 
      FROM users 
      WHERE username = ? AND isDeleted = 0
    `).get(cleanUsername);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No active staff or doctor account found with username '${username}'.`
      });
    }

    if (user.status === 'DISABLED') {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact Dr. Arthi directly.'
      });
    }

    // Rate limit check: max 5 requests per 10 minutes
    const recentRequests = db.prepare(`
      SELECT COUNT(*) as count FROM password_resets 
      WHERE userId = ? AND createdAt >= datetime('now', '-10 minutes')
    `).get(user.id);

    if (recentRequests && recentRequests.count >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many reset requests. Please wait a few minutes before trying again.'
      });
    }

    // Invalidate previous unused OTPs
    db.prepare(`
      UPDATE password_resets 
      SET usedAt = datetime('now') 
      WHERE userId = ? AND usedAt IS NULL
    `).run(user.id);

    // Generate fresh 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();
    const now = new Date().toISOString();
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    db.prepare(`
      INSERT INTO password_resets (
        userId, username, targetEmail, otpCode, expiresAt, usedAt, ipAddress, createdAt
      ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?)
    `).run(user.id, user.username, DOCTOR_EMAIL, otpCode, expiresAt, ipAddress, now);

    // Send email to Doctor
    await sendPasswordResetOtpEmail({
      username: user.username,
      targetName: user.name,
      role: user.role,
      otpCode,
      ipAddress
    });

    logAudit(req, {
      action: 'OTP_REQUESTED',
      entityType: 'USER',
      entityId: user.id,
      newValues: { username: user.username, targetEmail: DOCTOR_EMAIL }
    });

    // Mask doctor email for security in UI notice
    const parts = DOCTOR_EMAIL.split('@');
    const maskedEmail = parts[0].slice(0, 4) + '***@' + parts[1];

    return res.json({
      success: true,
      message: `A 6-digit verification OTP has been dispatched to Dr. Arthi's email (${maskedEmail}).`,
      targetEmail: maskedEmail,
      doctorEmail: DOCTOR_EMAIL,
      username: user.username,
      name: user.name,
      role: user.role,
      expiresInMinutes: 10,
      devOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined
    });
  } catch (err) {
    console.error('Error generating password reset OTP:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate password reset OTP. Please check server logs.'
    });
  }
}

/**
 * Verify OTP and update password
 */
async function verifyOtpAndResetPassword(req, res) {
  try {
    const { username, otp, newPassword } = req.body;

    if (!username || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Username, 6-digit OTP, and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // Find active valid OTP
    const resetRecord = db.prepare(`
      SELECT * FROM password_resets 
      WHERE username = ? AND otpCode = ? AND usedAt IS NULL 
      ORDER BY id DESC LIMIT 1
    `).get(cleanUsername, cleanOtp);

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please enter the exact 6-digit code sent to Dr. Arthi\'s email.'
      });
    }

    if (new Date(resetRecord.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This OTP has expired (10-minute validity). Please request a new one.'
      });
    }

    const user = db.prepare('SELECT id, username, name, role FROM users WHERE id = ?').get(resetRecord.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    db.prepare(`
      UPDATE users 
      SET passwordHash = ?, failedLoginAttempts = 0, lockedUntil = NULL, updatedAt = datetime('now') 
      WHERE id = ?
    `).run(newHash, user.id);

    // Invalidate this OTP
    db.prepare(`UPDATE password_resets SET usedAt = datetime('now') WHERE id = ?`).run(resetRecord.id);

    logAudit(req, {
      action: 'PASSWORD_RESET_SUCCESS',
      entityType: 'USER',
      entityId: user.id,
      newValues: { username: user.username, resetViaOtp: true }
    });

    return res.json({
      success: true,
      message: `Password successfully updated for ${user.name} (@${user.username})! You can now sign in with your new password.`
    });
  } catch (err) {
    console.error('Error resetting password with OTP:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.'
    });
  }
}

module.exports = {
  checkSetupStatus,
  setupFirstAdmin,
  login,
  getMe,
  logout,
  changePassword,
  requestPasswordResetOtp,
  verifyOtpAndResetPassword
};
