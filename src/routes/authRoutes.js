const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateProfile, updatePreferences, updateEmailSettings } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.put('/profile', protect, updateProfile);
router.put('/preferences', protect, updatePreferences);
router.put('/settings/email', protect, updateEmailSettings);

module.exports = router;
