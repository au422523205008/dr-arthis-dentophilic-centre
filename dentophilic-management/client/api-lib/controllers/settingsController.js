const { db } = require('../db');
const { logAudit } = require('../middleware/audit');

/**
 * Get all clinic settings as an object
 */
function getSettings(req, res) {
  try {
    const rows = db.prepare('SELECT key, value FROM clinic_settings').all();
    const settings = {};
    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch (e) {
        settings[row.key] = row.value;
      }
    }

    return res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('[SettingsController:getSettings] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve settings' });
  }
}

/**
 * Update clinic settings
 * Admin only
 */
function updateSettings(req, res) {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    const now = new Date().toISOString();
    const oldSettings = {};

    for (const [key, val] of Object.entries(updates)) {
      const existing = db.prepare('SELECT value FROM clinic_settings WHERE key = ?').get(key);
      if (existing) {
        oldSettings[key] = existing.value;
      }

      const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val);

      db.prepare(`
        INSERT INTO clinic_settings (key, value, updatedAt)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
      `).run(key, stringVal, now);
    }

    logAudit({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'SETTINGS_UPDATED',
      entityType: 'System',
      entityId: 0,
      oldValues: oldSettings,
      newValues: updates,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Clinic settings updated successfully'
    });
  } catch (error) {
    console.error('[SettingsController:updateSettings] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
}

module.exports = {
  getSettings,
  updateSettings
};
