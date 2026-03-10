/**
 * TableTokenService
 * 
 * Manages table tokens for customer sessions.
 * Token format: "TBL" + 8 alphanumeric characters (e.g., TBL4A7K9M2X)
 * 
 * Security features:
 * - Token signature verification to prevent forgery
 * - Token expiration checks
 * - Rate limiting for token generation
 * 
 * Requirements: 2.1, 22.1, 22.2, Security NFR 1
 */

const crypto = require('crypto');
const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

// Secret key for token signing (should be in environment variables)
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'default-secret-key-change-in-production';

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_TOKENS_PER_WINDOW = 10; // Max 10 tokens per minute per IP
const rateLimitMap = new Map(); // Map of IP -> {count, resetTime}

class TableTokenService {
    /**
     * Generate HMAC signature for a token
     * @param {string} token - Token to sign
     * @param {string} timestamp - ISO timestamp
     * @returns {string} HMAC signature (hex)
     */
    generateTokenSignature(token, timestamp) {
        const data = `${token}:${timestamp}`;
        return crypto.createHmac('sha256', TOKEN_SECRET)
            .update(data)
            .digest('hex')
            .substring(0, 8); // Use first 8 chars for brevity
    }

    /**
     * Verify token signature
     * @param {string} token - Token to verify
     * @param {string} timestamp - ISO timestamp
     * @param {string} signature - Signature to verify
     * @returns {boolean} True if signature is valid
     */
    verifyTokenSignatureHash(token, timestamp, signature) {
        const expectedSignature = this.generateTokenSignature(token, timestamp);
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    }

    /**
     * Check rate limit for token generation
     * @param {string} identifier - IP address or user identifier
     * @returns {Object} Rate limit status
     */
    checkRateLimit(identifier) {
        const now = Date.now();
        const rateLimitData = rateLimitMap.get(identifier);

        if (!rateLimitData || now > rateLimitData.resetTime) {
            // Reset or initialize rate limit
            rateLimitMap.set(identifier, {
                count: 1,
                resetTime: now + RATE_LIMIT_WINDOW_MS
            });
            return { allowed: true, remaining: MAX_TOKENS_PER_WINDOW - 1 };
        }

        if (rateLimitData.count >= MAX_TOKENS_PER_WINDOW) {
            const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000);
            return { 
                allowed: false, 
                remaining: 0,
                retryAfter: retryAfter
            };
        }

