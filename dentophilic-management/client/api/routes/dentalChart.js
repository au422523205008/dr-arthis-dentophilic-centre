const express = require('express');
const router = express.Router();
const dentalChartController = require('../controllers/dentalChartController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/patient/:patientId', dentalChartController.getDentalChart);
router.post('/patient/:patientId', dentalChartController.updateToothCondition);

module.exports = router;
