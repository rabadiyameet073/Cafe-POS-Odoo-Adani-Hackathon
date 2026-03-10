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

    // Log errors based on severity
    if (err.statusCode >= 500) {
        logger.error('Server Error:', {
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            body: req.body,
            params: req.params,
            query: req.query
        });
        
        // Notify administrator for server errors (Requirement 19.4)
        if (err.name === 'DatabaseError' || err.statusCode === 500) {
            notifyAdministrator({
                type: 'server_error',
                message: err.message,
                path: req.path,
                method: req.method,
                timestamp: new Date().toISOString()
            });
        }
    } else {
        logger.warn('Client Error:', {
            message: err.message,
            path: req.path,
            method: req.method,
            statusCode: err.statusCode
        });
    }

    // Development mode - return full error details
    if (env.isDevelopment()) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            error: err,
            stack: err.stack
        });
    }

    // Production mode - return sanitized errors
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.errors && { errors: err.errors })
        });
    }

    // Unknown/unexpected errors - don't leak details
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

/**
 * Notify administrator of critical errors (Requirement 19.4)
 * In production, this would integrate with monitoring services like Sentry, DataDog, etc.
 */
async function notifyAdministrator(errorDetails) {
    try {
        // Log to console for now - in production, send to monitoring service
        logger.error('ADMIN NOTIFICATION:', errorDetails);
        
        // TODO: Integrate with monitoring service
        // - Send to Sentry/DataDog/CloudWatch
        // - Create notification in database
        // - Send email/SMS to on-call admin
        
        // For now, create a notification record in the database
        const { supabase } = require('../config/supabase');
        await supabase.from('notifications').insert({
            type: 'system_error',
            recipient_role: 'admin',
            title: 'System Error Detected',
            body: errorDetails.message,
            data: errorDetails,
            created_at: new Date().toISOString()
        });
    } catch (notifyError) {
        logger.error('Failed to notify administrator:', notifyError);
    }
}

module.exports = {
    notFoundHandler,
    errorHandler,
    handleSupabaseError,
    notifyAdministrator
};
