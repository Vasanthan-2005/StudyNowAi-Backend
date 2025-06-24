const express = require('express');
const router = express.Router();
const { getStudySchedule, getUpcomingExams, getRemindersController } = require('../controllers/studyController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/study/schedule
// @desc    Get AI-generated study schedule
// @access  Private
router.route('/schedule').get(protect, getStudySchedule);

// @route   GET /api/study/exams
// @desc    Get upcoming exams
// @access  Private
router.route('/exams').get(protect, getUpcomingExams);

// @route   GET /api/study/reminders
// @desc    Get reminders for overdue or urgent topics
// @access  Private
router.route('/reminders').get(protect, getRemindersController);

module.exports = router;
