/**
 * Audit Logging Middleware
 * 
 * Logs all admin actions for security and compliance.
 * 
 * Requirements: Security NFR 3, 14.5
 */

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Log admin action to database
 * @param {Object} actionData - Action details
 */
async function logAdminAction(actionData) {
    try {
        const { error } = await supabase
            .from('admin_logs')
            .insert({
                admin_id: actionData.adminId,
                action_type: actionData.actionType,
                target_table: actionData.targetTable,
                target_id: actionData.targetId,
                details: actionData.details,
                created_at: new Date().toISOString()
            });

        if (error) {
            logger.error('Error logging admin action:', error);
        }
    } catch (err) {
        logger.error('Error in logAdminAction:', err);
    }
}

/**
 * Middleware to audit admin actions
 * Logs the action after the request completes successfully
 */
function auditAdminAction(actionType) {
    return async (req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json method to capture response
        res.json = function(data) {
            // Only log if request was successful
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const auditData = {
                    adminId: req.user?.id,
                    actionType: actionType,
                    targetTable: extractTargetTable(req),
                    targetId: extractTargetId(req, data),
                    details: {
                        method: req.method,
                        path: req.path,
                        body: sanitizeBody(req.body),
                        params: req.params,
                        query: req.query,
                        ip: req.ip || req.connection.remoteAddress,
                        userAgent: req.headers['user-agent'],
                        timestamp: new Date().toISOString()
                    }
                };

                // Log asynchronously without blocking response
                logAdminAction(auditData).catch(err => {
                    logger.error('Failed to log admin action:', err);
                });

                logger.info(`Admin action: ${actionType} by ${req.user?.email || 'unknown'}`);
            }

            // Call original json method
            return originalJson(data);
        };

        next();
    };
}

/**
 * Extract target table from request
 */
function extractTargetTable(req) {
    const path = req.path.toLowerCase();
    
    if (path.includes('/tables')) return 'tables';
    if (path.includes('/timers')) return 'table_sessions';
    if (path.includes('/payments')) return 'payments';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/users')) return 'users';
    if (path.includes('/products')) return 'products';
    
    return 'unknown';
}

/**
 * Extract target ID from request or response
 */
function extractTargetId(req, responseData) {
    // Try to get from params first
    if (req.params.id) return req.params.id;
    if (req.params.tableId) return req.params.tableId;
    if (req.params.sessionId) return req.params.sessionId;
    
    // Try to get from body
    if (req.body.table_id) return req.body.table_id;
    if (req.body.session_id) return req.body.session_id;
    if (req.body.order_id) return req.body.order_id;
    
    // Try to get from response
    if (responseData?.data?.id) return responseData.data.id;
    if (responseData?.data?.table_id) return responseData.data.table_id;
    
    return null;
}

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeBody(body) {
    if (!body) return null;
    
    const sanitized = { ...body };
    
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.password_hash;
    delete sanitized.token;
    delete sanitized.secret;
    
    return sanitized;
}

/**
 * Get audit logs for a specific admin or action type
 */
async function getAuditLogs(filters = {}) {
    try {
        let query = supabase
            .from('admin_logs')
            .select(`
                *,
                users(email, full_name)
            `)
            .order('created_at', { ascending: false });

        if (filters.adminId) {
            query = query.eq('admin_id', filters.adminId);
        }

        if (filters.actionType) {
            query = query.eq('action_type', filters.actionType);
        }

        if (filters.targetTable) {
            query = query.eq('target_table', filters.targetTable);
        }

        if (filters.fromDate) {
            query = query.gte('created_at', filters.fromDate);
        }

        if (filters.toDate) {
            query = query.lte('created_at', filters.toDate);
        }

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) {
            logger.error('Error fetching audit logs:', error);
            return { success: false, error: error.message };
        }

        return { success: true, logs: data || [] };
    } catch (err) {
        logger.error('Error in getAuditLogs:', err);
        return { success: false, error: err.message };
    }
}

module.exports = {
    auditAdminAction,
    logAdminAction,
    getAuditLogs
};
