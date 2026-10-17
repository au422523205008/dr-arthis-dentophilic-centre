const fs = require('fs');
const path = require('path');
const { db } = require('../db');
const { logAudit } = require('../middleware/audit');

const BACKUP_DIR = path.resolve(__dirname, '../backups');
const DB_FILE = path.resolve(__dirname, '../../../dentophilic-website/server/appointments.db');

// Ensure backup folder exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Perform a backup of the SQLite database
 */
function createBackupFile(isAutomatic = false) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `dentophilic-backup-${isAutomatic ? 'auto' : 'manual'}-${timestamp}.db`;
  const backupFilePath = path.join(BACKUP_DIR, backupFilename);

  // Use SQLite VACUUM INTO or copy file
  // VACUUM INTO creates a clean, compacted transactional snapshot
  try {
    // Escape single quotes if path contains them
    const safePath = backupFilePath.replace(/'/g, "''");
    db.exec(`VACUUM INTO '${safePath}'`);
  } catch (err) {
    // Fallback to direct fs copy if VACUUM INTO fails
    fs.copyFileSync(DB_FILE, backupFilePath);
  }

  // Prune old backups (keep last 30 days)
  pruneBackups();

  return {
    filename: backupFilename,
    filePath: backupFilePath,
    createdAt: new Date().toISOString(),
    sizeBytes: fs.statSync(backupFilePath).size
  };
}

/**
 * Prune automatic backups older than 30 days (keep 1 per month)
 */
function pruneBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.db'));
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const fullPath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(fullPath);
      const ageMs = now - stats.mtimeMs;

      // If older than 30 days and not marked as monthly archive
      if (ageMs > thirtyDaysMs && !file.includes('-monthly-')) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch (err) {
    console.error('[BackupController:pruneBackups] Warning:', err);
  }
}

/**
 * List existing backups
 */
function listBackups(req, res) {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.db'))
      .map(file => {
        const fullPath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(fullPath);
        return {
          filename: file,
          sizeBytes: stats.size,
          sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
          createdAt: stats.birthtime || stats.mtime,
          isAuto: file.includes('-auto-')
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      success: true,
      backups: files,
      databasePath: DB_FILE
    });
  } catch (error) {
    console.error('[BackupController:listBackups] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to list backups' });
  }
}

/**
 * Create a manual backup now
 */
function triggerManualBackup(req, res) {
  try {
    const result = createBackupFile(false);

    logAudit({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'BACKUP_CREATED',
      entityType: 'System',
      entityId: 0,
      newValues: { filename: result.filename, size: result.sizeBytes },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Backup snapshot created successfully',
      backup: result
    });
  } catch (error) {
    console.error('[BackupController:triggerManualBackup] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create backup snapshot' });
  }
}

/**
 * Download a backup file
 */
function downloadBackup(req, res) {
  try {
    const { filename } = req.params;
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(BACKUP_DIR, sanitizedFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Backup file not found' });
    }

    logAudit({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'BACKUP_DOWNLOADED',
      entityType: 'System',
      entityId: 0,
      newValues: { filename: sanitizedFilename },
      ipAddress: req.ip
    });

    return res.download(filePath, sanitizedFilename);
  } catch (error) {
    console.error('[BackupController:downloadBackup] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to download backup' });
  }
}

/**
 * Restore a backup file
 */
function restoreBackup(req, res) {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, message: 'Filename is required' });
    }

    const sanitizedFilename = path.basename(filename);
    const sourceBackupPath = path.join(BACKUP_DIR, sanitizedFilename);

    if (!fs.existsSync(sourceBackupPath)) {
      return res.status(404).json({ success: false, message: 'Target backup file not found' });
    }

    // First take a pre-restore safety backup
    const safetyBackup = createBackupFile(false);

    // Overwrite active database file
    fs.copyFileSync(sourceBackupPath, DB_FILE);

    logAudit({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'BACKUP_RESTORED',
      entityType: 'System',
      entityId: 0,
      oldValues: { safetyBackup: safetyBackup.filename },
      newValues: { restoredFrom: sanitizedFilename },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Database successfully restored from ${sanitizedFilename}. Safety snapshot saved as ${safetyBackup.filename}.`,
      safetyBackup: safetyBackup.filename
    });
  } catch (error) {
    console.error('[BackupController:restoreBackup] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to restore backup' });
  }
}

module.exports = {
  createBackupFile,
  listBackups,
  triggerManualBackup,
  downloadBackup,
  restoreBackup
};
