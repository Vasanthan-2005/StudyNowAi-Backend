const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    sendImmediateReminder,
    testEmailNotification,
    testEmailConfig
} = require('../controllers/notificationController');

// Test email configuration (no auth required for debugging)
router.get('/test-config', testEmailConfig);

// All other routes are protected (require authentication)
router.use(protect);

// Send immediate study reminder
router.post('/send-reminder', sendImmediateReminder);

// Test email notification
router.post('/test-email', testEmailNotification);

module.exports = router; 