const fs = require('fs');
const { put, list } = require('@vercel/blob');

const BLOB_PATH = 'database/appointments.db';

let lastSyncedEtag = null;
let syncTimeout = null;
let isSyncing = false;
let pendingSync = false;

async function initCloudDatabase(localPath, fallbackTemplatePath) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.log('[CloudSync] No BLOB_READ_WRITE_TOKEN, operating in local-only mode.');
    return { success: false, mode: 'local' };
  }

  try {
    const { blobs } = await list();
    const dbBlob = blobs.find(b => b.pathname === BLOB_PATH);

    if (dbBlob) {
      console.log('[CloudSync] Found remote database in Vercel Blob (' + dbBlob.size + ' bytes), downloading...');
      const res = await fetch(dbBlob.downloadUrl, {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('Download failed with HTTP ' + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(localPath, buf);
      lastSyncedEtag = dbBlob.etag;
      console.log('[CloudSync] Successfully restored remote database to ' + localPath);
      return { success: true, mode: 'cloud_restored', size: buf.length };
    } else {
      console.log('[CloudSync] No database found in Vercel Blob. Seeding initial template...');
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

async function pushToCloud(localPath, activeDb) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || !fs.existsSync(localPath)) return;

  try {
    if (activeDb && typeof activeDb.exec === 'function') {
      try {
        activeDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');
      } catch (cpErr) {}
    }

    const data = fs.readFileSync(localPath);
    const blob = await put(BLOB_PATH, data, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true
    });
    lastSyncedEtag = blob.etag;
    console.log('[CloudSync] Database successfully saved to Vercel Blob! (' + data.length + ' bytes)');
  } catch (err) {
    console.error('[CloudSync Push Error]:', err.message);
  }
}

function scheduleCloudSync(localPath, getActiveDb) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;

  if (syncTimeout) clearTimeout(syncTimeout);

  syncTimeout = setTimeout(async () => {
    if (isSyncing) {
      pendingSync = true;
      return;
    }
    isSyncing = true;
    try {
      const activeDb = typeof getActiveDb === 'function' ? getActiveDb() : null;
      await pushToCloud(localPath, activeDb);
    } finally {
      isSyncing = false;
      if (pendingSync) {
        pendingSync = false;
        scheduleCloudSync(localPath, getActiveDb);
      }
    }
  }, 350);
}

module.exports = {
  initCloudDatabase,
  pushToCloud,
  scheduleCloudSync
};