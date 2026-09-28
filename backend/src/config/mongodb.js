/**
 * MongoDB Database Connection Configuration
 * 
 * Manages connection to MongoDB (local or MongoDB Atlas) using Mongoose.
 */

const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

let connectionPromise = null;

/**
 * Connect to MongoDB with serverless connection pooling
 */
async function connectMongoDB() {
    if (mongoose.connection.readyState === 1) return mongoose.connection;
    if (mongoose.connection.readyState === 2 && connectionPromise) return connectionPromise;

    const uri = env.MONGODB_URI || 'mongodb://localhost:27017/cafe_pos';
    
    // Mask credentials for logging
    const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    logger.info(`Connecting to MongoDB at: ${maskedUri}`);

    connectionPromise = mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    }).then(() => {
        isConnected = true;
        logger.info('✅ Successfully connected to MongoDB');
        return mongoose.connection;
    }).catch(err => {
        logger.error('❌ Failed to connect to MongoDB:', err.message);
        isConnected = false;
        connectionPromise = null;
        return null;
    });

    return connectionPromise;
}

/**
 * Test MongoDB connection status
 */
async function testConnection() {
    try {
        if (!isConnected || mongoose.connection.readyState !== 1) {
            await connectMongoDB();
        }
        return mongoose.connection.readyState === 1;
    } catch (err) {
        logger.error('MongoDB connection test failed:', err.message);
        return false;
    }
}

function getConnectionStatus() {
    return mongoose.connection.readyState === 1;
}

function getDb() {
    return mongoose.connection.db;
}

module.exports = {
    mongoose,
    connectMongoDB,
    testConnection,
    getConnectionStatus,
    getDb
};
