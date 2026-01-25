const logger = require('../utils/logger');
const env = require('../config/env');
const { AppError } = require('../utils/errorHandler');

function notFoundHandler(req, res, next) {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
}

function errorHandler(err, req, res, next) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (err.statusCode >= 500) {
        logger.error('Server Error:', {
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method
        });
    } else {
        logger.warn('Client Error:', {
            message: err.message,
            path: req.path,
            method: req.method
        });
    }

    if (env.isDevelopment()) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            error: err,
            stack: err.stack
        });
    }

    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.errors && { errors: err.errors })
        });
    }

    return res.status(500).json({
        success: false,
        message: 'Something went wrong. Please try again later.'
    });
}

function handleSupabaseError(error) {
    const errorMap = {
        'PGRST116': { status: 404, message: 'Resource not found' },
        '23505': { status: 409, message: 'Resource already exists' },
        '23503': { status: 400, message: 'Invalid reference' },
        '42P01': { status: 500, message: 'Database table not found' },
        'PGRST301': { status: 401, message: 'Authentication required' }
    };

    const mapped = errorMap[error.code];
    if (mapped) {
        const appError = new AppError(mapped.message, mapped.status);
        appError.originalError = error;
        return appError;
    }

    const appError = new AppError(error.message || 'Database error', 500);
    appError.originalError = error;
    return appError;
}

module.exports = {
    notFoundHandler,
    errorHandler,
    handleSupabaseError
};
