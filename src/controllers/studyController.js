const { getStudySchedule: getSchedule, getUpcomingExams: getExams, getReminders } = require('../services/studyService');

// @desc    Get AI-generated study schedule for logged-in user
// @route   GET /api/study
// @access  Private
const getStudySchedule = async (req, res) => {
    try {
        const schedule = await getSchedule(req.user.id);

        if (!schedule || schedule.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(schedule);
    } catch (error) {
        console.error('Error fetching study schedule:', error.message);
        res.status(500).json({ message: 'Failed to fetch study schedule' });
    }
};

// @desc    Get upcoming exams for logged-in user
// @route   GET /api/study/exams
// @access  Private
const getUpcomingExams = async (req, res) => {
    try {
        const exams = await getExams(req.user.id);
        res.status(200).json(exams);
    } catch (error) {
        console.error('Error fetching upcoming exams:', error.message);
        res.status(500).json({ message: 'Failed to fetch upcoming exams' });
    }
};

// @desc    Get reminders for overdue or urgent topics
// @route   GET /api/study/reminders
// @access  Private
const getRemindersController = async (req, res) => {
    try {
        const reminders = await getReminders(req.user.id);
        res.status(200).json(reminders);
    } catch (error) {
        console.error('Error fetching reminders:', error.message);
        res.status(500).json({ message: 'Failed to fetch reminders' });
    }
};

module.exports = {
    getStudySchedule,
    getUpcomingExams,
    getRemindersController,
};
