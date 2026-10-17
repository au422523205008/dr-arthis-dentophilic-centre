const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);
router.use(requirePermission('VIEW_AUDIT_LOGS'));

router.get('/', auditLogController.getAuditLogs);
router.get('/filters', auditLogController.getAuditFilters);

module.exports = router;
