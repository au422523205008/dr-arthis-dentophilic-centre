const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Resolve DB path - points directly to the shared clinic database at dentophilic-website/server/appointments.db
const defaultSharedPath = path.resolve(__dirname, '../../../dentophilic-website/server/appointments.db');
const configuredPath = process.env.DB_PATH;

let resolvedDbPath = defaultSharedPath;
if (configuredPath) {
  resolvedDbPath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(__dirname, '..', configuredPath);
}

// Ensure parent directory exists
const dbDir = path.dirname(resolvedDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`[Database] Connecting to shared SQLite database at: ${resolvedDbPath}`);
const db = new DatabaseSync(resolvedDbPath);

// Enable WAL for concurrent readers & fast ACID writes, and enforce foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 5000;');

/**
 * Executes a function within an ACID transaction
 */
function runTransaction(fn) {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = fn(db);
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

module.exports = {
  db,
  runTransaction,
  dbPath: resolvedDbPath
};
