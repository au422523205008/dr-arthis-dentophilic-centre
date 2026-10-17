require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dentophilic_admin_secret_2026';

// CORS setup to allow client and future management dashboard
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
  process.env.MANAGEMENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev environment
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

app.use(express.json());
app.use(morgan('dev'));

// Middleware for authentication on protected routes
function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
  if (!apiKey || apiKey !== ADMIN_API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing API key'
    });
  }
  next();
}

// Helpers
function sanitizePhone(phoneStr) {
  if (!phoneStr) return '';
  // Remove non-digit characters
  const digits = phoneStr.replace(/\D/g, '');
  // If starts with 91 and has 12 digits, strip country code
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  // If starts with 0 and has 11 digits, strip leading 0
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

function isValidIndianPhone(phone) {
  const cleaned = sanitizePhone(phone);
  return /^[6-9]\d{9}$/.test(cleaned);
}

function generateReferenceId() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `DEN-${year}-${randomSuffix}`;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    clinic: "Dr. Arthi's Dentophilic Centre",
    service: 'Dental Clinic Booking API',
    timestamp: new Date().toISOString()
  });
});

// GET /api/appointments/availability?date=YYYY-MM-DD
app.get('/api/appointments/availability', (req, res) => {
  try {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing date parameter. Format must be YYYY-MM-DD.'
      });
    }

    // Query active slots for the given date
    const rows = db.prepare(`
      SELECT timeSlot FROM appointments 
      WHERE date = ? AND status != 'Cancelled' AND (isDeleted = 0 OR isDeleted IS NULL)
    `).all(date);

    const bookedSlots = rows.map(r => r.timeSlot);

    res.json({
      success: true,
      date,
      bookedSlots
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching availability'
    });
  }
});

// POST /api/appointments -> Create new appointment
app.post('/api/appointments', (req, res) => {
  try {
    const { name, phone, email, age, gender, service, date, timeSlot, message } = req.body;

    // Validation
    const errors = [];
    if (!name || name.trim().length < 2) {
      errors.push('Full name is required (at least 2 characters).');
    }

    const cleanPhone = sanitizePhone(phone);
    if (!cleanPhone || !isValidIndianPhone(cleanPhone)) {
      errors.push('Please enter a valid 10-digit Indian mobile number (e.g., 95971 26248).');
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push('Please enter a valid email address.');
    }

    if (!service || !service.trim()) {
      errors.push('Please select a dental service/treatment.');
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push('Please select a valid appointment date.');
    } else {
      // Check if date is in past
      const selectedDate = new Date(`${date}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.push('Appointment date cannot be in the past.');
      }
      // Check if Sunday (Day 0)
      if (selectedDate.getDay() === 0) {
        errors.push('The clinic is closed on Sundays for routine appointments. Please select Monday to Saturday.');
      }
    }

    if (!timeSlot || !timeSlot.trim()) {
      errors.push('Please select an appointment time slot.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join(' ')
      });
    }

    // Check double-booking
    const existing = db.prepare(`
      SELECT id, referenceId FROM appointments 
      WHERE date = ? AND timeSlot = ? AND status != 'Cancelled' AND (isDeleted = 0 OR isDeleted IS NULL)
    `).get(date, timeSlot);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `The time slot (${timeSlot}) on ${date} is already reserved. Please select another convenient time slot.`
      });
    }

    const referenceId = generateReferenceId();
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO appointments (
        referenceId, name, phone, email, age, gender,
        service, date, timeSlot, source, message, status, isDeleted, createdAt, updatedAt
      ) VALUES (
        @referenceId, @name, @phone, @email, @age, @gender,
        @service, @date, @timeSlot, 'Website', @message, 'Pending', 0, @createdAt, @updatedAt
      )
    `);

    insertStmt.run({
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
      createdAt: now,
      updatedAt: now
    });

    const newAppointment = db.prepare(`SELECT * FROM appointments WHERE referenceId = ?`).get(referenceId);

    return res.status(201).json({
      success: true,
      message: 'Appointment scheduled successfully! Our reception team will confirm shortly.',
      appointment: newAppointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    if (error.message && error.message.includes('idx_active_appointment_slot')) {
      return res.status(409).json({
        success: false,
        message: 'This time slot was just booked by another patient. Please choose an alternate slot.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to schedule appointment due to a server error.'
    });
  }
});

// GET /api/appointments -> List appointments (Protected)
app.get('/api/appointments', requireApiKey, (req, res) => {
  try {
    const { date, status, search } = req.query;
    let sql = 'SELECT * FROM appointments WHERE 1=1';
    const params = [];

    if (date) {
      sql += ' AND date = ?';
      params.push(date);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR referenceId LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY date DESC, timeSlot ASC';

    const appointments = db.prepare(sql).all(...params);

    res.json({
      success: true,
      total: appointments.length,
      appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointments'
    });
  }
});

// PATCH /api/appointments/:id -> Update appointment status (Protected)
app.patch('/api/appointments/:id', requireApiKey, (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const allowedStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'No-show'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const newStatus = status || appointment.status;
    const updatedAt = new Date().toISOString();

    db.prepare(`
      UPDATE appointments 
      SET status = ?, updatedAt = ?
      WHERE id = ?
    `).run(newStatus, updatedAt, id);

    const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);

    res.json({
      success: true,
      message: `Appointment ${updated.referenceId} updated to ${newStatus}`,
      appointment: updated
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment'
    });
  }
});

// GET /api/appointments/lookup/:referenceId -> Patient booking lookup
app.get('/api/appointments/lookup/:referenceId', (req, res) => {
  try {
    const { referenceId } = req.params;
    if (!referenceId) {
      return res.status(400).json({ success: false, message: 'Reference ID is required' });
    }
    const appointment = db.prepare(`
      SELECT referenceId, name, service, date, timeSlot, status, createdAt, updatedAt
      FROM appointments 
      WHERE referenceId = ? AND (isDeleted = 0 OR isDeleted IS NULL)
    `).get(referenceId.trim().toUpperCase());

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'No appointment found with this reference ID.' });
    }

    res.json({ success: true, appointment });
  } catch (error) {
    console.error('Error looking up appointment:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/appointments/cancel-request -> Patient cancellation request
app.post('/api/appointments/cancel-request', (req, res) => {
  try {
    const { referenceId, reason } = req.body;
    if (!referenceId) {
      return res.status(400).json({ success: false, message: 'Reference ID is required' });
    }

    const appointment = db.prepare(`
      SELECT * FROM appointments WHERE referenceId = ? AND (isDeleted = 0 OR isDeleted IS NULL)
    `).get(referenceId.trim().toUpperCase());

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Appointment is already cancelled' });
    }

    const now = new Date().toISOString();
    const cancelReason = reason ? `Patient request: ${reason.trim()}` : 'Patient requested cancellation via website';

    db.prepare(`
      UPDATE appointments 
      SET status = 'Cancelled', cancelReason = ?, updatedAt = ?
      WHERE id = ?
    `).run(cancelReason, now, appointment.id);

    res.json({
      success: true,
      message: 'Appointment has been cancelled successfully. The slot is now open.'
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ success: false, message: 'Failed to process cancellation request' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Dr. Arthi's Dentophilic Centre - API Server`);
  console.log(` Running on port http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(` Admin API Key configured: ${ADMIN_API_KEY.slice(0, 4)}****`);
  console.log(`=======================================================`);
});
