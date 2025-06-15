const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery, findOne, insert, update, deleteRecord } = require('../config/database');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/classes
// @desc    Get all classes
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, type, status, tutor_id } = req.query;
        const offset = (page - 1) * limit;
        const user = req.user;
        
        let query = `
            SELECT c.*, 
                   u.first_name as tutor_first_name, 
                   u.last_name as tutor_last_name,
                   COUNT(ce.student_id) as enrolled_students
            FROM classes c
            LEFT JOIN users u ON c.tutor_id = u.id
            LEFT JOIN class_enrollments ce ON c.id = ce.class_id
        `;
        
        let countQuery = 'SELECT COUNT(*) as total FROM classes c';
        let queryParams = [];
        let conditions = [];

        // Role-based filtering
        if (user.role === 'tutor') {
            conditions.push('c.tutor_id = ?');
            queryParams.push(user.id);
        } else if (user.role === 'student') {
            // Students see only classes they're enrolled in or can enroll in
            query = `
                SELECT c.*, 
                       u.first_name as tutor_first_name, 
                       u.last_name as tutor_last_name,
                       COUNT(ce.student_id) as enrolled_students,
                       CASE WHEN ce2.student_id IS NOT NULL THEN 1 ELSE 0 END as is_enrolled
                FROM classes c
                LEFT JOIN users u ON c.tutor_id = u.id
                LEFT JOIN class_enrollments ce ON c.id = ce.class_id
                LEFT JOIN class_enrollments ce2 ON c.id = ce2.class_id AND ce2.student_id = ?
            `;
            queryParams.push(user.id);
        }

        if (type) {
            conditions.push('c.type = ?');
            queryParams.push(type);
        }

        if (status) {
            conditions.push('c.status = ?');
            queryParams.push(status);
        }

        if (tutor_id && user.role === 'admin') {
            conditions.push('c.tutor_id = ?');
            queryParams.push(tutor_id);
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        query += ' GROUP BY c.id ORDER BY c.scheduled_at DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        const [classes, totalResult] = await Promise.all([
            executeQuery(query, queryParams),
            executeQuery(countQuery, queryParams.slice(0, -2))
        ]);

        const total = totalResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                classes,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalClasses: total,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/classes
