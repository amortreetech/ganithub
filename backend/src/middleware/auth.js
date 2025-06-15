const jwt = require('jsonwebtoken');
const { findOne } = require('../config/database');

// JWT Authentication Middleware
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No valid token provided.'
            });
        }

        // Extract token
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const userQuery = 'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = ? AND is_active = true';
        const userResult = await findOne(userQuery, [decoded.userId]);
        
        if (!userResult.success || !userResult.data) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found or inactive.'
            });
        }

        // Add user to request object
        req.user = userResult.data;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        } else {
            console.error('Auth middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error during authentication.'
            });
        }
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Authentication required.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const userQuery = 'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = ? AND is_active = true';
        const userResult = await findOne(userQuery, [decoded.userId]);
        
        if (userResult.success && userResult.data) {
            req.user = userResult.data;
        }
        
        next();
    } catch (error) {
        // Ignore errors in optional auth
        next();
    }
};

module.exports = {
    authMiddleware,
    authorize,
    optionalAuth
};

