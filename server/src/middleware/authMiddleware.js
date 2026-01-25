const { verifyToken } = require('../services/tokenService');
const { supabase } = require('../config/supabase');
const { AuthenticationError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

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

        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, full_name, phone, role, is_active')
            .eq('id', decoded.user_id)
            .single();

        if (error || !user) {
            throw new AuthenticationError('User not found');
        }

        if (!user.is_active) {
            throw new AuthenticationError('User account is deactivated');
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

module.exports = {
    verifyToken: verifyTokenMiddleware,
    optionalAuth
};