// @desc    Create new class
// @access  Private (Admin/Tutor)
router.post('/', [
    authMiddleware,
    authorize(['admin', 'tutor']),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('type').isIn(['live', 'recorded']).withMessage('Type must be live or recorded'),
    body('scheduledAt').isISO8601().withMessage('Valid scheduled date is required'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
    body('maxStudents').optional().isInt({ min: 1 }).withMessage('Max students must be a positive integer'),
    body('ageGroup').optional().trim().notEmpty().withMessage('Age group cannot be empty'),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Difficulty must be easy, medium, or hard')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const user = req.user;
        const { 
            title, 
            description, 
            type, 
            scheduledAt, 
            duration, 
            maxStudents, 
            ageGroup, 
            difficulty,
            meetingUrl,
            recordingUrl 
        } = req.body;

        // Set tutor_id based on user role
        const tutorId = user.role === 'admin' ? req.body.tutorId || user.id : user.id;

        const classData = {
            title,
            description,
            type,
            tutor_id: tutorId,
            scheduled_at: new Date(scheduledAt),
            duration,
            max_students: maxStudents || 20,
            age_group: ageGroup || 'all',
            difficulty: difficulty || 'medium',
            meeting_url: meetingUrl || null,
            recording_url: recordingUrl || null,
            status: 'scheduled'
        };

        const classId = await insert('classes', classData);

        // Get created class with tutor info
        const newClass = await executeQuery(`
            SELECT c.*, 
                   u.first_name as tutor_first_name, 
                   u.last_name as tutor_last_name
            FROM classes c
            LEFT JOIN users u ON c.tutor_id = u.id
            WHERE c.id = ?
        `, [classId]);

        res.status(201).json({
            success: true,
            message: 'Class created successfully',
            data: newClass[0]
        });
    } catch (error) {
        console.error('Create class error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/classes/:id
// @desc    Get class by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const classData = await executeQuery(`
            SELECT c.*, 
                   u.first_name as tutor_first_name, 
                   u.last_name as tutor_last_name,
                   COUNT(ce.student_id) as enrolled_students
            FROM classes c
            LEFT JOIN users u ON c.tutor_id = u.id
            LEFT JOIN class_enrollments ce ON c.id = ce.class_id
            WHERE c.id = ?
            GROUP BY c.id
        `, [id]);

        if (!classData.length) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        const classInfo = classData[0];

        // Check if student is enrolled
        if (user.role === 'student') {
            const enrollment = await findOne('class_enrollments', { 
                class_id: id, 
                student_id: user.id 
            });
            classInfo.is_enrolled = !!enrollment;
        }

        // Get enrolled students (for tutor/admin)
        if (user.role === 'tutor' || user.role === 'admin') {
            const students = await executeQuery(`
                SELECT u.id, u.first_name, u.last_name, u.email, ce.enrolled_at
                FROM class_enrollments ce
                JOIN users u ON ce.student_id = u.id
                WHERE ce.class_id = ?
                ORDER BY ce.enrolled_at DESC
            `, [id]);
            classInfo.students = students;
        }

        res.json({
            success: true,
            data: classInfo
        });
    } catch (error) {
        console.error('Get class error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/classes/:id
// @desc    Update class
// @access  Private (Admin/Tutor - own classes)
router.put('/:id', [
    authMiddleware,
    authorize(['admin', 'tutor']),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
    body('type').optional().isIn(['live', 'recorded']).withMessage('Type must be live or recorded'),
    body('scheduledAt').optional().isISO8601().withMessage('Valid scheduled date is required'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
    body('maxStudents').optional().isInt({ min: 1 }).withMessage('Max students must be a positive integer'),
    body('status').optional().isIn(['scheduled', 'ongoing', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const user = req.user;

        // Check if class exists
        const existingClass = await findOne('classes', { id });
        if (!existingClass) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Check permissions
        if (user.role === 'tutor' && existingClass.tutor_id !== user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const { 
            title, 
            description, 
            type, 
            scheduledAt, 
            duration, 
            maxStudents, 
            ageGroup, 
            difficulty,
            meetingUrl,
            recordingUrl,
            status 
        } = req.body;

        // Prepare update data
        const updateData = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (type) updateData.type = type;
        if (scheduledAt) updateData.scheduled_at = new Date(scheduledAt);
        if (duration) updateData.duration = duration;
        if (maxStudents) updateData.max_students = maxStudents;
        if (ageGroup) updateData.age_group = ageGroup;
        if (difficulty) updateData.difficulty = difficulty;
        if (meetingUrl !== undefined) updateData.meeting_url = meetingUrl;
        if (recordingUrl !== undefined) updateData.recording_url = recordingUrl;
        if (status) updateData.status = status;
        updateData.updated_at = new Date();

        // Update class
        await update('classes', updateData, { id });

        // Get updated class
        const updatedClass = await executeQuery(`
            SELECT c.*, 
                   u.first_name as tutor_first_name, 
                   u.last_name as tutor_last_name,
                   COUNT(ce.student_id) as enrolled_students
            FROM classes c
            LEFT JOIN users u ON c.tutor_id = u.id
            LEFT JOIN class_enrollments ce ON c.id = ce.class_id
            WHERE c.id = ?
            GROUP BY c.id
        `, [id]);

        res.json({
            success: true,
            message: 'Class updated successfully',
            data: updatedClass[0]
        });
    } catch (error) {
        console.error('Update class error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/classes/:id
// @desc    Delete class
// @access  Private (Admin/Tutor - own classes)
router.delete('/:id', authMiddleware, authorize(['admin', 'tutor']), async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // Check if class exists
        const existingClass = await findOne('classes', { id });
        if (!existingClass) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Check permissions
        if (user.role === 'tutor' && existingClass.tutor_id !== user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Delete class enrollments first
        await executeQuery('DELETE FROM class_enrollments WHERE class_id = ?', [id]);
        
        // Delete class
        await deleteRecord('classes', { id });

        res.json({
            success: true,
            message: 'Class deleted successfully'
        });
    } catch (error) {
        console.error('Delete class error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/classes/:id/enroll
// @desc    Enroll in class
// @access  Private (Student)
router.post('/:id/enroll', authMiddleware, authorize(['student']), async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user.id;

        // Check if class exists
        const classData = await findOne('classes', { id });
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Check if class is available for enrollment
        if (classData.status !== 'scheduled') {
            return res.status(400).json({
                success: false,
                message: 'Class is not available for enrollment'
            });
        }

        // Check if already enrolled
        const existingEnrollment = await findOne('class_enrollments', { 
            class_id: id, 
            student_id: studentId 
        });
        
        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                message: 'Already enrolled in this class'
            });
        }

        // Check if class is full
        const enrollmentCount = await executeQuery(
            'SELECT COUNT(*) as count FROM class_enrollments WHERE class_id = ?', 
            [id]
        );
        
        if (enrollmentCount[0].count >= classData.max_students) {
            return res.status(400).json({
                success: false,
                message: 'Class is full'
            });
        }

        // Enroll student
        await insert('class_enrollments', {
            class_id: id,
            student_id: studentId,
            enrolled_at: new Date()
        });

        res.json({
            success: true,
            message: 'Successfully enrolled in class'
        });
    } catch (error) {
        console.error('Enroll in class error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/classes/:id/enroll
// @desc    Unenroll from class
// @access  Private (Student)
router.delete('/:id/enroll', authMiddleware, authorize(['student']), async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user.id;

        // Check if enrolled
        const enrollment = await findOne('class_enrollments', { 
            class_id: id, 
            student_id: studentId 
        });
        
        if (!enrollment) {
            return res.status(400).json({
                success: false,
                message: 'Not enrolled in this class'
            });
        }

        // Unenroll student
        await deleteRecord('class_enrollments', { 
            class_id: id, 
            student_id: studentId 
        });

        res.json({
            success: true,
            message: 'Successfully unenrolled from class'
        });
    } catch (error) {
        console.error('Unenroll from class error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/classes/:id/join
// @desc    Join live class
// @access  Private (Student - enrolled only)
router.post('/:id/join', authMiddleware, authorize(['student']), async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user.id;

        // Check if enrolled
        const enrollment = await findOne('class_enrollments', { 
            class_id: id, 
            student_id: studentId 
        });
        
        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'Must be enrolled to join class'
            });
        }

        // Get class info
        const classData = await findOne('classes', { id });
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        if (classData.type !== 'live') {
            return res.status(400).json({
                success: false,
                message: 'This is not a live class'
            });
        }

        // Record attendance
        const existingAttendance = await findOne('attendance', {
            class_id: id,
            student_id: studentId
        });

        if (!existingAttendance) {
            await insert('attendance', {
                class_id: id,
                student_id: studentId,
                joined_at: new Date(),
                status: 'present'
            });
        }

        res.json({
            success: true,
            message: 'Joined class successfully',
            data: {
                meetingUrl: classData.meeting_url,
                classTitle: classData.title
            }
        });
    } catch (error) {
        console.error('Join class error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;

