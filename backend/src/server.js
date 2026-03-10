/**
 * Cafe POS Backend - Server Entry Point
 * 
 * This file initializes the HTTP server with Socket.IO support.
 * It imports the Express app from app.js and starts listening on the configured port.
 */

const http = require('http');
const app = require('./app');
const { initializeSocketIO } = require('./sockets');
const BackgroundJobManager = require('./jobs/BackgroundJobManager');
const AlertingService = require('./services/AlertingService');
const logger = require('./utils/logger');
const env = require('./config/env');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocketIO(server);

// Make io accessible throughout the app
app.set('io', io);

// Get port from environment
const PORT = env.PORT || 3000;

// Start server
server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📡 Environment: ${env.NODE_ENV}`);
    logger.info(`🔗 API Base URL: http://localhost:${PORT}/api`);
    
    // Start background jobs after server is running
    BackgroundJobManager.start();
    
    // Start alerting service
    AlertingService.start();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    
    // Stop background jobs and alerting
    BackgroundJobManager.stop();
    AlertingService.stop();
    
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Stack Trace:', err.stack);
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    logger.error(err.stack);
    
    // Stop background jobs and alerting
    BackgroundJobManager.stop();
    AlertingService.stop();
    
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
    
    // Stop background jobs and alerting
    BackgroundJobManager.stop();
    AlertingService.stop();
    
    server.close(() => {
        logger.info('💤 Process terminated!');
    });
});

module.exports = server;
