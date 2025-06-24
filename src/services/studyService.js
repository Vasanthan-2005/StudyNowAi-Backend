const Topic = require('../models/topicModel');
const Subject = require('../models/subjectModel');

// These are the review intervals (in days) for each difficulty level
const reviewIntervals = {
    easy: [1, 3, 7, 14, 30],
    medium: [1, 2, 5, 10, 21],
    hard: [1, 1, 2, 3, 5],
};

// This function figures out when the next review should be, based on difficulty
const calculateNextReviewDate = (difficulty, lastReviewed) => {
    const today = new Date();
    // This is a simplified logic. A real app would track the repetition count.
    // For now, we'll just add the first interval.
    const interval = reviewIntervals[difficulty][0]; 
    const nextDate = new Date(lastReviewed || today);
    nextDate.setDate(nextDate.getDate() + interval);
    return nextDate;
};

// Enhanced function to calculate exam urgency score
const calculateExamUrgencyScore = (examDate) => {
    if (!examDate) return 0;
    
    const today = new Date();
    const exam = new Date(examDate);
    const daysUntilExam = (exam - today) / (1000 * 60 * 60 * 24);
    
    if (daysUntilExam <= 0) return 0; // Exam has passed
    
    // Exponential urgency as exam approaches
    if (daysUntilExam <= 1) return 50; // Day before exam
    if (daysUntilExam <= 3) return 40; // 2-3 days before
    if (daysUntilExam <= 7) return 30; // Week before exam
    if (daysUntilExam <= 14) return 20; // 2 weeks before
    if (daysUntilExam <= 30) return 15; // Month before
    if (daysUntilExam <= 60) return 10; // 2 months before
    if (daysUntilExam <= 90) return 5;  // 3 months before
    
    return 2; // More than 3 months away
};

// This function gives each topic a score to help decide what to study next
const calculatePriorityScore = (topic, subject, userPreferences) => {
    let score = 0;
    const today = new Date();

    // Base score from status
    const statusWeight = { new: 5, learning: 3, revised: 1 };
    score += statusWeight[topic.status] || 0;

    // Difficulty weight
    const difficultyWeight = { easy: 1, medium: 2, hard: 3 };
    score += difficultyWeight[topic.difficulty] || 2;

    // User preference adjustments
    if (userPreferences?.topicPriorityWeight) {
        switch (userPreferences.topicPriorityWeight) {
            case 'Focus on Hard Topics':
                if (topic.difficulty === 'hard') score += 3;
                else if (topic.difficulty === 'medium') score += 1;
                break;
            case 'Focus on Easy Topics':
                if (topic.difficulty === 'easy') score += 2;
                break;
            case 'Balanced':
            default:
                // Default balanced scoring
                break;
        }
    }

    // Overdue review penalty (highest priority)
    if (topic.nextReviewDate && new Date(topic.nextReviewDate) < today) {
        const daysOverdue = (today - new Date(topic.nextReviewDate)) / (1000 * 60 * 60 * 24);
        score += 25 + (daysOverdue * 2); // Increased penalty for overdue topics
    }

    // Exam date urgency (second highest priority)
    if (subject?.examDate) {
        const examUrgencyScore = calculateExamUrgencyScore(subject.examDate);
        score += examUrgencyScore;
        
        // Additional boost for topics that haven't been revised before exam
        if (topic.status !== 'revised') {
        const examDate = new Date(subject.examDate);
        const daysUntilExam = (examDate - today) / (1000 * 60 * 60 * 24);

            if (daysUntilExam > 0 && daysUntilExam <= 30) {
                // Boost unrevised topics more as exam approaches
                score += (30 - daysUntilExam) * 0.5;
        }
        }
    }

    // Time since creation boost for non-revised topics
    if (topic.status !== 'revised') {
        const daysSinceCreation = (today - new Date(topic.createdAt)) / (1000 * 60 * 60 * 24);
        score += daysSinceCreation * 0.1;
    }

    return score;
};

// Update priority scores for all topics of a user
const updatePriorityScores = async (userId) => {
    const topics = await Topic.find({ user: userId });
    const subjects = await Subject.find({ user: userId });
    const User = require('../models/userModel');
    const user = await User.findById(userId);

    const subjectMap = subjects.reduce((map, subject) => {
        map[subject._id] = subject;
        return map;
    }, {});

    for (const topic of topics) {
        const subject = subjectMap[topic.subject];
        if (subject) {
            topic.priorityScore = calculatePriorityScore(topic, subject, user?.preferences);
            await topic.save();
        }
    }
};

// Get the top high-priority topics for the user
const getStudySchedule = async (userId) => {
    await updatePriorityScores(userId);
    
    // Get user preferences to determine how many topics to return
    const User = require('../models/userModel');
    const user = await User.findById(userId);
    
    // Calculate target topics based on daily study goal
    let targetTopics = 10; // default
    if (user?.preferences?.dailyStudyGoal) {
        switch (user.preferences.dailyStudyGoal) {
            case '30 minutes':
                targetTopics = 5;
                break;
            case '1 hour':
                targetTopics = 8;
                break;
            case '2 hours':
                targetTopics = 12;
                break;
            case '3 hours':
                targetTopics = 15;
                break;
            case '4+ hours':
                targetTopics = 20;
                break;
        }
    }
    
    const topics = await Topic.find({ user: userId })
        .populate('subject', 'name examDate')
        .sort({ priorityScore: -1 })
        .limit(targetTopics);
    return topics;
};

// Get upcoming exams for the user
const getUpcomingExams = async (userId) => {
    const subjects = await Subject.find({ 
        user: userId, 
        examDate: { $gte: new Date() } 
    }).sort({ examDate: 1 });
    
    return subjects;
};

// Get reminders for overdue or urgent topics
const getReminders = async (userId) => {
    const today = new Date();
    const topics = await Topic.find({ user: userId }).populate('subject', 'name examDate');
    const reminders = [];

    for (const topic of topics) {
        // Overdue for review
        if (topic.nextReviewDate && new Date(topic.nextReviewDate) < today) {
            reminders.push({
                type: 'overdue',
                topic: topic.name,
                subject: topic.subject.name,
                message: `Topic "${topic.name}" in subject "${topic.subject.name}" is overdue for review.`
            });
        }
        // Exam is soon and topic is not revised
        if (topic.subject.examDate) {
            const examDate = new Date(topic.subject.examDate);
            const daysUntilExam = (examDate - today) / (1000 * 60 * 60 * 24);
            if (daysUntilExam > 0 && daysUntilExam <= 7 && topic.status !== 'revised') {
                reminders.push({
                    type: 'urgent',
                    topic: topic.name,
                    subject: topic.subject.name,
                    message: `Topic "${topic.name}" in subject "${topic.subject.name}" is urgent! Exam in ${Math.ceil(daysUntilExam)} days.`
                });
            }
        }
    }
    return reminders;
};

module.exports = {
    getStudySchedule,
    updatePriorityScores,
    calculateNextReviewDate,
    calculateExamUrgencyScore,
    getUpcomingExams,
    getReminders,
};
