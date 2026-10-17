const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/financial', requirePermission('VIEW_FINANCES'), reportController.getFinancialReports);
router.get('/export/csv', requirePermission('EXPORT_DATA'), reportController.exportDataAsCsv);

module.exports = router;
