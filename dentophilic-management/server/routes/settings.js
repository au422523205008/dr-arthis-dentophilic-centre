const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', settingsController.getSettings);
router.put('/', requirePermission('MANAGE_SETTINGS'), settingsController.updateSettings);

module.exports = router;
