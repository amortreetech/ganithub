const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { executeQuery, findOne, insert, update, deleteRecord } = require('../config/database');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', authMiddleware, authorize(['admin']), async (req, res) => {
    try {
        const { page = 1, limit = 10, role, search } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT id, first_name, last_name, email, role, phone, date_of_birth, created_at, updated_at FROM users';
        let countQuery = 'SELECT COUNT(*) as total FROM users';
        let queryParams = [];
        let conditions = [];

        if (role) {
            conditions.push('role = ?');
            queryParams.push(role);
        }

        if (search) {
            conditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        const [users, totalResult] = await Promise.all([
            executeQuery(query, queryParams),
            executeQuery(countQuery, queryParams.slice(0, -2))
        ]);

        const total = totalResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalUsers: total,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/users
// @desc    Create new user (Admin only)
// @access  Private/Admin
router.post('/', [
    authMiddleware,
    authorize(['admin']),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'tutor', 'student', 'parent']).withMessage('Valid role is required')
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

        const { firstName, lastName, email, password, role, phone, dateOfBirth } = req.body;

        // Check if user already exists
        const existingUser = await findOne('users', { email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const userData = {
            first_name: firstName,
            last_name: lastName,
            email,
            password: hashedPassword,
            role,
            phone: phone || null,
            date_of_birth: dateOfBirth || null
        };

        const userId = await insert('users', userData);

        // Get created user (without password)
        const newUser = await findOne('users', { id: userId }, 'id, first_name, last_name, email, role, phone, date_of_birth, created_at');

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: newUser
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const requestingUser = req.user;

        // Users can only view their own profile unless they're admin
        if (requestingUser.role !== 'admin' && requestingUser.id !== parseInt(id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const user = await findOne('users', { id }, 'id, first_name, last_name, email, role, phone, date_of_birth, created_at, updated_at');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', [
    authMiddleware,
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('role').optional().isIn(['admin', 'tutor', 'student', 'parent']).withMessage('Valid role is required')
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
        const requestingUser = req.user;
        const { firstName, lastName, email, role, phone, dateOfBirth } = req.body;

        // Users can only update their own profile unless they're admin
        // Only admins can change roles
        if (requestingUser.role !== 'admin') {
            if (requestingUser.id !== parseInt(id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            if (role && role !== requestingUser.role) {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot change your own role'
                });
            }
        }

        // Check if user exists
        const existingUser = await findOne('users', { id });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if email is already taken by another user
        if (email && email !== existingUser.email) {
            const emailExists = await findOne('users', { email });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already taken'
                });
            }
        }

        // Prepare update data
        const updateData = {};
        if (firstName) updateData.first_name = firstName;
        if (lastName) updateData.last_name = lastName;
        if (email) updateData.email = email;
        if (role && requestingUser.role === 'admin') updateData.role = role;
        if (phone !== undefined) updateData.phone = phone || null;
        if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth || null;
        updateData.updated_at = new Date();

        // Update user
        await update('users', updateData, { id });

        // Get updated user
        const updatedUser = await findOne('users', { id }, 'id, first_name, last_name, email, role, phone, date_of_birth, created_at, updated_at');

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', authMiddleware, authorize(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const user = await findOne('users', { id });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from deleting themselves
        if (req.user.id === parseInt(id)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        // Delete user
        await deleteRecord('users', { id });

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics (Admin only)
// @access  Private/Admin
router.get('/stats/overview', authMiddleware, authorize(['admin']), async (req, res) => {
    try {
        const stats = await executeQuery(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as total_students,
                SUM(CASE WHEN role = 'tutor' THEN 1 ELSE 0 END) as total_tutors,
                SUM(CASE WHEN role = 'parent' THEN 1 ELSE 0 END) as total_parents,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as total_admins,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_users_this_month
            FROM users
        `);

        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;

