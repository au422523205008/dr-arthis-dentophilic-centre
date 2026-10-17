const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const { initCloudDatabase, pushToCloud, scheduleCloudSync } = require('./cloudSync');

const isVercel = !!process.env.VERCEL;
const tmpDb = '/tmp/appointments.db';
const bundledDb = path.resolve(__dirname, 'appointments.db');

let resolvedDbPath;
if (isVercel) {
  resolvedDbPath = tmpDb;
  if (!fs.existsSync(tmpDb)) {
    if (fs.existsSync(bundledDb)) {
      fs.copyFileSync(bundledDb, tmpDb);
    }
  }
} else {
  const localDb = path.resolve(__dirname, '../../../../dentophilic-website/server/appointments.db');
  resolvedDbPath = fs.existsSync(localDb) ? localDb : bundledDb;
}

function createConnection(dbFilePath) {
  const connection = new DatabaseSync(dbFilePath);
  connection.exec('PRAGMA journal_mode = WAL;');
  connection.exec('PRAGMA foreign_keys = ON;');
  connection.exec('PRAGMA busy_timeout = 5000;');
  return connection;
}

let activeDb = createConnection(resolvedDbPath);

function refreshDb() {
  try {
    if (activeDb && typeof activeDb.close === 'function') {
      try { activeDb.close(); } catch (_) {}
    }
    activeDb = createConnection(resolvedDbPath);
    console.log('[DB] Connection re-established on ' + resolvedDbPath);
  } catch (e) {
    console.error('[DB] Error refreshing connection:', e.message);
  }
}

let initCloudPromise = null;
async function ensureCloudDbReady() {
  if (initCloudPromise) return initCloudPromise;
  initCloudPromise = (async () => {
    const res = await initCloudDatabase(resolvedDbPath, bundledDb);
    if (res && res.success && res.mode === 'cloud_restored') {
      refreshDb();
    }
  })();
  return initCloudPromise;
}

const WRITE_REGEX = /^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)/i;

const db = new Proxy({}, {
  get(target, prop) {
    if (prop === 'prepare') {
      return function(sql) {
        const stmt = activeDb.prepare(sql);
        const isWrite = WRITE_REGEX.test(sql);
        if (!isWrite) return stmt;
        return new Proxy(stmt, {
          get(sTarget, sProp) {
            if (sProp === 'run') {
              return function(...args) {
                const res = sTarget.run(...args);
                scheduleCloudSync(resolvedDbPath, () => activeDb);
                return res;
              };
            }
            const val = sTarget[sProp];
            return typeof val === 'function' ? val.bind(sTarget) : val;
          }
        });
      };
    }
    if (prop === 'exec') {
      return function(sql) {
        const res = activeDb.exec(sql);
        if (WRITE_REGEX.test(sql)) {
          scheduleCloudSync(resolvedDbPath, () => activeDb);
        }
        return res;
      };
    }
    const val = activeDb[prop];
    return typeof val === 'function' ? val.bind(activeDb) : val;
  }
});

function runTransaction(fn) {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = fn(db);
    db.exec('COMMIT;');
    scheduleCloudSync(resolvedDbPath, () => activeDb);
    return result;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

module.exports = {
  db,
  runTransaction,
  dbPath: resolvedDbPath,
  ensureCloudDbReady,
  refreshDb
};