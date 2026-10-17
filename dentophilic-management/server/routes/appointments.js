const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', appointmentController.getAppointments);
router.post('/', appointmentController.createAppointment);

// Specific GET routes MUST be before /:id parameter
router.get('/availability', appointmentController.getAvailability);

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
