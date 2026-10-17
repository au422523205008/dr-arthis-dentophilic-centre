const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'appointments.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for high-concurrency read/write
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Create appointments table with source & soft delete columns if not exists
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

  CREATE UNIQUE INDEX IF NOT EXISTS idx_active_appointment_slot 
  ON appointments(date, timeSlot) 
  WHERE status != 'Cancelled' AND isDeleted = 0;
`);

// NOTE: Strict policy - NO dummy or seed appointments are ever inserted.
// Data is only created by real patient bookings from the website or staff.

module.exports = db;
