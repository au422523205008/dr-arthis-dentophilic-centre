const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', patientController.getPatients);
router.post('/', patientController.createPatient);
router.post('/merge', requirePermission('MANAGE_PATIENTS'), patientController.mergePatients);
router.get('/:id', patientController.getPatientProfile);
router.put('/:id', patientController.updatePatient);
router.delete('/:id', requirePermission('DELETE_PATIENTS'), patientController.deletePatient);

module.exports = router;
