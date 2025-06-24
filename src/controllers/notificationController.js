const User = require('../models/userModel');
const Topic = require('../models/topicModel');
const Subject = require('../models/subjectModel');
const { sendStudyReminder, sendExamReminder } = require('../services/emailService');

// Helper function to check if email notifications are enabled
const canSendEmail = (user) => {
    if (!user.emailNotificationsEnabled) {
        // console.log(`Email notifications are disabled for user: ${user.email}`);
        return false;
    }
    return true;
};

// Send immediate study reminder to logged-in user
const sendImmediateReminder = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check user's preference before sending
        if (!canSendEmail(user)) {
            return res.status(403).json({
                success: false,
                message: 'Email notifications are disabled for this user.'
            });
        }

        // Get overdue and urgent topics for the user
        const today = new Date();
        const urgentTopics = await Topic.find({
            user: user._id,
            $or: [
                { nextReviewDate: { $lt: today } }, // Overdue
                { 
                    nextReviewDate: { 
                        $gte: today, 
                        $lte: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
                    } 
                } // Due today
            ]
        }).populate('subject', 'name');

        if (urgentTopics.length === 0) {
            return res.status(200).json({ 
                success: true, 
                message: 'No urgent topics found for reminder' 
            });
        }

        // Send email reminder
        const result = await sendStudyReminder(
            user.email,
            user.name || user.email.split('@')[0],
            urgentTopics
        );

        if (result.success) {
            res.status(200).json({ 
                success: true, 
                message: 'Study reminder sent successfully' 
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: result.error 
            });
        }
    } catch (error) {
        console.error('Error sending immediate reminder:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send reminder' 
        });
    }
};

// Test email notification (for development)
const testEmailNotification = async (req, res) => {
    try {
        const { emailType } = req.body;
        
        if (!emailType || !['study', 'exam'].includes(emailType)) {
            return res.status(400).json({
                success: false,
                message: 'Email type must be "study" or "exam"'
            });
        }

        // Check if email credentials are configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(400).json({
                success: false,
                message: 'Email credentials not configured on the server.'
            });
        }

        const user = await User.findById(req.user.id);
        if (!canSendEmail(user)) {
            return res.status(403).json({
                success: false,
                message: 'Email notifications are disabled for this user.'
            });
        }

        // Get user's topics for testing
        let testData;
        
        if (emailType === 'study') {
            const topics = await Topic.find({ user: req.user.id }).limit(3);
            testData = {
                userName: user.name || user.email.split('@')[0],
                topics: topics.length > 0 ? topics : [
                    { name: 'Sample Topic 1', status: 'new', nextReviewDate: new Date() },
                    { name: 'Sample Topic 2', status: 'learning', nextReviewDate: new Date() }
                ]
            };
        } else {
            const subject = await Subject.findOne({ user: req.user.id });
            testData = {
                userName: user.name || user.email.split('@')[0],
                subject: subject || {
                    name: 'Sample Subject',
                    examDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            };
        }
        
        let result;
        if (emailType === 'study') {
            result = await sendStudyReminder(user.email, testData.userName, testData.topics);
        } else {
            result = await sendExamReminder(user.email, testData.userName, testData.subject);
        }

        if (result.success) {
            res.status(200).json({
                success: true,
                message: `${emailType} test email sent successfully`
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error
            });
        }
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email: ' + error.message
        });
    }
};

// Test email configuration
const testEmailConfig = async (req, res) => {
    try {
        // Check environment variables
        const config = {
            EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail',
            EMAIL_USER: process.env.EMAIL_USER ? '✅ Set' : '❌ Missing',
            EMAIL_PASS: process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing',
            EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER || '❌ Missing'
        };

        res.status(200).json({
            success: true,
            message: 'Email configuration status',
            config
        });
    } catch (error) {
        console.error('Error testing email config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test email configuration: ' + error.message
        });
    }
};

module.exports = {
    sendImmediateReminder,
    testEmailNotification,
    testEmailConfig
}; 