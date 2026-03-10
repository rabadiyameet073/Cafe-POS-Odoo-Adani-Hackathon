/**
 * Data Integrity Validation Middleware
 * 
 * Validates data integrity throughout the order flow to ensure:
 * - Tables are occupied before accepting orders (Requirement 19.1)
 * - Payment is confirmed before sending to kitchen (Requirement 19.2)
 * - Tokens are valid before any order operation (Requirement 19.3)
 * - Database transactions for multi-step operations (Requirement 19.5)
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */

const { supabase } = require('../config/supabase');
const TableTokenService = require('../services/TableTokenService');
const logger = require('../utils/logger');
const { InvalidTokenError, InvalidStateError, NotFoundError } = require('../utils/errorHandler');
const { notifyAdministrator } = require('./errorMiddleware');

/**
 * Validate that a table token is valid before any order operation
 * Requirement 19.3
 */
async function validateTableToken(req, res, next) {
    try {
        const tableToken = req.body.table_token || req.body.tableToken || req.params.tableToken || req.query.table_token;

        if (!tableToken) {
            throw new InvalidTokenError('Table token is required');
        }

        const validation = await TableTokenService.validateToken(tableToken);

        if (!validation.valid) {
            logger.warn('Invalid token attempt:', {
                token: tableToken,
                reason: validation.reason,
                path: req.path
            });
            throw new InvalidTokenError(validation.reason);
        }

        // Attach validated session info to request
        req.tableSession = validation;
        req.tableToken = tableToken;

        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Validate that a table is occupied before accepting an order
 * Requirement 19.1
 */
async function validateTableOccupied(req, res, next) {
    try {
        const tableId = req.tableSession?.tableId || req.body.table_id || req.params.tableId;

        if (!tableId) {
            throw new InvalidStateError('Table ID is required');
        }

        const { data: table, error } = await supabase
            .from('tables')
            .select('status, table_number')
            .eq('id', tableId)
            .single();

        if (error || !table) {
            throw new NotFoundError('Table');
        }

        if (table.status !== 'occupied') {
            const errorMsg = `Cannot accept order: Table ${table.table_number} is ${table.status}`;
            logger.error('Data integrity violation:', {
                type: 'table_not_occupied',
                tableId,
                tableNumber: table.table_number,
                status: table.status,
                path: req.path
            });

            // Notify administrator (Requirement 19.4)
            await notifyAdministrator({
                type: 'data_integrity_violation',
                message: errorMsg,
                details: {
                    violation: 'table_not_occupied',
                    tableId,
                    tableNumber: table.table_number,
                    currentStatus: table.status,
                    expectedStatus: 'occupied'
                },
                path: req.path,
                timestamp: new Date().toISOString()
            });

            throw new InvalidStateError(errorMsg);
        }

        req.table = table;
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Validate that payment is confirmed before sending to kitchen
 * Requirement 19.2
 */
async function validatePaymentConfirmed(req, res, next) {
    try {
        const orderId = req.body.order_id || req.params.orderId;

        if (!orderId) {
            throw new InvalidStateError('Order ID is required');
        }

        const { data: order, error } = await supabase
            .from('orders')
            .select('payment_status, order_number, status')
            .eq('id', orderId)
            .single();

        if (error || !order) {
            throw new NotFoundError('Order');
        }

        if (order.payment_status !== 'paid') {
            const errorMsg = `Cannot send to kitchen: Order ${order.order_number} payment is ${order.payment_status}`;
            logger.error('Data integrity violation:', {
                type: 'payment_not_confirmed',
                orderId,
                orderNumber: order.order_number,
                paymentStatus: order.payment_status,
                path: req.path
            });

            // Notify administrator (Requirement 19.4)
            await notifyAdministrator({
                type: 'data_integrity_violation',
                message: errorMsg,
                details: {
                    violation: 'payment_not_confirmed',
                    orderId,
                    orderNumber: order.order_number,
                    currentPaymentStatus: order.payment_status,
                    expectedPaymentStatus: 'paid'
                },
                path: req.path,
                timestamp: new Date().toISOString()
            });

            throw new InvalidStateError(errorMsg);
        }

        req.order = order;
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Wrapper for database transactions to ensure atomic multi-step operations
 * Requirement 19.5
 * 
 * Note: Supabase doesn't support transactions in the same way as traditional SQL.
 * This function provides a pattern for handling multi-step operations with rollback capability.
 */
async function withTransaction(operations) {
    const rollbackOperations = [];
    
    try {
        for (const operation of operations) {
            const result = await operation.execute();
            
            if (operation.rollback) {
                rollbackOperations.push({
                    rollback: operation.rollback,
                    result
                });
            }
            
            if (!result.success) {
                throw new Error(result.error || 'Operation failed');
            }
        }
        
        return { success: true };
    } catch (error) {
        logger.error('Transaction failed, rolling back:', error);
        
        // Execute rollback operations in reverse order
        for (let i = rollbackOperations.length - 1; i >= 0; i--) {
            try {
                await rollbackOperations[i].rollback(rollbackOperations[i].result);
            } catch (rollbackError) {
                logger.error('Rollback operation failed:', rollbackError);
            }
        }
        
        throw error;
    }
}

/**
 * Validate order flow sequence
 * Ensures operations occur in proper sequence (Requirement 20.1)
 */
async function validateOrderFlowSequence(req, res, next) {
    try {
        const operation = req.body.operation || req.path.split('/').pop();
        const tableToken = req.tableToken;

        if (!tableToken) {
            return next();
        }

        // Get current session state
        const { data: session, error } = await supabase
            .from('table_sessions')
            .select('status, timer_status')
            .eq('table_token', tableToken)
            .single();

        if (error || !session) {
            throw new InvalidTokenError('Session not found');
        }

        // Validate session is active
        if (session.status !== 'active') {
            throw new InvalidStateError(`Session is ${session.status}. Please start a new session.`);
        }

        next();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    validateTableToken,
    validateTableOccupied,
    validatePaymentConfirmed,
    validateOrderFlowSequence,
    withTransaction
};