        rateLimitData.count++;
        return { 
            allowed: true, 
            remaining: MAX_TOKENS_PER_WINDOW - rateLimitData.count 
        };
    }

    /**
     * Generate a unique table token
     * Format: TBL + 8 alphanumeric chars (uppercase)
     * @returns {string} Generated token (e.g., "TBL4A7K9M2X")
     */
    generateTableToken() {
        const prefix = 'TBL';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let token = prefix;
        
        for (let i = 0; i < 8; i++) {
            const randomIndex = crypto.randomInt(0, chars.length);
            token += chars.charAt(randomIndex);
        }
        
        return token;
    }

    /**
     * Parse a table token string into its components
     * @param {string} tokenString - Token to parse (e.g., "TBL4A7K9M2X")
     * @returns {Object|null} Parsed token object or null if invalid
     * @returns {string} return.prefix - Token prefix ("TBL")
     * @returns {string} return.identifier - 8-character identifier
     * @returns {string} return.fullToken - Complete token string
     */
    parseToken(tokenString) {
        if (!tokenString || typeof tokenString !== 'string') {
            return null;
        }

        // Validate format: TBL + 8 alphanumeric chars
        const tokenRegex = /^TBL[A-Z0-9]{8}$/;
        if (!tokenRegex.test(tokenString)) {
            logger.debug(`Invalid token format: ${tokenString}`);
            return null;
        }

        return {
            prefix: tokenString.substring(0, 3),
            identifier: tokenString.substring(3),
            fullToken: tokenString
        };
    }

    /**
     * Validate token signature and format
     * @param {string} token - Token to validate
     * @returns {boolean} True if token format is valid
     */
    validateTokenSignature(token) {
        const parsed = this.parseToken(token);
        return parsed !== null;
    }

    /**
     * Revoke a table token (mark as invalid in database)
     * @param {string} token - Token to revoke
     * @returns {Promise<Object>} Result object
     */
    async revokeToken(token) {
        try {
            if (!this.validateTokenSignature(token)) {
                return {
                    success: false,
                    error: 'Invalid token format'
                };
            }

            // Update table_sessions to mark as expired
            const { data, error } = await supabase
                .from('table_sessions')
                .update({
                    status: 'expired',
                    session_end: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('table_token', token)
                .eq('status', 'active')
                .select();

            if (error) {
                logger.error('Error revoking token:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            if (!data || data.length === 0) {
                return {
                    success: false,
                    error: 'Token not found or already revoked'
                };
            }

            // Clear token from tables
            await supabase
                .from('tables')
                .update({
                    qr_code_token: null,
                    updated_at: new Date().toISOString()
                })
                .eq('qr_code_token', token);

            logger.info(`Token revoked: ${token}`);
            return {
                success: true,
                sessionId: data[0].id
            };
        } catch (err) {
            logger.error('Error in revokeToken:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Validate if a token is currently active and not expired
     * @param {string} token - Token to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateToken(token) {
        try {
            if (!this.validateTokenSignature(token)) {
                return {
                    valid: false,
                    reason: 'Invalid token format'
                };
            }

            // Query table_sessions
            const { data: session, error } = await supabase
                .from('table_sessions')
                .select('*')
                .eq('table_token', token)
                .eq('status', 'active')
                .single();

            if (error || !session) {
                return {
                    valid: false,
                    reason: 'Token not found or inactive'
                };
            }

            // Check token expiration (session start + 4 hours max)
            const sessionStart = new Date(session.session_start);
            const now = new Date();
            const maxSessionDuration = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
            
            if (now - sessionStart > maxSessionDuration) {
                logger.warn(`Token expired due to max session duration: ${token}`);
                // Auto-expire the session
                await this.revokeToken(token);
                return {
                    valid: false,
                    reason: 'Session expired (max duration exceeded)'
                };
            }

            // Check if timer has expired
            if (session.timer_status === 'running' && session.timer_ends_at) {
                const endsAt = new Date(session.timer_ends_at);
                
                if (now > endsAt) {
                    return {
                        valid: false,
                        reason: 'Session expired'
                    };
                }
            }

            // Verify token signature if stored in session metadata
            if (session.token_signature && session.token_created_at) {
                try {
                    const isValid = this.verifyTokenSignatureHash(
                        token, 
                        session.token_created_at, 
                        session.token_signature
                    );
                    
                    if (!isValid) {
                        logger.error(`Token signature verification failed: ${token}`);
                        return {
                            valid: false,
                            reason: 'Token signature verification failed - possible forgery'
                        };
                    }
                } catch (err) {
                    logger.error('Error verifying token signature:', err);
                    // Continue without signature verification if there's an error
                }
            }

            return {
                valid: true,
                session: session,
                tableId: session.table_id,
                tableNumber: session.table_number,
                sessionId: session.id
            };
        } catch (err) {
            logger.error('Error in validateToken:', err);
            return {
                valid: false,
                reason: err.message
            };
        }
    }

    /**
     * Generate a unique token that doesn't exist in the database
     * @param {number} maxAttempts - Maximum number of generation attempts
     * @param {string} ipAddress - IP address for rate limiting
     * @returns {Promise<Object>} Result with unique token or error
     */
    async generateUniqueToken(maxAttempts = 10, ipAddress = 'unknown') {
        // Check rate limit
        const rateLimit = this.checkRateLimit(ipAddress);
        if (!rateLimit.allowed) {
            logger.warn(`Rate limit exceeded for IP: ${ipAddress}`);
            return {
                success: false,
                error: 'Rate limit exceeded',
                retryAfter: rateLimit.retryAfter
            };
        }

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const token = this.generateTableToken();
            const timestamp = new Date().toISOString();
            const signature = this.generateTokenSignature(token, timestamp);
            
            // Check if token already exists
            const { data, error } = await supabase
                .from('table_sessions')
                .select('table_token')
                .eq('table_token', token)
                .eq('status', 'active')
                .single();

            if (error && error.code === 'PGRST116') {
                // No rows found - token is unique
                return {
                    success: true,
                    token: token,
                    signature: signature,
                    timestamp: timestamp,
                    rateLimitRemaining: rateLimit.remaining
                };
            }

            if (!data) {
                return {
                    success: true,
                    token: token,
                    signature: signature,
                    timestamp: timestamp,
                    rateLimitRemaining: rateLimit.remaining
                };
            }

            logger.debug(`Token collision detected, regenerating (attempt ${attempt + 1})`);
        }

        return {
            success: false,
            error: 'Failed to generate unique token after maximum attempts'
        };
    }
}

module.exports = new TableTokenService();
