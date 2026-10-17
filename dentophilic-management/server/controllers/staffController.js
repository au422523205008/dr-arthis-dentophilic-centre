const bcrypt = require('bcrypt');
const { db } = require('../db');
const { logAudit } = require('../middleware/audit');
const { DEFAULT_PERMISSIONS } = require('../middleware/rbac');

/**
 * List all users (excluding deleted)
 * Admin only
 */
function getUsers(req, res) {
  try {
    const users = db.prepare(`
      SELECT id, username, name, email, phone, role, status, 
             failedLoginAttempts, lockedUntil, lastLoginAt, permissions, 
             createdAt, updatedAt
      FROM users
      WHERE isDeleted = 0
      ORDER BY role ASC, name ASC
    `).all();

    const formatted = users.map(u => ({
      ...u,
      permissions: u.permissions ? JSON.parse(u.permissions) : (DEFAULT_PERMISSIONS[u.role] || {})
    }));

    return res.json({
      success: true,
      users: formatted
    });
  } catch (error) {
    console.error('[StaffController:getUsers] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve staff users' });
  }
}

/**
 * Get user details by ID
 */
function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = db.prepare(`
      SELECT id, username, name, email, phone, role, status, 
             failedLoginAttempts, lockedUntil, lastLoginAt, permissions, 
             createdAt, updatedAt
      FROM users
      WHERE id = ? AND isDeleted = 0
    `).get(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.permissions = user.permissions ? JSON.parse(user.permissions) : (DEFAULT_PERMISSIONS[user.role] || {});

    return res.json({ success: true, user });
  } catch (error) {
    console.error('[StaffController:getUserById] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve user details' });
  }
}

/**
 * Create a new user (Attender or Admin)
 * Admin only
 */
async function createUser(req, res) {
  try {
    const { username, name, email, phone, password, role = 'ATTENDER', permissions } = req.body;

    if (!username || !name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, name, and password are required'
      });
    }

    if (!['ADMIN', 'ATTENDER'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    // Check username uniqueness
    const existing = db.prepare('SELECT id FROM users WHERE username = ? AND isDeleted = 0').get(username.trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username is already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    
    // Store custom permissions or default
    const effectivePermissions = permissions 
      ? JSON.stringify({ ...DEFAULT_PERMISSIONS[role], ...permissions })
      : JSON.stringify(DEFAULT_PERMISSIONS[role]);

    const result = db.prepare(`
      INSERT INTO users (username, name, email, phone, passwordHash, role, status, permissions, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
    `).run(
      username.trim().toLowerCase(),
      name.trim(),
      email ? email.trim() : null,
      phone ? phone.trim() : null,
      passwordHash,
      role,
      effectivePermissions,
      now,
      now
    );

    const newUserId = Number(result.lastInsertRowid);

    logAudit({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUserId,
      newValues: { username, name, role, email, phone },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: `Staff account (${role}) created successfully`,
      userId: newUserId
    });
  } catch (error) {
    console.error('[StaffController:createUser] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create staff account' });
  }
}

/**
 * Update staff details & permissions
 */
function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, phone, status, role, permissions } = req.body;

    const existing = db.prepare('SELECT * FROM users WHERE id = ? AND isDeleted = 0').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent disabling or demoting the last active ADMIN
    if (existing.role === 'ADMIN' && (status === 'DISABLED' || (role && role !== 'ADMIN'))) {
      const activeAdminCount = db.prepare(`
        SELECT COUNT(*) as count FROM users 
        WHERE role = 'ADMIN' AND status = 'ACTIVE' AND isDeleted = 0 AND id != ?
      `).get(id).count;

      if (activeAdminCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot disable or change role of the only active Administrator account.'
        });
      }
    }

    const now = new Date().toISOString();
    const updatedName = name ? name.trim() : existing.name;
    const updatedEmail = email !== undefined ? (email ? email.trim() : null) : existing.email;
    const updatedPhone = phone !== undefined ? (phone ? phone.trim() : null) : existing.phone;
    const updatedStatus = status || existing.status;
    const updatedRole = role || existing.role;
    
    let updatedPermissions = existing.permissions;
    if (permissions) {
      const current = existing.permissions ? JSON.parse(existing.permissions) : DEFAULT_PERMISSIONS[updatedRole];
      updatedPermissions = JSON.stringify({ ...current, ...permissions });
    } else if (role && role !== existing.role) {
      updatedPermissions = JSON.stringify(DEFAULT_PERMISSIONS[role]);
    }

    db.prepare(`
      UPDATE users
      SET name = ?, email = ?, phone = ?, status = ?, role = ?, permissions = ?, updatedAt = ?
      WHERE id = ?
    `).run(updatedName, updatedEmail, updatedPhone, updatedStatus, updatedRole, updatedPermissions, now, id);

    logAudit({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: Number(id),
      oldValues: { name: existing.name, status: existing.status, role: existing.role },
      newValues: { name: updatedName, status: updatedStatus, role: updatedRole },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('[StaffController:updateUser] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
}

/**
 * Reset staff password
 * Admin only
 */
async function resetPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const user = db.prepare('SELECT id, username, name FROM users WHERE id = ? AND isDeleted = 0').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users 
      SET passwordHash = ?, failedLoginAttempts = 0, lockedUntil = NULL, updatedAt = ?
      WHERE id = ?
    `).run(passwordHash, now, id);

    logAudit({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'PASSWORD_RESET',
      entityType: 'User',
      entityId: Number(id),
      newValues: { resetBy: req.user.username },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Password for ${user.name} has been reset successfully`
    });
  } catch (error) {
    console.error('[StaffController:resetPassword] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
}

/**
 * Soft delete a staff member
 */
function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (Number(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ? AND isDeleted = 0').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'ADMIN') {
      const activeAdminCount = db.prepare(`
        SELECT COUNT(*) as count FROM users 
        WHERE role = 'ADMIN' AND isDeleted = 0 AND id != ?
      `).get(id).count;

      if (activeAdminCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the only remaining Administrator.'
        });
      }
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users
      SET isDeleted = 1, deletedAt = ?, deletedBy = ?
      WHERE id = ?
    `).run(now, req.user.id, id);

    logAudit({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: Number(id),
      oldValues: { username: user.username, name: user.name, role: user.role },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Staff member ${user.name} has been moved to Recycle Bin`
    });
  } catch (error) {
    console.error('[StaffController:deleteUser] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete staff member' });
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  deleteUser
};
