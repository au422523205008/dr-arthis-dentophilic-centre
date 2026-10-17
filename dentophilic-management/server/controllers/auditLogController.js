const { db } = require('../db');

/**
 * Get audit logs with filtering & pagination
 * Admin only
 */
function getAuditLogs(req, res) {
  try {
    const { 
      action, 
      entityType, 
      userName, 
      search, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(10, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = ['1=1'];
    let params = [];

    if (action) {
      whereClauses.push('action = ?');
      params.push(action);
    }

    if (entityType) {
      whereClauses.push('entityType = ?');
      params.push(entityType);
    }

    if (userName) {
      whereClauses.push('userName LIKE ?');
      params.push(`%${userName}%`);
    }

    if (search) {
      whereClauses.push('(action LIKE ? OR entityType LIKE ? OR userName LIKE ? OR oldValues LIKE ? OR newValues LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (startDate) {
      whereClauses.push('createdAt >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push('createdAt <= ?');
      params.push(endDate + 'T23:59:59.999Z');
    }

    const whereSql = whereClauses.join(' AND ');

    // Total count
    const totalRow = db.prepare(`SELECT COUNT(*) as count FROM audit_logs WHERE ${whereSql}`).get(...params);
    const total = totalRow ? totalRow.count : 0;

    // Fetch page
    const logs = db.prepare(`
      SELECT * FROM audit_logs
      WHERE ${whereSql}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitNum, offset);

    const parsedLogs = logs.map(l => ({
      ...l,
      oldValues: l.oldValues ? JSON.parse(l.oldValues) : null,
      newValues: l.newValues ? JSON.parse(l.newValues) : null
    }));

    return res.json({
      success: true,
      logs: parsedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('[AuditLogController:getAuditLogs] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs' });
  }
}

/**
 * Get distinct actions and entity types for filtering dropdowns
 */
function getAuditFilters(req, res) {
  try {
    const actions = db.prepare('SELECT DISTINCT action FROM audit_logs ORDER BY action ASC').all().map(r => r.action);
    const entityTypes = db.prepare('SELECT DISTINCT entityType FROM audit_logs ORDER BY entityType ASC').all().map(r => r.entityType);

    return res.json({
      success: true,
      actions,
      entityTypes
    });
  } catch (error) {
    console.error('[AuditLogController:getAuditFilters] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve filters' });
  }
}

module.exports = {
  getAuditLogs,
  getAuditFilters
};
