const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);
router.use(requirePermission('MANAGE_STAFF'));

router.get('/', staffController.getUsers);
router.post('/', staffController.createUser);
router.get('/:id', staffController.getUserById);
router.put('/:id', staffController.updateUser);
router.post('/:id/reset-password', staffController.resetPassword);
router.delete('/:id', staffController.deleteUser);

module.exports = router;
