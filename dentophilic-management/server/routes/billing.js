const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/invoices', billingController.getInvoices);
router.post('/invoices', billingController.createInvoice);
router.get('/invoices/:id', billingController.getInvoiceById);
router.put('/invoices/:id', billingController.updateInvoice);
router.delete('/invoices/:id', requirePermission('DELETE_BILLS'), billingController.deleteInvoice);

router.post('/payments', billingController.recordPayment);

module.exports = router;
