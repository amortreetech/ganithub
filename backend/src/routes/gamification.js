const express = require('express');
const { executeQuery, findOne, insert, update, deleteRecord } = require('../config/database');

const router = express.Router();

// @route   GET /api/gamification/coins/user/:userId
// @desc    Get user coins
// @access  Private
router.get('/coins/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user coins
        const userCoins = await findOne('user_coins', { user_id: userId });
        const totalCoins = userCoins ? userCoins.total_coins : 0;

        // Get recent transactions
        const transactions = await executeQuery(`
            SELECT * FROM coin_transactions 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 10
        `, [userId]);

        res.json({
            success: true,
            data: {
                totalCoins,
                transactions
            }
        });
    } catch (error) {
        console.error('Get user coins error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/gamification/badges/user/:userId
// @desc    Get user badges
// @access  Private
router.get('/badges/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user badges
        const userBadges = await executeQuery(`
            SELECT ub.*, b.name, b.description, b.icon, b.color
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.id
            WHERE ub.user_id = ?
            ORDER BY ub.earned_at DESC
        `, [userId]);

        // Get all available badges
        const allBadges = await executeQuery('SELECT * FROM badges ORDER BY name');

        // Mark which badges are earned
        const badgesWithStatus = allBadges.map(badge => {
            const earned = userBadges.find(ub => ub.badge_id === badge.id);
            return {
                ...badge,
                earned: !!earned,
                earnedAt: earned ? earned.earned_at : null
            };
        });

        res.json({
            success: true,
            data: {
                earnedBadges: userBadges,
                allBadges: badgesWithStatus,
                totalEarned: userBadges.length
            }
        });
    } catch (error) {
        console.error('Get user badges error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/gamification/leaderboard
// @desc    Get leaderboard
// @access  Private
router.get('/leaderboard', async (req, res) => {
    try {
        const { type = 'coins', period = 'all', limit = 10 } = req.query;

        let query;
        let params = [parseInt(limit)];

        if (type === 'coins') {
            query = `
                SELECT u.id, u.first_name, u.last_name, 
                       COALESCE(uc.total_coins, 0) as total_coins
                FROM users u
                LEFT JOIN user_coins uc ON u.id = uc.user_id
                WHERE u.role = 'student'
                ORDER BY total_coins DESC
                LIMIT ?
            `;
        } else if (type === 'tests') {
            query = `
                SELECT u.id, u.first_name, u.last_name, 
                       COUNT(ta.id) as tests_completed,
                       AVG(ta.score) as average_score
                FROM users u
                LEFT JOIN test_attempts ta ON u.id = ta.student_id
                WHERE u.role = 'student'
                GROUP BY u.id
                ORDER BY tests_completed DESC, average_score DESC
                LIMIT ?
            `;
        } else if (type === 'attendance') {
            query = `
                SELECT u.id, u.first_name, u.last_name, 
                       COUNT(a.id) as classes_attended
                FROM users u
                LEFT JOIN attendance a ON u.id = a.student_id AND a.status = 'present'
                WHERE u.role = 'student'
                GROUP BY u.id
                ORDER BY classes_attended DESC
                LIMIT ?
            `;
        }

        const leaderboard = await executeQuery(query, params);

        // Add rank to each entry
        const rankedLeaderboard = leaderboard.map((entry, index) => ({
            ...entry,
            rank: index + 1
        }));

        res.json({
            success: true,
            data: {
                leaderboard: rankedLeaderboard,
                type,
                period
            }
        });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/gamification/award-coins
// @desc    Award coins to user (Admin/System)
// @access  Private (Admin)
router.post('/award-coins', async (req, res) => {
    try {
        const { userId, amount, description, referenceType, referenceId } = req.body;

        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid user ID and positive amount are required'
            });
        }

        // Check if user exists
        const user = await findOne('users', { id: userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Create transaction
        await insert('coin_transactions', {
            user_id: userId,
            amount,
            type: 'earned',
            description: description || 'Manual award',
            reference_type: referenceType || null,
            reference_id: referenceId || null
        });

        // Update user's total coins
        await executeQuery(`
            INSERT INTO user_coins (user_id, total_coins) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE total_coins = total_coins + ?
        `, [userId, amount, amount]);

        // Get updated total
        const updatedCoins = await findOne('user_coins', { user_id: userId });

        res.json({
            success: true,
            message: 'Coins awarded successfully',
            data: {
                coinsAwarded: amount,
                totalCoins: updatedCoins.total_coins
            }
        });
    } catch (error) {
        console.error('Award coins error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;

