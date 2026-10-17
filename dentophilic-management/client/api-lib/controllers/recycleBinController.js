const { db } = require('../db');
const { logAudit } = require('../middleware/audit');

const ENTITY_CONFIG = {
  appointment: {
    table: 'appointments',
    titleField: "name || ' - ' || date || ' ' || timeSlot",
    type: 'Appointment'
  },
  patient: {
    table: 'patients',
    titleField: "name || ' (' || patientId || ')'",
    type: 'Patient'
  },
  service: {
    table: 'services',
    titleField: "name || ' (₹' || price || ')'",
    type: 'Service'
  },
  invoice: {
    table: 'invoices',
    titleField: "invoiceNumber || ' - ₹' || totalAmount",
    type: 'Invoice'
  },
  expense: {
    table: 'expenses',
    titleField: "category || ' - ₹' || amount || ' (' || title || ')'",
    type: 'Expense'
  },
  inventory: {
    table: 'inventory_items',
    titleField: "name || ' (' || currentStock || ' ' || unit || ')'",
    type: 'Inventory'
  },
  user: {
    table: 'users',
    titleField: "name || ' (@' || username || ' - ' || role || ')'",
    type: 'Staff'
  }
};

/**
 * List all soft-deleted items across all entities
 */
function getDeletedItems(req, res) {
  try {
    const { entity } = req.query;
    const items = [];

    const keysToSearch = entity && ENTITY_CONFIG[entity] ? [entity] : Object.keys(ENTITY_CONFIG);

    for (const key of keysToSearch) {
      const config = ENTITY_CONFIG[key];
      const rows = db.prepare(`
        SELECT id, ${config.titleField} as title, deletedAt, deletedBy,
               (SELECT name FROM users WHERE id = ${config.table}.deletedBy) as deletedByName
        FROM ${config.table}
        WHERE isDeleted = 1
        ORDER BY deletedAt DESC
      `).all();

      for (const row of rows) {
        items.push({
          id: row.id,
          entityKey: key,
          entityType: config.type,
          title: row.title,
          deletedAt: row.deletedAt,
          deletedBy: row.deletedBy,
          deletedByName: row.deletedByName || 'System / Admin'
        });
      }
    }

    // Sort by deletedAt desc
    items.sort((a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0));

    return res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('[RecycleBinController:getDeletedItems] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve deleted items' });
  }
}

/**
 * Restore a soft-deleted item
 */
function restoreItem(req, res) {
  try {
    const { entity, id } = req.params;

    const config = ENTITY_CONFIG[entity];
    if (!config) {
      return res.status(400).json({ success: false, message: 'Invalid entity type' });
    }

    const item = db.prepare(`SELECT * FROM ${config.table} WHERE id = ? AND isDeleted = 1`).get(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Deleted record not found' });
    }

    db.prepare(`
      UPDATE ${config.table}
      SET isDeleted = 0, deletedAt = NULL, deletedBy = NULL
      WHERE id = ?
    `).run(id);

    logAudit({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'RECYCLE_BIN_RESTORE',
      entityType: config.type,
      entityId: Number(id),
      newValues: { restoredAt: new Date().toISOString() },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `${config.type} has been restored successfully`
    });
  } catch (error) {
    console.error('[RecycleBinController:restoreItem] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to restore item' });
  }
}

/**
 * Permanently delete an item from the database
 * Admin only
 */
function permanentlyDeleteItem(req, res) {
  try {
    const { entity, id } = req.params;

    const config = ENTITY_CONFIG[entity];
    if (!config) {
      return res.status(400).json({ success: false, message: 'Invalid entity type' });
    }

    const item = db.prepare(`SELECT * FROM ${config.table} WHERE id = ?`).get(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    // Never permanently delete the last admin
    if (entity === 'user' && item.role === 'ADMIN') {
      const totalAdmins = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'`).get().count;
      if (totalAdmins <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot permanently delete the primary administrator'
        });
      }
    }

    db.prepare(`DELETE FROM ${config.table} WHERE id = ?`).run(id);

    logAudit({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'PERMANENT_DELETE',
      entityType: config.type,
      entityId: Number(id),
      oldValues: item,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `${config.type} record has been permanently removed`
    });
  } catch (error) {
    console.error('[RecycleBinController:permanentlyDeleteItem] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to permanently delete item' });
  }
}

module.exports = {
  getDeletedItems,
  restoreItem,
  permanentlyDeleteItem
};
