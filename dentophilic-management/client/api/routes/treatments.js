const express = require('express');
const router = express.Router();
const treatmentController = require('../controllers/treatmentController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

// Service catalog
router.get('/services', treatmentController.getServices);
router.post('/services', requirePermission('MANAGE_SERVICES_PRICING'), treatmentController.createService);
router.put('/services/:id', requirePermission('MANAGE_SERVICES_PRICING'), treatmentController.updateService);
router.delete('/services/:id', requirePermission('MANAGE_SERVICES_PRICING'), treatmentController.deleteService);

// Clinical treatment records
router.get('/records', treatmentController.getTreatmentRecords);
router.post('/records', treatmentController.createTreatmentRecord);
router.delete('/records/:id', requirePermission('DELETE_PATIENTS'), treatmentController.deleteTreatmentRecord);

module.exports = router;
