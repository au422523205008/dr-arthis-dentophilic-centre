require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { runMigrations } = require('./db/migrate');
const { createBackupFile } = require('./controllers/backupController');

// Ensure DB migrations have run
runMigrations();

const app = express();
const PORT = process.env.PORT || 5001;

// Allowed frontend origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in local dev
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: "Dr. Arthi's Dentophilic Clinic Management API",
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/treatments', require('./routes/treatments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/dental-chart', require('./routes/dentalChart'));
app.use('/api/follow-ups', require('./routes/followUps'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/recycle-bin', require('./routes/recycleBin'));
app.use('/api/backups', require('./routes/backups'));
app.use('/api/settings', require('./routes/settings'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Management Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Scheduled daily backup (every 24 hours)
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
setInterval(() => {
  try {
    console.log('[Backup Scheduler] Triggering automatic daily database backup...');
    createBackupFile(true);
    console.log('[Backup Scheduler] Daily backup completed successfully.');
  } catch (err) {
    console.error('[Backup Scheduler] Error executing daily backup:', err);
  }
}, TWENTY_FOUR_HOURS);

// Start server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🦷 Dentophilic Clinic Management API Server`);
  console.log(`🚀 Running at http://localhost:${PORT}`);
  console.log(`📁 Shared DB: appointments.db (WAL mode active)`);
  console.log(`====================================================`);
});
