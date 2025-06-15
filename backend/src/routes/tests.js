const express = require('express');
const { body, validationResult } = require('express-validator');
const { executeQuery, findOne, insert, update, deleteRecord } = require('../config/database');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/tests
// @desc    Get all tests
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, difficulty, age_group, subject } = req.query;
        const offset = (page - 1) * limit;
        const user = req.user;
        
        let query = `
            SELECT t.*, 
                   u.first_name as created_by_first_name, 
                   u.last_name as created_by_last_name,
                   COUNT(tq.id) as question_count
            FROM tests t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN test_questions tq ON t.id = tq.test_id
        `;
        
        let countQuery = 'SELECT COUNT(*) as total FROM tests t';
        let queryParams = [];
        let conditions = [];

        // Role-based filtering
        if (user.role === 'tutor') {
            conditions.push('t.created_by = ?');
            queryParams.push(user.id);
        } else if (user.role === 'student') {
            conditions.push('t.status = ?');
            queryParams.push('published');
        }

        if (difficulty) {
            conditions.push('t.difficulty = ?');
            queryParams.push(difficulty);
        }

        if (age_group) {
            conditions.push('t.age_group = ?');
            queryParams.push(age_group);
        }

        if (subject) {
            conditions.push('t.subject = ?');
            queryParams.push(subject);
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        query += ' GROUP BY t.id ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        const [tests, totalResult] = await Promise.all([
            executeQuery(query, queryParams),
            executeQuery(countQuery, queryParams.slice(0, -2))
        ]);

        // For students, add attempt information
        if (user.role === 'student') {
            for (let test of tests) {
                const attempts = await executeQuery(`
                    SELECT COUNT(*) as attempt_count, MAX(score) as best_score
                    FROM test_attempts 
                    WHERE test_id = ? AND student_id = ?
                `, [test.id, user.id]);
                
                test.attempt_count = attempts[0].attempt_count;
                test.best_score = attempts[0].best_score;
            }
        }

        const total = totalResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                tests,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalTests: total,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get tests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/tests
