const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);
router.use(requirePermission('MANAGE_BACKUPS'));

router.get('/', backupController.listBackups);
router.post('/create', backupController.triggerManualBackup);
router.get('/download/:filename', backupController.downloadBackup);
router.post('/restore', backupController.restoreBackup);

module.exports = router;
