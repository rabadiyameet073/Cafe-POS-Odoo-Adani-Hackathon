const jwt = require('jsonwebtoken');
const env = require('../config/env');
const logger = require('../utils/logger');

function generateToken(payload) {
    return jwt.sign(
        {
            user_id: payload.user_id || payload.id,
            email: payload.email,
            role: payload.role
        },
        env.JWT_SECRET,
        {
            expiresIn: env.JWT_EXPIRES_IN
        }
    );
}

function verifyToken(token) {
    try {
        return jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
        logger.debug(`Token verification failed: ${err.message}`);
        return null;
    }
}

function decodeToken(token) {
    try {
        return jwt.decode(token);
    } catch (err) {
        return null;
    }
}

function getTokenExpiration(token) {
    const decoded = decodeToken(token);
    if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
    }
    return null;
}

function isTokenExpired(token) {
    const expiration = getTokenExpiration(token);
    if (!expiration) return true;
    return expiration < new Date();
}

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
    getTokenExpiration,
    isTokenExpired
};
