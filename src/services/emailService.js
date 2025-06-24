const nodemailer = require('nodemailer');
const cron = require('node-cron');
const User = require('../models/userModel');
const Subject = require('../models/subjectModel');
const Topic = require('../models/topicModel');

require('dotenv').config();

// Validate email configuration
const validateEmailConfig = () => {
    const requiredVars = ['EMAIL_USER', 'EMAIL_PASS'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
        console.error('❌ Missing email configuration:', missing.join(', '));
        console.error('Please check your .env file and ensure EMAIL_USER and EMAIL_PASS are set');
        return false;
    }
    
    return true;
};

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
    if (!validateEmailConfig()) {
        return null;
    }

    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Verify transporter configuration
    transporter.verify((error, success) => {
        if (error) {
            console.error('❌ Email transporter verification failed:', error);
        } else {
            // console.log('✅ Email server is ready to send messages');
        }
    });

    return transporter;
};

const transporter = createTransporter();

/**
 * Send an email
 * @param {Object} options - { to, subject, text, html }
 * @returns {Promise}
 */
const sendEmail = async (options) => {
    if (!transporter) {
        throw new Error('Email transporter not configured. Check your .env file.');
    }

    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
    };

    // console.log('📧 Attempting to send email to:', options.to);
    // console.log('📧 Subject:', options.subject);
    
    return transporter.sendMail(mailOptions);
};

// Email templates
const emailTemplates = {
    studyReminder: (userName, topics) => {
        const topicList = topics.map(topic => 
            `• ${topic.name} (${topic.status}) - Due: ${new Date(topic.nextReviewDate).toLocaleDateString()}`
        ).join('\n');

        return {
            subject: '📚 Your Study Reminder - Topics Need Attention!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0;">📚 StudyNow AI</h1>
                        <p style="margin: 10px 0 0 0;">Your Smart Study Companion</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName}! 👋</h2>
                        
                        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                            It's time to review some topics! Your AI study companion has identified the following topics that need your attention:
                        </p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 20px;">
                            <h3 style="color: #333; margin-top: 0;">📋 Topics to Review:</h3>
                            <pre style="font-family: inherit; white-space: pre-wrap; color: #666;">${topicList}</pre>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                                🚀 Start Studying Now
                            </a>
                        </div>
                        
                        <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
                            This reminder was sent by your AI study companion. Keep up the great work! 💪
                        </p>
                    </div>
                </div>
            `
        };
    },

    examReminder: (userName, subject) => {
        const examDate = new Date(subject.examDate).toLocaleDateString();
        const daysLeft = Math.ceil((new Date(subject.examDate) - new Date()) / (1000 * 60 * 60 * 24));

        return {
            subject: `⚠️ Exam Alert: ${subject.name} - ${daysLeft} days left!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0;">⚠️ Exam Alert</h1>
                        <p style="margin: 10px 0 0 0;">${subject.name}</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName}! 👋</h2>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ff6b6b; margin-bottom: 20px;">
                            <h3 style="color: #333; margin-top: 0;">📅 Exam Details:</h3>
                            <p style="color: #666; margin: 10px 0;"><strong>Subject:</strong> ${subject.name}</p>
                            <p style="color: #666; margin: 10px 0;"><strong>Date:</strong> ${examDate}</p>
                            <p style="color: #666; margin: 10px 0;"><strong>Time Left:</strong> ${daysLeft} days</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
                               style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                                📚 Review Now
                            </a>
                        </div>
                        
                        <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
                            Good luck with your exam! You've got this! 🎯
                        </p>
                    </div>
                </div>
            `
        };
    }
};

// Send email function
const sendEmailFunction = async (to, template, data) => {
    try {
        const emailContent = emailTemplates[template](data.userName, data.topics || data.subject);
        
        const result = await sendEmail({
            to: to,
            subject: emailContent.subject,
            html: emailContent.html
        });
        if (result.messageId) {
            // Email sent successfully
            return { success: true, messageId: result.messageId };
        } else {
            return { success: false, error: 'Failed to send email' };
        }
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

// Send study reminder
const sendStudyReminder = async (userEmail, userName, topics) => {
    return await sendEmailFunction(userEmail, 'studyReminder', { userName, topics });
};

// Send exam reminder
const sendExamReminder = async (userEmail, userName, subject) => {
    return await sendEmailFunction(userEmail, 'examReminder', { userName, subject });
};

// --- Email Schedulers ---
const startEmailSchedulers = () => {
    // 1. Daily Study Reminder (runs every day at 9:00 AM server time)
    cron.schedule('0 9 * * *', async () => {
        // console.log('⏰ Running daily study reminder job');
        const users = await User.find({ emailNotificationsEnabled: true });
        for (const user of users) {
            // Find topics due for review today or overdue
            const today = new Date();
            const topics = await Topic.find({
                user: user._id,
                nextReviewDate: { $lte: today }
            });
            if (topics.length > 0) {
                await sendStudyReminder(user.email, user.name || user.email.split('@')[0], topics);
            }
        }
    });

    // 2. Exam Reminders (runs every day at 8:00 AM server time)
    cron.schedule('0 8 * * *', async () => {
        // console.log('⏰ Running daily exam reminder job');
        const users = await User.find({ emailNotificationsEnabled: true });
        for (const user of users) {
            const subjects = await Subject.find({ user: user._id, examDate: { $ne: null } });
            for (const subject of subjects) {
                if (!subject.examDate) continue;
                const today = new Date();
                const examDate = new Date(subject.examDate);
                const daysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
                if ([7, 5, 3, 1].includes(daysLeft)) {
                    await sendExamReminder(user.email, user.name || user.email.split('@')[0], subject);
                }
            }
        }
    });
};

module.exports = {
    sendStudyReminder,
    sendExamReminder,
    sendEmail,
    startEmailSchedulers
}; 