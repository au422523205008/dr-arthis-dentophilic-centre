const fs = require('fs');
const { put, list } = require('@vercel/blob');

const BLOB_PATH = 'database/appointments.db';

let lastSyncedEtag = null;
let isSyncing = false;

/**
 * Initialize local database from Vercel Blob storage.
 * In serverless environments, this MUST download the remote database before
 * any connection is opened or queries are executed.
 */
async function initCloudDatabase(localPath, fallbackTemplatePath) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.log('[CloudSync] No BLOB_READ_WRITE_TOKEN detected, operating in local-only mode.');
    if (!fs.existsSync(localPath) && fs.existsSync(fallbackTemplatePath)) {
      fs.copyFileSync(fallbackTemplatePath, localPath);
    }
    return { success: false, mode: 'local' };
  }

  try {
    console.log('[CloudSync] Checking remote Vercel Blob storage for existing clinic database...');
    const { blobs } = await list();
    const dbBlob = blobs.find(b => b.pathname === BLOB_PATH);

    if (dbBlob && dbBlob.downloadUrl) {
      console.log(`[CloudSync] Remote clinic database found (${dbBlob.size} bytes). Downloading...`);
      const res = await fetch(dbBlob.downloadUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Blob download failed with HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(localPath, buf);
      lastSyncedEtag = dbBlob.etag;
      console.log(`[CloudSync] Successfully restored remote database to ${localPath} (${buf.length} bytes).`);
      return { success: true, mode: 'cloud_restored', size: buf.length };
    } else {
      console.log('[CloudSync] No database found in Vercel Blob. Seeding initial clinic database template...');
      if (fs.existsSync(fallbackTemplatePath) && !fs.existsSync(localPath)) {
        fs.copyFileSync(fallbackTemplatePath, localPath);
      }
      if (fs.existsSync(localPath)) {
        await pushToCloud(localPath);
      }
      return { success: true, mode: 'cloud_seeded' };
    }
  } catch (err) {
    console.error('[CloudSync Init Warning]:', err.message);
    if (!fs.existsSync(localPath) && fs.existsSync(fallbackTemplatePath)) {
      fs.copyFileSync(fallbackTemplatePath, localPath);
    }
    return { success: false, error: err.message };
  }
}

/**
 * Checkpoints SQLite WAL to main file and uploads directly to Vercel Blob.
 */
async function pushToCloud(localPath, activeDb) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || !fs.existsSync(localPath)) return false;

  try {
    if (activeDb && typeof activeDb.exec === 'function') {
      try {
        activeDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');
      } catch (cpErr) {
        console.warn('[CloudSync Checkpoint Warning]:', cpErr.message);
      }
    }

    const data = fs.readFileSync(localPath);
    const blob = await put(BLOB_PATH, data, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true
    });
    lastSyncedEtag = blob.etag;
    console.log(`[CloudSync] Database successfully saved to Vercel Blob! (${data.length} bytes, etag: ${blob.etag})`);
    return true;
  } catch (err) {
    console.error('[CloudSync Push Error]:', err.message);
    return false;
  }
}

/**
 * Immediate, awaited sync function for write operations.
 * In serverless environments, this MUST be awaited before HTTP responses complete.
 */
async function syncCloudDbImmediate(localPath, activeDb) {
  if (isSyncing) {
    // If another sync is in flight, wait briefly and retry
    let retries = 5;
    while (isSyncing && retries > 0) {
      await new Promise(r => setTimeout(r, 60));
      retries--;
    }
  }
  isSyncing = true;
  try {
    return await pushToCloud(localPath, activeDb);
  } finally {
    isSyncing = false;
  }
}

module.exports = {
  initCloudDatabase,
  pushToCloud,
  syncCloudDbImmediate
};