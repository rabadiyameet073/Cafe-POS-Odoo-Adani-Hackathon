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

// Add file transports in production
if (env.isProduction()) {
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

module.exports = logger;
