const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Authorize specific roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Check if user owns resource or is admin
const authorizeOwnerOrAdmin = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    
    if (req.user.role === 'admin' || req.user.id == resourceUserId) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. You can only access your own resources.' });
    }
  };
};

// Check if user is student or parent of student
const authorizeStudentOrParent = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const studentId = req.params.studentId || req.body.studentId;
    
    // Admin can access any student data
    if (req.user.role === 'admin') {
      return next();
    }

    // Student can access their own data
    if (req.user.role === 'student' && req.user.id == studentId) {
      return next();
    }

    // Parent can access their child's data
    if (req.user.role === 'parent') {
      const students = await User.getStudentsByParent(req.user.id);
      const hasAccess = students.some(student => student.id == studentId);
      
      if (hasAccess) {
        return next();
      }
    }

    res.status(403).json({ message: 'Access denied. You can only access authorized student data.' });
  } catch (error) {
    res.status(500).json({ message: 'Authorization check failed', error: error.message });
  }
};

// Validate request body fields
const validateFields = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    next();
  };
};

// Validate email format
const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
  }

  next();
};

// Validate password strength
const validatePassword = (req, res, next) => {
  const { password } = req.body;
  
  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    // Add more password validation rules as needed
    // const hasUpperCase = /[A-Z]/.test(password);
    // const hasLowerCase = /[a-z]/.test(password);
    // const hasNumbers = /\d/.test(password);
    // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  next();
};

// Log API requests (development middleware)
const logRequest = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - User: ${req.user?.email || 'Anonymous'}`);
  }
  next();
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('API Error:', err);

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation error', details: err.message });
  }

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Duplicate entry - resource already exists' });
  }

  // Default error
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeOwnerOrAdmin,
  authorizeStudentOrParent,
  validateFields,
  validateEmail,
  validatePassword,
  logRequest,
  errorHandler
};

