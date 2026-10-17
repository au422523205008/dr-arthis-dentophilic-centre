const express = require('express');
const cors = require('cors');
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
    }
  }
} else {
  resolvedDbPath = fs.existsSync(bundledDb) ? bundledDb : tmpDb;
}

const db = new DatabaseSync(resolvedDbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Ensure table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referenceId TEXT UNIQUE NOT NULL,
    patientId INTEGER,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    age INTEGER,
    gender TEXT,
    service TEXT NOT NULL,
    date TEXT NOT NULL,
    timeSlot TEXT NOT NULL,
    source TEXT DEFAULT 'Website' CHECK(source IN ('Website', 'Walk-in / Phone / Offline')),
    message TEXT,
    doctorNotes TEXT,
    status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Confirmed', 'Arrived', 'In Treatment', 'Completed', 'Cancelled', 'No-show')),
    cancelReason TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    isDeleted INTEGER DEFAULT 0,
    deletedAt TEXT,
    deletedBy INTEGER
  );
`);

function sanitizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
}

function generateReferenceId() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `DEN-${year}-${randomSuffix}`;
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Dentophilic Website Booking API' });
});

// GET /api/appointments/availability?date=YYYY-MM-DD
app.get('/api/appointments/availability', (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date required' });

    const rows = db.prepare(`
      SELECT timeSlot FROM appointments 
      WHERE date = ? AND status != 'Cancelled' AND (isDeleted = 0 OR isDeleted IS NULL)
    `).all(date);

    res.json({
      success: true,
      date,
      bookedSlots: rows.map(r => r.timeSlot)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/appointments
app.post('/api/appointments', (req, res) => {
  try {
    const { name, phone, email, age, gender, service, date, timeSlot, message } = req.body;
    if (!name || name.trim().length < 2) return res.status(400).json({ success: false, message: 'Valid name required' });
    const cleanPhone = sanitizePhone(phone);
    if (!cleanPhone || cleanPhone.length < 10) return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number required' });
    if (!service || !date || !timeSlot) return res.status(400).json({ success: false, message: 'Service, date and slot required' });

    // Conflict check
    const existing = db.prepare(`
      SELECT id, referenceId FROM appointments 
      WHERE date = ? AND timeSlot = ? AND status != 'Cancelled' AND (isDeleted = 0 OR isDeleted IS NULL)
    `).get(date, timeSlot);

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
