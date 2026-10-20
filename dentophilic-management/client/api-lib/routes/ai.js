const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

// Allow authenticated clinical staff
router.use(authenticateToken);

router.post('/chat', aiController.handleAIChat);

module.exports = router;
