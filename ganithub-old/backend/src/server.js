const express = require('express');
const cors = require('cors');
const { testConnection, initializeDatabase } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'GanitHub API is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🔄 Starting GanitHub API server...');
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.log('⚠️  Database connection failed, but starting server anyway for development');
    }

    // Initialize database tables if connected
    if (dbConnected) {
      await initializeDatabase();
    }

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 GanitHub API server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      if (dbConnected) {
        console.log(`💾 Database: ${process.env.DB_NAME || 'ganithub_db'} on ${process.env.DB_HOST || 'localhost'}`);
      } else {
        console.log(`💾 Database: Not connected (check configuration)`);
      }
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

