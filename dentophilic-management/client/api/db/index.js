const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const isVercel = !!process.env.VERCEL;
const tmpDb = '/tmp/appointments.db';
const bundledDb = path.resolve(__dirname, 'appointments.db');

let resolvedDbPath;
if (isVercel) {
  resolvedDbPath = tmpDb;
  if (!fs.existsSync(tmpDb)) {
    if (fs.existsSync(bundledDb)) {
      fs.copyFileSync(bundledDb, tmpDb);
      console.log('[DB] Copied bundled database template to /tmp/appointments.db');
    }
  }
} else {
  // Local development
  const localDb = path.resolve(__dirname, '../../../../dentophilic-website/server/appointments.db');
  resolvedDbPath = fs.existsSync(localDb) ? localDb : bundledDb;
}

const db = new DatabaseSync(resolvedDbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 5000;');

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
