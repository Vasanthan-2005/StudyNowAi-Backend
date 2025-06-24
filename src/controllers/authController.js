const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'defaultsecret', {
        expiresIn: '8h',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    let { name, email, password } = req.body;
    email = email.toLowerCase();

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'This email is already registered. Please log in.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        const token = generateToken(user._id);
        res.status(201).json({ 
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                emailNotificationsEnabled: user.emailNotificationsEnabled,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Register Error:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    let { email, password } = req.body;
    email = email.toLowerCase();

    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'No account found with this email. Please register.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(404).json({ message: 'Incorrect password.' });
        }

        const token = generateToken(user._id);
        res.status(200).json({ 
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                emailNotificationsEnabled: user.emailNotificationsEnabled,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { name } = req.body;

        // Validate input
        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 2 characters long'
            });
        }

        // Find and update user
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { name: name.trim() },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

// @desc    Update user preferences
// @route   PUT /api/auth/preferences
// @access  Private
const updatePreferences = async (req, res) => {
    try {
        const { dailyStudyGoal, reminderTime, topicPriorityWeight, reviewFrequency } = req.body;

        // Validate input
        const validGoals = ['30 minutes', '1 hour', '2 hours', '3 hours', '4+ hours'];
        const validWeights = ['Balanced', 'Focus on Hard Topics', 'Focus on Easy Topics'];
        const validFrequencies = ['Standard', 'Frequent', 'Intensive'];

        if (dailyStudyGoal && !validGoals.includes(dailyStudyGoal)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid daily study goal'
            });
        }

        if (topicPriorityWeight && !validWeights.includes(topicPriorityWeight)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid topic priority weight'
            });
        }

        if (reviewFrequency && !validFrequencies.includes(reviewFrequency)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid review frequency'
            });
        }

        // Validate time format (HH:MM)
        if (reminderTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminderTime)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid time format. Use HH:MM format'
            });
        }

        // Build update object with only provided fields
        const updateData = {};
        if (dailyStudyGoal) updateData['preferences.dailyStudyGoal'] = dailyStudyGoal;
        if (reminderTime) updateData['preferences.reminderTime'] = reminderTime;
        if (topicPriorityWeight) updateData['preferences.topicPriorityWeight'] = topicPriorityWeight;
        if (reviewFrequency) updateData['preferences.reviewFrequency'] = reviewFrequency;

        // Find and update user
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Preferences updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update preferences'
        });
    }
};

const updateEmailSettings = async (req, res) => {
    try {
        const { emailNotificationsEnabled } = req.body;

        if (typeof emailNotificationsEnabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Invalid input for emailNotificationsEnabled. Must be a boolean.'
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { emailNotificationsEnabled },
            { new: true, runValidators: true }
        ).select('emailNotificationsEnabled');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Email notifications ${emailNotificationsEnabled ? 'enabled' : 'disabled'} successfully.`,
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating email settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update email settings'
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    updateProfile,
    updatePreferences,
    updateEmailSettings
};
