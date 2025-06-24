const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    subjectPreferences: {
        type: [String],
        default: [],
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    isVerified: {
        type: Boolean,
        default: true, // Set to false if you want to add email verification later
    },
    // User's study preferences
    preferences: {
        dailyStudyGoal: {
            type: String,
            enum: ['30 minutes', '1 hour', '2 hours', '3 hours', '4+ hours'],
            default: '1 hour'
        },
        reminderTime: {
            type: String,
            default: '09:00'
        },
        topicPriorityWeight: {
            type: String,
            enum: ['Balanced', 'Focus on Hard Topics', 'Focus on Easy Topics'],
            default: 'Balanced'
        },
        reviewFrequency: {
            type: String,
            enum: ['Standard', 'Frequent', 'Intensive'],
            default: 'Standard'
        }
    },
    emailNotificationsEnabled: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
