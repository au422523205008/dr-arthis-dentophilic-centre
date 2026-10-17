const { db } = require('../db');

/**
 * Record an immutable audit log entry
 * Flexible signature:
 *   logAudit(req, { action, entityType, entityId, oldValues, newValues })
 *   OR
 *   logAudit({ action, entityType, entityId, userId, userName, userRole, oldValues, newValues, ipAddress })
 */
function logAudit(reqOrData, data) {
  try {
    let req = null;
    let payload = null;

    if (data && typeof data === 'object') {
      req = reqOrData;
      payload = data;
    } else {
      payload = reqOrData || {};
      req = payload.req || null;
    }

    const { action, entityType, entityId, oldValues = null, newValues = null } = payload;
    if (!action || !entityType) return;

    const userId = payload.userId || req?.user?.id || null;
    const userName = payload.userName || req?.user?.name || req?.user?.username || 'System';
    const userRole = payload.userRole || req?.user?.role || 'SYSTEM';
    const ipAddress = payload.ipAddress || req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';

    const insertStmt = db.prepare(`
      INSERT INTO audit_logs (
        action, entityType, entityId, userId, userName, userRole,
        oldValues, newValues, ipAddress, createdAt
      ) VALUES (
        @action, @entityType, @entityId, @userId, @userName, @userRole,
        @oldValues, @newValues, @ipAddress, datetime('now')
      )
    `);

    insertStmt.run({
      action: String(action).toUpperCase(),
      entityType: String(entityType).toUpperCase(),
      entityId: entityId ? String(entityId) : null,
      userId,
      userName,
      userRole,
      oldValues: oldValues ? (typeof oldValues === 'string' ? oldValues : JSON.stringify(oldValues)) : null,
      newValues: newValues ? (typeof newValues === 'string' ? newValues : JSON.stringify(newValues)) : null,
      ipAddress: String(ipAddress).slice(0, 50)
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err.message);
  }
}

module.exports = { logAudit };
