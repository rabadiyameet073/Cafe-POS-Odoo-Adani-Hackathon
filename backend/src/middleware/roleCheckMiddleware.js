const { AuthorizationError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const VALID_ROLES = ['customer', 'cashier', 'kitchen', 'admin'];

const ROLE_HIERARCHY = {
    'admin': 4,
    'cashier': 3,
    'kitchen': 2,
    'customer': 1
};

function requireRoles(...allowedRoles) {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new AuthorizationError('Authentication required');
            }

            const userRole = req.user.role;

            if (!allowedRoles.includes(userRole)) {
                logger.warn(`Access denied for user ${req.user.id} with role ${userRole}. Required: ${allowedRoles.join(', ')}`);
                throw new AuthorizationError(
                    `Access denied. Required role(s): ${allowedRoles.join(', ')}`
                );
            }

            next();
        } catch (err) {
            if (err instanceof AuthorizationError) {
                return res.status(403).json({
                    success: false,
                    message: err.message
                });
            }

            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
    };
}

function requireAdmin(req, res, next) {
    return requireRoles('admin')(req, res, next);
}

function requireStaff(req, res, next) {
    return requireRoles('admin', 'cashier')(req, res, next);
}

function requireKitchen(req, res, next) {
    return requireRoles('admin', 'kitchen')(req, res, next);
}

function requireMinimumRole(minimumRole) {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new AuthorizationError('Authentication required');
            }

            const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
            const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

            if (userLevel < requiredLevel) {
                throw new AuthorizationError(
                    `Insufficient permissions. Minimum role required: ${minimumRole}`
                );
            }

            next();
        } catch (err) {
            if (err instanceof AuthorizationError) {
                return res.status(403).json({
                    success: false,
                    message: err.message
                });
            }

            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
    };
}

function requireSelfOrAdmin(paramName = 'id') {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new AuthorizationError('Authentication required');
            }

            const targetUserId = req.params[paramName];
            const isOwnResource = req.user.id === targetUserId;
            const isAdmin = req.user.role === 'admin';

            if (!isOwnResource && !isAdmin) {
                throw new AuthorizationError('You can only access your own resources');
            }

            next();
        } catch (err) {
            if (err instanceof AuthorizationError) {
                return res.status(403).json({
                    success: false,
                    message: err.message
                });
            }

            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
    };
}

module.exports = {
    requireRoles,
    requireAdmin,
    requireStaff,
    requireKitchen,
    requireMinimumRole,
    requireSelfOrAdmin,
    VALID_ROLES,
    ROLE_HIERARCHY
};
