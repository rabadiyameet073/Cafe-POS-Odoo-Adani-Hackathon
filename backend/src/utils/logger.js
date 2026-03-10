/**
 * Winston Logger Configuration
 * 
 * Provides structured logging with different levels and transports.
 * Logs to console in development and to files in production.
 */

const winston = require('winston');
const path = require('path');
const env = require('../config/env');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ level, message, timestamp, stack }) => {
        if (stack) {
            return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
        }
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
);

// Define console format with colors
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
    })
);

// Create transports array
const transports = [
    // Console transport - always enabled
    new winston.transports.Console({
        format: consoleFormat
    })
];

// Add file transports in production (skip on Vercel — read-only filesystem)
if (env.isProduction() && !process.env.VERCEL) {
    // Logs directory
    const logsDir = path.join(process.cwd(), 'logs');

    transports.push(
        // Error log file
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: logFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Combined log file
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: logFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    );
}

// Create logger instance
const logger = winston.createLogger({
    level: env.isDevelopment() ? 'debug' : 'info',
    format: logFormat,
    transports,
    // Don't exit on errors
    exitOnError: false
});

// Add stream for Morgan HTTP logging
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    }
};

/**
 * Log API request with context
 * Requirements: 13.5, 14.5, 19.4
 */
logger.logRequest = (req, res, duration) => {
    const logData = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id,
        userEmail: req.user?.email,
        timestamp: new Date().toISOString()
    };

    const message = `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`;
    
    if (res.statusCode >= 500) {
        logger.error(message, logData);
    } else if (res.statusCode >= 400) {
        logger.warn(message, logData);
    } else {
        logger.info(message, logData);
    }
};

/**
 * Log error with full context
 * Requirements: 19.4
 */
logger.logError = (error, context = {}) => {
    const errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        statusCode: error.statusCode,
        ...context,
        timestamp: new Date().toISOString()
    };

    logger.error(`Error: ${error.message}`, errorData);
};

/**
 * Log admin action
 * Requirements: 13.5, 14.5
 */
logger.logAdminAction = (adminId, adminEmail, action, details = {}) => {
    const logData = {
        adminId,
        adminEmail,
        action,
        details,
        timestamp: new Date().toISOString()
    };

    logger.info(`Admin Action: ${action} by ${adminEmail}`, logData);
};

/**
 * Log payment transaction
 * Requirements: 19.4
 */
logger.logPayment = (paymentData) => {
    const logData = {
        paymentId: paymentData.id,
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        method: paymentData.method,
        status: paymentData.status,
        tableNumber: paymentData.tableNumber,
        cashierId: paymentData.cashierId,
        cashierName: paymentData.cashierName,
        timestamp: new Date().toISOString()
    };

    logger.info(`Payment: ${paymentData.method} ${paymentData.status} - ₹${paymentData.amount}`, logData);
};

module.exports = logger;
