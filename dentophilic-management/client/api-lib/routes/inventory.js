const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', inventoryController.getInventory);
router.post('/', requirePermission('MANAGE_INVENTORY'), inventoryController.createInventoryItem);
router.put('/:id', requirePermission('MANAGE_INVENTORY'), inventoryController.updateInventoryItem);
router.post('/:id/adjust-stock', requirePermission('MANAGE_INVENTORY'), inventoryController.adjustStock);
router.delete('/:id', requirePermission('MANAGE_INVENTORY'), inventoryController.deleteInventoryItem);

module.exports = router;
