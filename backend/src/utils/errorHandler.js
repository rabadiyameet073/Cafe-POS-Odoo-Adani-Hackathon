/**
 * Custom Error Classes
 * 
 * Provides custom error types for better error handling and categorization.
 */

/**
 * Base Application Error
 * All custom errors extend from this class.
 */
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = isOperational;

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation Error - 400 Bad Request
 * Used when request validation fails.
 */
class ValidationError extends AppError {
    constructor(message = 'Validation failed', errors = []) {
        super(message, 400);
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

/**
 * Authentication Error - 401 Unauthorized
 * Used when authentication fails or token is invalid.
 */
class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}

/**
 * Authorization Error - 403 Forbidden
 * Used when user doesn't have required permissions.
 */
class AuthorizationError extends AppError {
    constructor(message = 'Access denied. Insufficient permissions.') {
        super(message, 403);
        this.name = 'AuthorizationError';
    }
}

/**
 * Not Found Error - 404 Not Found
 * Used when a requested resource doesn't exist.
 */
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
        this.name = 'NotFoundError';
    }
}

/**
 * Conflict Error - 409 Conflict
 * Used when request conflicts with current state (e.g., duplicate entries).
 */
class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409);
        this.name = 'ConflictError';
    }
}

/**
 * Database Error - 500 Internal Server Error
 * Used when database operations fail.
 */
class DatabaseError extends AppError {
    constructor(message = 'Database operation failed') {
        super(message, 500);
        this.name = 'DatabaseError';
    }
}

/**
 * Service Error - 503 Service Unavailable
 * Used when external services are unavailable.
 */
class ServiceError extends AppError {
    constructor(message = 'Service temporarily unavailable') {
        super(message, 503);
        this.name = 'ServiceError';
    }
}

/**
 * Invalid Token Error - 400 Bad Request
 * Used when a table token is invalid, expired, or revoked.
 */
class InvalidTokenError extends AppError {
    constructor(message = 'Invalid or expired token') {
        super(message, 400);
        this.name = 'InvalidTokenError';
    }
}

/**
 * Invalid State Error - 400 Bad Request
 * Used when an operation is attempted on a resource in an invalid state.
 */
class InvalidStateError extends AppError {
    constructor(message = 'Operation not allowed in current state') {
        super(message, 400);
        this.name = 'InvalidStateError';
    }
}

/**
 * Payment Error - 402 Payment Required / 400 Bad Request
 * Used when payment processing fails or payment is required.
 */
class PaymentError extends AppError {
    constructor(message = 'Payment processing failed', statusCode = 400) {
        super(message, statusCode);
        this.name = 'PaymentError';
    }
}

/**
 * Handle async errors in route handlers
 * Wraps async functions to automatically catch and forward errors.
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
function catchAsync(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    DatabaseError,
    ServiceError,
    InvalidTokenError,
    InvalidStateError,
    PaymentError,
    catchAsync
};
