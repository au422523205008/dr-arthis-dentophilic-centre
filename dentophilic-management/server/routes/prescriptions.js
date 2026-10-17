const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', prescriptionController.getPrescriptions);
router.post('/', prescriptionController.createPrescription);
router.get('/:id', prescriptionController.getPrescriptionById);
router.delete('/:id', prescriptionController.deletePrescription);

module.exports = router;
