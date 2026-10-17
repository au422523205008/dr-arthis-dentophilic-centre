const express = require('express');
const router = express.Router();
const recycleBinController = require('../controllers/recycleBinController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', recycleBinController.getDeletedItems);
router.post('/restore/:entity/:id', recycleBinController.restoreItem);
router.delete('/permanent/:entity/:id', requirePermission('PERMANENT_DELETE'), recycleBinController.permanentlyDeleteItem);

module.exports = router;
