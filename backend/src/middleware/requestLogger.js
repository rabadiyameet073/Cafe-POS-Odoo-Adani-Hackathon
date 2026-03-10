/**
 * Request Logging Middleware
 * 
 * Logs all API requests with timestamps, duration, and context.
 * 
 * Requirements: 13.5, 14.5, 19.4
 */

const logger = require('../utils/logger');

/**
 * Middleware to log all API requests
 */
function requestLogger(req, res, next) {
    const startTime = Date.now();

    // Log request start
    logger.debug(`→ ${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id
    });

    // Capture response
    const originalSend = res.send.bind(res);
    res.send = function(data) {
        const duration = Date.now() - startTime;
        
        // Log request completion
        logger.logRequest(req, res, duration);
        
        return originalSend(data);
    };

    next();
}

/**
 * Middleware to log payment transactions
 */
function paymentLogger(req, res, next) {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to capture payment data
    res.json = function(data) {
        // Only log successful payment operations
        if (res.statusCode >= 200 && res.statusCode < 300) {
            // Check if this is a payment-related endpoint
            const isPaymentEndpoint = req.path.includes('/payments');
            
            if (isPaymentEndpoint && data.data) {
                const paymentData = {
                    id: data.data.id || data.data.payment_id,
                    orderId: data.data.order_id,
                    amount: data.data.amount || data.data.total_amount,
                    method: data.data.payment_method,
                    status: data.data.status,
                    tableNumber: data.data.table_number,
                    cashierId: data.data.cashier_id,
                    cashierName: data.data.cashier_name
                };

                logger.logPayment(paymentData);
            }
        }

        return originalJson(data);
    };

    next();
}

module.exports = {
    requestLogger,
    paymentLogger
};
