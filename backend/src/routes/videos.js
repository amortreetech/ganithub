const express = require('express');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/videos
// @desc    Get all recorded videos
// @access  Private
router.get('/', async (req, res) => {
    res.json({ 
        success: true, 
        message: 'Get recorded videos - To be implemented',
        data: []
    });
});

// @route   POST /api/videos
// @desc    Upload new video
// @access  Private (Admin, Tutor)
router.post('/', authorize('admin', 'tutor'), async (req, res) => {
    res.json({ 
        success: true, 
        message: 'Upload video - To be implemented' 
    });
});

// @route   GET /api/videos/:id
// @desc    Get video by ID
// @access  Private
router.get('/:id', async (req, res) => {
    res.json({ 
        success: true, 
        message: 'Get video by ID - To be implemented' 
    });
});

// @route   POST /api/videos/:id/progress
// @desc    Update video watch progress
// @access  Private (Student)
router.post('/:id/progress', authorize('student'), async (req, res) => {
    res.json({ 
        success: true, 
        message: 'Update video progress - To be implemented' 
    });
});

module.exports = router;