// @desc    Create new test
// @access  Private (Admin/Tutor)
router.post('/', [
    authMiddleware,
    authorize(['admin', 'tutor']),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Difficulty must be easy, medium, or hard'),
    body('ageGroup').trim().notEmpty().withMessage('Age group is required'),
    body('timeLimit').isInt({ min: 1 }).withMessage('Time limit must be a positive integer'),
    body('passingScore').isInt({ min: 0, max: 100 }).withMessage('Passing score must be between 0 and 100'),
    body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
    body('questions.*.question').trim().notEmpty().withMessage('Question text is required'),
    body('questions.*.options').isArray({ min: 2 }).withMessage('At least 2 options are required'),
    body('questions.*.correctAnswer').isInt({ min: 0 }).withMessage('Correct answer index is required'),
    body('questions.*.points').isInt({ min: 1 }).withMessage('Points must be a positive integer')
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
            subject, 
            difficulty, 
            ageGroup, 
            timeLimit, 
            passingScore,
            questions,
            status = 'draft'
        } = req.body;

        // Calculate total points
        const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

        const testData = {
            title,
            description,
            subject,
            difficulty,
            age_group: ageGroup,
            time_limit: timeLimit,
            passing_score: passingScore,
            total_points: totalPoints,
            status,
            created_by: user.id
        };

        const testId = await insert('tests', testData);

        // Insert questions
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            await insert('test_questions', {
                test_id: testId,
                question: question.question,
                options: JSON.stringify(question.options),
                correct_answer: question.correctAnswer,
                points: question.points,
                order_index: i + 1
            });
        }

        // Get created test with questions
        const newTest = await executeQuery(`
            SELECT t.*, 
                   u.first_name as created_by_first_name, 
                   u.last_name as created_by_last_name
            FROM tests t
            LEFT JOIN users u ON t.created_by = u.id
            WHERE t.id = ?
        `, [testId]);

        const testQuestions = await executeQuery(`
            SELECT id, question, options, correct_answer, points, order_index
            FROM test_questions
            WHERE test_id = ?
            ORDER BY order_index
        `, [testId]);

        newTest[0].questions = testQuestions.map(q => ({
            ...q,
            options: JSON.parse(q.options)
        }));

        res.status(201).json({
            success: true,
            message: 'Test created successfully',
            data: newTest[0]
        });
    } catch (error) {
        console.error('Create test error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/tests/:id
// @desc    Get test by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const test = await executeQuery(`
            SELECT t.*, 
                   u.first_name as created_by_first_name, 
                   u.last_name as created_by_last_name
            FROM tests t
            LEFT JOIN users u ON t.created_by = u.id
            WHERE t.id = ?
        `, [id]);

        if (!test.length) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        const testData = test[0];

        // Check access permissions
        if (user.role === 'student' && testData.status !== 'published') {
            return res.status(403).json({
                success: false,
                message: 'Test not available'
            });
        }

        if (user.role === 'tutor' && testData.created_by !== user.id && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get questions
        const questions = await executeQuery(`
            SELECT id, question, options, ${user.role !== 'student' ? 'correct_answer,' : ''} points, order_index
            FROM test_questions
            WHERE test_id = ?
            ORDER BY order_index
        `, [id]);

        testData.questions = questions.map(q => ({
            ...q,
            options: JSON.parse(q.options)
        }));

        // For students, add attempt information
        if (user.role === 'student') {
            const attempts = await executeQuery(`
                SELECT id, score, completed_at, time_taken
                FROM test_attempts 
                WHERE test_id = ? AND student_id = ?
                ORDER BY completed_at DESC
            `, [id, user.id]);
            
            testData.attempts = attempts;
            testData.attempt_count = attempts.length;
            testData.best_score = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null;
        }

        res.json({
            success: true,
            data: testData
        });
    } catch (error) {
        console.error('Get test error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/tests/:id/attempt
// @desc    Submit test attempt
// @access  Private (Student)
router.post('/:id/attempt', [
    authMiddleware,
    authorize(['student']),
    body('answers').isArray().withMessage('Answers array is required'),
    body('timeSpent').isInt({ min: 1 }).withMessage('Time spent must be a positive integer')
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
        const { answers, timeSpent } = req.body;
        const studentId = req.user.id;

        // Get test
        const test = await findOne('tests', { id });
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        if (test.status !== 'published') {
            return res.status(400).json({
                success: false,
                message: 'Test is not available'
            });
        }

        // Get questions with correct answers
        const questions = await executeQuery(`
            SELECT id, correct_answer, points, order_index
            FROM test_questions
            WHERE test_id = ?
            ORDER BY order_index
        `, [id]);

        // Calculate score
        let totalScore = 0;
        let correctAnswers = 0;
        const results = [];

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const studentAnswer = answers[i];
            const isCorrect = studentAnswer === question.correct_answer;
            
            if (isCorrect) {
                totalScore += question.points;
                correctAnswers++;
            }

            results.push({
                questionId: question.id,
                studentAnswer,
                correctAnswer: question.correct_answer,
                isCorrect,
                points: isCorrect ? question.points : 0
            });
        }

        const scorePercentage = Math.round((totalScore / test.total_points) * 100);
        const passed = scorePercentage >= test.passing_score;

        // Save attempt
        const attemptId = await insert('test_attempts', {
            test_id: id,
            student_id: studentId,
            answers: JSON.stringify(answers),
            score: scorePercentage,
            total_questions: questions.length,
            correct_answers: correctAnswers,
            time_taken: timeSpent,
            passed,
            completed_at: new Date()
        });

        // Award coins for completion
        const coinsEarned = passed ? 20 : 10; // More coins for passing
        await insert('coin_transactions', {
            user_id: studentId,
            amount: coinsEarned,
            type: 'earned',
            description: `Test completion: ${test.title}`,
            reference_type: 'test_attempt',
            reference_id: attemptId
        });

        // Update user's total coins
        await executeQuery(`
            INSERT INTO user_coins (user_id, total_coins) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE total_coins = total_coins + ?
        `, [studentId, coinsEarned, coinsEarned]);

        res.json({
            success: true,
            message: 'Test submitted successfully',
            data: {
                attemptId,
                score: scorePercentage,
                totalQuestions: questions.length,
                correctAnswers,
                passed,
                coinsEarned,
                results
            }
        });
    } catch (error) {
        console.error('Submit test attempt error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/tests/:id/attempts
// @desc    Get test attempts
// @access  Private (Admin/Tutor - own tests)
router.get('/:id/attempts', authMiddleware, authorize(['admin', 'tutor']), async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const user = req.user;

        // Check if test exists and user has access
        const test = await findOne('tests', { id });
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        if (user.role === 'tutor' && test.created_by !== user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const attempts = await executeQuery(`
            SELECT ta.*, 
                   u.first_name, u.last_name, u.email
            FROM test_attempts ta
            JOIN users u ON ta.student_id = u.id
            WHERE ta.test_id = ?
            ORDER BY ta.completed_at DESC
            LIMIT ? OFFSET ?
        `, [id, parseInt(limit), parseInt(offset)]);

        const totalResult = await executeQuery(
            'SELECT COUNT(*) as total FROM test_attempts WHERE test_id = ?', 
            [id]
        );

        const total = totalResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                attempts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalAttempts: total,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get test attempts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/tests/:id
// @desc    Update test
// @access  Private (Admin/Tutor - own tests)
router.put('/:id', [
    authMiddleware,
    authorize(['admin', 'tutor']),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Difficulty must be easy, medium, or hard'),
    body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status')
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

        // Check if test exists
        const existingTest = await findOne('tests', { id });
        if (!existingTest) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        // Check permissions
        if (user.role === 'tutor' && existingTest.created_by !== user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const { 
            title, 
            description, 
            subject, 
            difficulty, 
            ageGroup, 
            timeLimit, 
            passingScore,
            status 
        } = req.body;

        // Prepare update data
        const updateData = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (subject) updateData.subject = subject;
        if (difficulty) updateData.difficulty = difficulty;
        if (ageGroup) updateData.age_group = ageGroup;
        if (timeLimit) updateData.time_limit = timeLimit;
        if (passingScore !== undefined) updateData.passing_score = passingScore;
        if (status) updateData.status = status;
        updateData.updated_at = new Date();

        // Update test
        await update('tests', updateData, { id });

        // Get updated test
        const updatedTest = await executeQuery(`
            SELECT t.*, 
                   u.first_name as created_by_first_name, 
                   u.last_name as created_by_last_name,
                   COUNT(tq.id) as question_count
            FROM tests t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN test_questions tq ON t.id = tq.test_id
            WHERE t.id = ?
            GROUP BY t.id
        `, [id]);

        res.json({
            success: true,
            message: 'Test updated successfully',
            data: updatedTest[0]
        });
    } catch (error) {
        console.error('Update test error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/tests/:id
// @desc    Delete test
// @access  Private (Admin/Tutor - own tests)
router.delete('/:id', authMiddleware, authorize(['admin', 'tutor']), async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // Check if test exists
        const existingTest = await findOne('tests', { id });
        if (!existingTest) {
            return res.status(404).json({
                success: false,
                message: 'Test not found'
            });
        }

        // Check permissions
        if (user.role === 'tutor' && existingTest.created_by !== user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Delete test attempts first
        await executeQuery('DELETE FROM test_attempts WHERE test_id = ?', [id]);
        
        // Delete test questions
        await executeQuery('DELETE FROM test_questions WHERE test_id = ?', [id]);
        
        // Delete test
        await deleteRecord('tests', { id });

        res.json({
            success: true,
            message: 'Test deleted successfully'
        });
    } catch (error) {
        console.error('Delete test error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;

