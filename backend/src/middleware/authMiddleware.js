const { verifyToken } = require('../services/tokenService');
const { supabase } = require('../config/supabase');
const { AuthenticationError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { findUserById } = require('../config/mockUsers');

// Flag to use mock users when Supabase is unavailable
const USE_MOCK_USERS = process.env.USE_MOCK_USERS === 'true';

// Session timeout configuration (30 minutes for admin users)
const ADMIN_SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const sessionActivity = new Map(); // userId -> lastActivityTime

async function verifyTokenMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('Access token is required');
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw new AuthenticationError('Access token is required');
        }

        const decoded = verifyToken(token);

        if (!decoded) {
            throw new AuthenticationError('Invalid or expired token');
        }

        let user;
        
        // Try mock users first if enabled or if Supabase fails
        if (USE_MOCK_USERS) {
            user = findUserById(decoded.user_id);
            if (!user) {
                throw new AuthenticationError('User not found');
            }
        } else {
            // Try Supabase
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('id, email, full_name, phone, role, is_active')
                    .eq('id', decoded.user_id)
                    .single();

                if (error || !data) {
                    // Fallback to mock users
                    logger.warn('Supabase query failed, using mock users');
                    user = findUserById(decoded.user_id);
                    if (!user) {
                        throw new AuthenticationError('User not found');
                    }
                } else {
                    user = data;
                }
            } catch (err) {
                // Fallback to mock users on any error
                logger.warn('Supabase error, using mock users:', err.message);
                user = findUserById(decoded.user_id);
                if (!user) {
                    throw new AuthenticationError('User not found');
                }
            }
        }

        if (!user.is_active) {
            throw new AuthenticationError('User account is deactivated');
        }

        // Check session timeout for admin users
        if (user.role === 'admin' || user.role === 'manager') {
            const lastActivity = sessionActivity.get(user.id);
            const now = Date.now();
            
            if (lastActivity && (now - lastActivity > ADMIN_SESSION_TIMEOUT_MS)) {
                sessionActivity.delete(user.id);
                logger.warn(`Admin session timeout for user ${user.email}`);
                throw new AuthenticationError('Session expired due to inactivity');
            }
            
            // Update last activity time
            sessionActivity.set(user.id, now);
        }

        req.user = user;
        req.token = token;

        next();
    } catch (err) {
        if (err instanceof AuthenticationError) {
            return res.status(401).json({
                success: false,
                message: err.message
            });
        }

        logger.error('Authentication middleware error:', err);
        return res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
}

async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return next();
        }

        const decoded = verifyToken(token);

        if (decoded) {
            const { data: user } = await supabase
                .from('users')
                .select('id, email, full_name, phone, role, is_active')
                .eq('id', decoded.user_id)
                .single();

            if (user && user.is_active) {
                req.user = user;
                req.token = token;
            }
        }

        next();
    } catch (err) {
        next();
    }
}

/**
 * Require specific role(s) for access
 * @param {string|string[]} allowedRoles - Role or array of roles allowed
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userRole = req.user.role;
        const roles = allowedRoles.flat();

        if (!roles.includes(userRole)) {
            logger.warn(`Unauthorized access attempt by ${req.user.email} (role: ${userRole}) to ${req.path}`);
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
}

/**
 * Require admin role
 */
function requireAdmin(req, res, next) {
    return requireRole('admin', 'manager')(req, res, next);
}

/**
 * Require cashier role or higher
 */
function requireCashier(req, res, next) {
    return requireRole('admin', 'manager', 'cashier')(req, res, next);
}

/**
 * Require kitchen role or higher
 */
function requireKitchen(req, res, next) {
    return requireRole('admin', 'manager', 'kitchen')(req, res, next);
}

module.exports = {
    verifyToken: verifyTokenMiddleware,
    optionalAuth,
    requireRole,
    requireAdmin,
    requireCashier,
    requireKitchen
};
