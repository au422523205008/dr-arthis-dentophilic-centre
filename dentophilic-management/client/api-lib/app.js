const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { runMigrations } = require('./db/migrate');

// Run migrations on start
try {
  runMigrations();
} catch (e) {
  console.warn('[Migrations warning]:', e.message);
}

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const { ensureCloudDbReady } = require('./db');
// Ensure persistent cloud database is loaded from Vercel Blob before serving requests
app.use(async (req, res, next) => {
  try {
    await ensureCloudDbReady();
  } catch (err) {
    console.error('[Cloud DB Middleware Warning]:', err.message);
  }
  next();
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: "Dr. Arthi's Dentophilic Management API",
    time: new Date().toISOString()
  });
});

// Mount all modular API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/treatments', require('./routes/treatments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/backups', require('./routes/backups'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/dental-chart', require('./routes/dentalChart'));

// Catch-all 404 for unhandled API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});


module.exports = app;
