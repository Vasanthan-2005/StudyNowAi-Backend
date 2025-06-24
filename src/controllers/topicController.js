const Topic = require('../models/topicModel');
const { calculateNextReviewDate } = require('../services/studyService');

// @desc    Get all topics for a user
// @route   GET /api/topics
// @access  Private
const getTopics = async (req, res) => {
    try {
        const topics = await Topic.find({ user: req.user.id }).populate('subject', 'name');
        res.status(200).json(topics);
    } catch (error) {
        console.error('Get Topics Error:', error.message);
        res.status(500).json({ message: 'Server error while fetching topics' });
    }
};

// @desc    Get a single topic
// @route   GET /api/topics/:id
// @access  Private
const getTopic = async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id);

        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        if (topic.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized access' });
        }

        res.status(200).json(topic);
    } catch (error) {
        console.error('Get Topic Error:', error.message);
        res.status(500).json({ message: 'Server error while fetching topic' });
    }
};

// @desc    Create a topic
// @route   POST /api/topics
// @access  Private
const createTopic = async (req, res) => {
    const { subject, name, status = 'new', difficulty = 'medium' } = req.body;

    try {
        const newTopic = new Topic({
            user: req.user.id,
            subject,
            name,
            status,
            difficulty,
        });

        const savedTopic = await newTopic.save();
        res.status(201).json(savedTopic);
    } catch (error) {
        console.error('Create Topic Error:', error.message);
        res.status(500).json({ message: 'Server error while creating topic' });
    }
};

// @desc    Update a topic
// @route   PUT /api/topics/:id
// @access  Private
const updateTopic = async (req, res) => {
    const { subject, name, status, difficulty, lastReviewed } = req.body;

    try {
        let topic = await Topic.findById(req.params.id);

        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        if (topic.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized access' });
        }

        topic.subject = subject || topic.subject;
        topic.name = name || topic.name;
        topic.status = status || topic.status;
        topic.difficulty = difficulty || topic.difficulty;
        
        // If the review date is being updated, calculate the next review
        if (lastReviewed) {
            topic.lastReviewed = new Date(lastReviewed);
            topic.nextReviewDate = calculateNextReviewDate(topic.difficulty, topic.lastReviewed);
        }

        const updatedTopic = await topic.save();
        await updatedTopic.populate('subject', 'name');
        res.status(200).json(updatedTopic);
    } catch (error) {
        console.error('Update Topic Error:', error.message);
        res.status(500).json({ message: 'Server error while updating topic' });
    }
};

// @desc    Delete a topic
// @route   DELETE /api/topics/:id
// @access  Private
const deleteTopic = async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id);

        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        if (topic.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized access' });
        }

        await Topic.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Topic deleted successfully' });
    } catch (error) {
        console.error('Delete Topic Error:', error.message);
        res.status(500).json({ message: 'Server error while deleting topic' });
    }
};

module.exports = {
    getTopics,
    getTopic,
    createTopic,
    updateTopic,
    deleteTopic,
};
