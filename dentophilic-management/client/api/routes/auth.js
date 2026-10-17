const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.get('/setup-status', authController.checkSetupStatus);
router.post('/setup-admin', authController.setupFirstAdmin);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.requestPasswordResetOtp);
router.post('/reset-password', authController.verifyOtpAndResetPassword);

// Protected routes
router.get('/me', authenticateToken, authController.getMe);
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
