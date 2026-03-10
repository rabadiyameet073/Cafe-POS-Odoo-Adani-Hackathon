/**
 * Security Middleware
 * 
 * Provides security-related middleware functions for the application.
 * 
 * Requirements: Security NFR 2
 */

const logger = require('../utils/logger');

/**
 * Enforce HTTPS for sensitive operations
 * In production, ensures all requests use HTTPS
 */
function enforceHTTPS(req, res, next) {
    // Skip in development/test environments
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }

    // Check if connection is secure
    const isSecure = req.secure || 
                     req.headers['x-forwarded-proto'] === 'https' ||
                     req.connection.encrypted;

    if (!isSecure) {
        logger.warn(`Insecure connection attempt to ${req.path} from ${req.ip}`);
        return res.status(403).json({
            success: false,
            message: 'HTTPS is required for this operation'
        });
    }

    next();
}

/**
 * Add security headers to responses
 */
function securityHeaders(req, res, next) {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Strict transport security (HTTPS only)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    // Content security policy
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    
    next();
}

/**
 * Rate limiting for sensitive operations
 * Simple in-memory rate limiter
 */
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window

function rateLimit(req, res, next) {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean up old entries
    for (const [key, data] of rateLimitStore.entries()) {
        if (now - data.resetTime > RATE_LIMIT_WINDOW) {
            rateLimitStore.delete(key);
        }
    }
    
    const rateLimitData = rateLimitStore.get(identifier);
    
    if (!rateLimitData || now > rateLimitData.resetTime) {
        // Reset or initialize
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW
        });
        return next();
    }
    
    if (rateLimitData.count >= RATE_LIMIT_MAX_REQUESTS) {
        const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000);
        res.set('Retry-After', retryAfter);
        return res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later',
            retry_after: retryAfter
        });
    }
    
    rateLimitData.count++;
    next();
}

module.exports = {
    enforceHTTPS,
    securityHeaders,
    rateLimit
};
