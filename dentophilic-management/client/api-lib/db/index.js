const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const { initCloudDatabase, syncCloudDbImmediate } = require('./cloudSync');

const isVercel = !!process.env.VERCEL;
const tmpDb = '/tmp/appointments.db';
const bundledDb = path.resolve(__dirname, 'appointments.db');

let resolvedDbPath;
if (isVercel) {
  resolvedDbPath = tmpDb;
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

let activeDb = null;
let isInitialized = false;
let initCloudPromise = null;

function getActiveDbInstance() {
  if (!activeDb) {
    if (!fs.existsSync(resolvedDbPath) && fs.existsSync(bundledDb)) {
      try {
        fs.copyFileSync(bundledDb, resolvedDbPath);
      } catch (_) {}
    }
    activeDb = createConnection(resolvedDbPath);
  }
  return activeDb;
}

function getResolvedDbPath() {
  return resolvedDbPath;
}

/**
 * Ensures remote database is downloaded from Vercel Blob BEFORE any connections are created.
 */
async function ensureCloudDbReady() {
  if (isInitialized && activeDb) return;
  if (initCloudPromise) return initCloudPromise;

  initCloudPromise = (async () => {
    try {
      console.log(`[DB] Initializing database (isVercel: ${isVercel})...`);
      const res = await initCloudDatabase(resolvedDbPath, bundledDb);

      if (activeDb && typeof activeDb.close === 'function') {
        try { activeDb.close(); } catch (_) {}
      }
      activeDb = createConnection(resolvedDbPath);
      console.log(`[DB] Connected to database at ${resolvedDbPath}`);

      // Run any pending schema migrations safely
      try {
        const { runMigrations } = require('./migrate');
        runMigrations(activeDb);
      } catch (migErr) {
        console.warn('[DB] Migration note:', migErr.message);
      }

      isInitialized = true;
    } catch (err) {
      console.error('[DB] ensureCloudDbReady failed:', err.message);
      if (!activeDb) {
        activeDb = createConnection(resolvedDbPath);
      }
    } finally {
      initCloudPromise = null;
    }
  })();

  return initCloudPromise;
}

// Ensure database proxy dynamically delegates to activeDb
const db = new Proxy({}, {
  get(target, prop) {
    const currentDb = getActiveDbInstance();
    const val = currentDb[prop];
    return typeof val === 'function' ? val.bind(currentDb) : val;
  }
});

function runTransaction(fn) {
  const currentDb = getActiveDbInstance();
  currentDb.exec('BEGIN IMMEDIATE;');
  try {
    const result = fn(currentDb);
    currentDb.exec('COMMIT;');
    return result;
  } catch (err) {
    currentDb.exec('ROLLBACK;');
    throw err;
  }
}

module.exports = {
  db,
  runTransaction,
  ensureCloudDbReady,
  getActiveDbInstance,
  getResolvedDbPath
};