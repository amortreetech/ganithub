const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ganithub',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Execute query with error handling
const executeQuery = async (query, params = []) => {
    try {
        const [results] = await pool.execute(query, params);
        return { success: true, data: results };
    } catch (error) {
        console.error('Database query error:', error.message);
        return { success: false, error: error.message };
    }
};

// Get a single record
const findOne = async (query, params = []) => {
    try {
        const [results] = await pool.execute(query, params);
        return { success: true, data: results[0] || null };
    } catch (error) {
        console.error('Database findOne error:', error.message);
        return { success: false, error: error.message };
    }
};

// Insert record and return inserted ID
const insert = async (query, params = []) => {
    try {
        const [results] = await pool.execute(query, params);
        return { success: true, insertId: results.insertId, affectedRows: results.affectedRows };
    } catch (error) {
        console.error('Database insert error:', error.message);
        return { success: false, error: error.message };
    }
};

// Update records
const update = async (query, params = []) => {
    try {
        const [results] = await pool.execute(query, params);
        return { success: true, affectedRows: results.affectedRows };
    } catch (error) {
        console.error('Database update error:', error.message);
        return { success: false, error: error.message };
    }
};

// Delete records
const deleteRecord = async (query, params = []) => {
    try {
        const [results] = await pool.execute(query, params);
        return { success: true, affectedRows: results.affectedRows };
    } catch (error) {
        console.error('Database delete error:', error.message);
        return { success: false, error: error.message };
    }
};

// Initialize database (create tables if they don't exist)
const initializeDatabase = async () => {
    try {
        // First, create database if it doesn't exist
        const createDbQuery = `CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`;
        await pool.execute(createDbQuery);
        
        console.log('✅ Database initialization completed');
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        return false;
    }
};

module.exports = {
    pool,
    testConnection,
    executeQuery,
    findOne,
    insert,
    update,
    deleteRecord,
    initializeDatabase
};

