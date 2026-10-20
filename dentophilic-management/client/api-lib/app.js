const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { ensureCloudDbReady, getActiveDbInstance, getResolvedDbPath } = require('./db');
const { syncCloudDbImmediate } = require('./db/cloudSync');

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

// Robust Cloud Persistence Middleware
// 1. Ensures remote database is downloaded from Vercel Blob before request execution
// 2. Intercepts successful writes (POST, PUT, PATCH, DELETE) and awaits Vercel Blob upload before response completes
app.use(async (req, res, next) => {
  try {
    await ensureCloudDbReady();
  } catch (err) {
    console.error('[Cloud DB Middleware Warning]:', err.message);
  }

  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (isMutating) {
    const originalJson = res.json.bind(res);
    res.json = async function(body) {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const activeDb = getActiveDbInstance();
          const dbPath = getResolvedDbPath();
          await syncCloudDbImmediate(dbPath, activeDb);
        }
      } catch (syncErr) {
        console.error('[Cloud Auto-Sync Error on Write]:', syncErr.message);
      }
      return originalJson(body);
    };
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
app.use('/api/ai', require('./routes/ai'));

// Catch-all 404 for unhandled API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

module.exports = app;
