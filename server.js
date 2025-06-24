const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

// --- Models ---
const User = require('./src/models/userModel');
const Subject = require('./src/models/subjectModel');
const Topic = require('./src/models/topicModel');

// --- Services ---
const { sendStudyReminder, sendExamReminder, startEmailSchedulers } = require('./src/services/emailService');

// --- Environment Variables ---
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Core Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
const authRoutes = require('./src/routes/authRoutes');
const studyRoutes = require('./src/routes/studyRoutes');
const subjectRoutes = require('./src/routes/subjectRoutes');
const topicRoutes = require('./src/routes/topicRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/notifications', notificationRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('🚀 StudyNow API is running!');
});

// --- Error Handling ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false,
        message: 'Something went wrong!'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false,
        message: 'Route not found'
    });
});

// --- Server Startup ---
const startServer = async () => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('❌ MONGO_URI not set in .env file');
        process.exit(1);
    }
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB connected');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    }
    
    app.listen(PORT, () => {
        console.log(`🚀 Server started on http://localhost:${PORT}`);
        console.log('📧 Email schedulers starting...');
        startEmailSchedulers(); // Start scheduled email jobs
    });
};

startServer();
