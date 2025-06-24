const Subject = require('../models/subjectModel');
const Topic = require('../models/topicModel');

// @desc    Get all subjects for a user
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({ user: req.user.id });
        res.status(200).json(subjects);
    } catch (error) {
        console.error('Get Subjects Error:', error.message);
        res.status(500).json({ message: 'Server error while fetching subjects' });
    }
};

// @desc    Get a single subject
// @route   GET /api/subjects/:id
// @access  Private
const getSubject = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        if (subject.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized access' });
        }

        res.status(200).json(subject);
    } catch (error) {
        console.error('Get Subject Error:', error.message);
        res.status(500).json({ message: 'Server error while fetching subject' });
    }
};

// @desc    Create a subject
// @route   POST /api/subjects
// @access  Private
const createSubject = async (req, res) => {
    const { name, examDate } = req.body;

    try {
        const newSubject = new Subject({
            user: req.user.id,
            name,
            examDate,
        });

        const savedSubject = await newSubject.save();
        res.status(201).json(savedSubject);
    } catch (error) {
        console.error('Create Subject Error:', error.message);
        res.status(500).json({ message: 'Server error while creating subject' });
    }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private
const updateSubject = async (req, res) => {
    const { name, examDate } = req.body;

    try {
        let subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        if (subject.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized access' });
        }

        subject.name = name || subject.name;
        subject.examDate = examDate || subject.examDate;

        const updatedSubject = await subject.save();
        res.status(200).json(updatedSubject);
    } catch (error) {
        console.error('Update Subject Error:', error.message);
        res.status(500).json({ message: 'Server error while updating subject' });
    }
};

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private
const deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        if (subject.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized access' });
        }

        // Cascade delete: Remove all topics associated with this subject
        await Topic.deleteMany({ subject: req.params.id });

        // Delete the subject itself
        await Subject.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ message: 'Subject and associated topics deleted successfully' });
    } catch (error) {
        console.error('Delete Subject Error:', error.message);
        res.status(500).json({ message: 'Server error while deleting subject' });
    }
};

module.exports = {
    getSubjects,
    getSubject,
    createSubject,
    updateSubject,
    deleteSubject,
};
