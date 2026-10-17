const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/auth');

// Public endpoints (accessible by website visitors without login)
router.get('/availability', appointmentController.getAvailability);

// Allow both public website booking and authenticated staff booking
router.post('/', (req, res, next) => {
  if (req.headers.authorization) {
    return authenticateToken(req, res, () => appointmentController.createAppointment(req, res));
  }
  req.body.source = req.body.source || 'Website';
  return appointmentController.createAppointment(req, res);
});

// All subsequent clinical operations require staff authentication
router.use(authenticateToken);

router.get('/', appointmentController.getAppointments);

router.get('/pending-website', (req, res, next) => {
  req.query.source = 'Website';
  req.query.status = 'Pending';
  return appointmentController.getAppointments(req, res, next);
});

router.get('/today-queue', (req, res, next) => {
  req.query.date = new Date().toISOString().split('T')[0];
  return appointmentController.getAppointments(req, res, next);
});

router.get('/:id', appointmentController.getAppointmentById);
router.put('/:id', appointmentController.updateAppointment);
router.patch('/:id', appointmentController.updateAppointment);
router.patch('/:id/status', appointmentController.updateAppointment);
router.patch('/:id/reschedule', appointmentController.updateAppointment);
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;
