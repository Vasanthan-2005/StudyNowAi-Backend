const express = require('express');
const router = express.Router();
const {
    getSubjects,
    getSubject,
    createSubject,
    updateSubject,
    deleteSubject,
} = require('../controllers/subjectController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET/POST /api/subjects
// @desc    Get all subjects or create a new subject
// @access  Private
router.route('/')
    .get(protect, getSubjects)
    .post(protect, createSubject);

// @route   GET/PUT/DELETE /api/subjects/:id
// @desc    Single subject operations
// @access  Private
router.route('/:id')
    .get(protect, getSubject)
    .put(protect, updateSubject)
    .delete(protect, deleteSubject);

module.exports = router;
