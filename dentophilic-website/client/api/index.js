const express = require('express');
const cors = require('cors');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const { put, list } = require('@vercel/blob');

const isVercel = !!process.env.VERCEL;
const tmpDb = '/tmp/appointments.db';
const bundledDb = path.resolve(__dirname, 'appointments.db');
const BLOB_PATH = 'database/appointments.db';

let resolvedDbPath;
if (isVercel) {
  resolvedDbPath = tmpDb;
  if (!fs.existsSync(tmpDb) && fs.existsSync(bundledDb)) {
    fs.copyFileSync(bundledDb, tmpDb);
  }
} else {
  const localDb = path.resolve(__dirname, '../../../../dentophilic-website/server/appointments.db');
  resolvedDbPath = fs.existsSync(localDb) ? localDb : (fs.existsSync(bundledDb) ? bundledDb : tmpDb);
}

function createConnection(dbPath) {
  const conn = new DatabaseSync(dbPath);
  conn.exec('PRAGMA journal_mode = WAL;');
  conn.exec('PRAGMA foreign_keys = ON;');
  conn.exec('PRAGMA busy_timeout = 5000;');
  return conn;
}

let activeDb = createConnection(resolvedDbPath);

function refreshDb() {
  try {
    if (activeDb && typeof activeDb.close === 'function') {
      try { activeDb.close(); } catch (_) {}
    }
    activeDb = createConnection(resolvedDbPath);
  } catch (err) {
    console.error('[Website DB refresh error]:', err.message);
  }
}

const db = new Proxy({}, {
  get(target, prop) {
    const val = activeDb[prop];
    return typeof val === 'function' ? val.bind(activeDb) : val;
  }
});

let initPromise = null;
async function ensureCloudSync() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return;
    try {
      const { blobs } = await list();
      const dbBlob = blobs.find(b => b.pathname === BLOB_PATH);
      if (dbBlob) {
        const res = await fetch(dbBlob.downloadUrl, {
          headers: { Authorization: 'Bearer ' + token }
        });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(resolvedDbPath, buf);
          refreshDb();
          console.log('[Website] Restored database from Vercel Blob (' + buf.length + ' bytes)');
        }
      }
    } catch (e) {
      console.warn('[Website CloudSync Init Warning]:', e.message);
    }
  })();
  return initPromise;
}

async function pushToBlob() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || !fs.existsSync(resolvedDbPath)) return;
  try {
    if (activeDb) {
      try { activeDb.exec('PRAGMA wal_checkpoint(TRUNCATE);'); } catch (_) {}
    }
    const data = fs.readFileSync(resolvedDbPath);
    await put(BLOB_PATH, data, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true
    });
    console.log('[Website] Pushed booking update to Vercel Blob');
  } catch (err) {
    console.error('[Website Push Error]:', err.message);
  }
}

function sanitizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
}

function generateReferenceId() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return 'DEN-' + year + '-' + randomSuffix;
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use(async (req, res, next) => {
  try { await ensureCloudSync(); } catch (_) {}
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Dentophilic Website Booking API' });
});

app.get('/api/appointments/availability', (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date required' });

    const rows = db.prepare(
      "SELECT timeSlot FROM appointments WHERE date = ? AND status != 'Cancelled' AND (isDeleted = 0 OR isDeleted IS NULL)"
    ).all(date);

    res.json({
      success: true,
      date,
      bookedSlots: rows.map(r => r.timeSlot)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const { name, phone, email, age, gender, service, date, timeSlot, message } = req.body;
    if (!name || name.trim().length < 2) return res.status(400).json({ success: false, message: 'Valid name required' });
    const cleanPhone = sanitizePhone(phone);
    if (!cleanPhone || cleanPhone.length < 10) return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number required' });
    if (!service || !date || !timeSlot) return res.status(400).json({ success: false, message: 'Service, date and slot required' });

    const existing = db.prepare(
      "SELECT id, referenceId FROM appointments WHERE date = ? AND timeSlot = ? AND status != 'Cancelled' AND (isDeleted = 0 OR isDeleted IS NULL)"
    ).get(date, timeSlot);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Slot ${timeSlot} on ${date} is already reserved. Please select another slot.`
      });
    }

    const referenceId = generateReferenceId();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO appointments (
        referenceId, name, phone, email, age, gender,
        service, date, timeSlot, source, message, status,
        isDeleted, createdAt, updatedAt
      ) VALUES (
        @referenceId, @name, @phone, @email, @age, @gender,
        @service, @date, @timeSlot, 'Website', @message, 'Pending',
        0, @now, @now
      )
    `).run({
      referenceId,
      name: name.trim(),
      phone: cleanPhone,
      email: email ? email.trim() : null,
      age: age ? parseInt(age, 10) : null,
      gender: gender || 'Not Specified',
      service: service.trim(),
      date,
      timeSlot: timeSlot.trim(),
      message: message ? message.trim() : null,
      now
    });

    const newApt = db.prepare('SELECT * FROM appointments WHERE referenceId = ?').get(referenceId);

    // Sync to Vercel Blob so management system immediately sees this booking
    pushToBlob().catch(e => console.error('[Push error]:', e.message));

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      appointment: newApt
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = app;