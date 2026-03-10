/**
 * PaymentService
 * 
 * Manages dual payment processing (Cash and UPI).
 * Handles payment requests, approvals, rejections, and UPI QR code generation.
 * 
 * Security features:
 * - HTTPS enforcement for UPI payment processing
 * - UPI callback signature validation
 * - Payment amount verification
 * - Duplicate payment prevention
 * 
 * Requirements: 4.1, 5.2, 5.3, 6.1, 7.1, Security NFR 2
 */

const { supabase } = require('../config/supabase');
const TableTokenService = require('./TableTokenService');
const MonitoringService = require('./MonitoringService');
const logger = require('../utils/logger');
const crypto = require('crypto');
const { approvePaymentTransaction } = require('../utils/transactionHelper');
const GracefulDegradationService = require('./GracefulDegradationService');

// UPI signature secret (should be in environment variables)
const UPI_SIGNATURE_SECRET = process.env.UPI_SIGNATURE_SECRET || 'default-upi-secret-change-in-production';

// Duplicate payment prevention cache (transactionId -> timestamp)
const processedTransactions = new Map();
const TRANSACTION_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

class PaymentService {
    /**
     * Generate UPI callback signature
     * @param {Object} data - Payment data to sign
     * @returns {string} HMAC signature
     */
    generateUPISignature(data) {
        const payload = `${data.transactionId}:${data.orderId}:${data.amount}:${data.status}`;
        return crypto.createHmac('sha256', UPI_SIGNATURE_SECRET)
            .update(payload)
            .digest('hex');
    }

    /**
     * Verify UPI callback signature
     * @param {Object} data - Payment data
     * @param {string} signature - Signature to verify
     * @returns {boolean} True if signature is valid
     */
    verifyUPISignature(data, signature) {
        const expectedSignature = this.generateUPISignature(data);
        try {
            return crypto.timingSafeEqual(
                Buffer.from(signature, 'hex'),
                Buffer.from(expectedSignature, 'hex')
            );
        } catch (err) {
            logger.error('Error verifying UPI signature:', err);
            return false;
        }
    }

    /**
     * Check if transaction has already been processed (duplicate prevention)
     * @param {string} transactionId - UPI transaction ID
     * @returns {boolean} True if transaction was already processed
     */
    isDuplicateTransaction(transactionId) {
        const now = Date.now();
        
        // Clean up old entries
        for (const [txId, timestamp] of processedTransactions.entries()) {
            if (now - timestamp > TRANSACTION_CACHE_TTL) {
                processedTransactions.delete(txId);
            }
        }

        if (processedTransactions.has(transactionId)) {
            logger.warn(`Duplicate transaction detected: ${transactionId}`);
            return true;
        }

        return false;
    }

    /**
     * Mark transaction as processed
     * @param {string} transactionId - UPI transaction ID
     */
    markTransactionProcessed(transactionId) {
        processedTransactions.set(transactionId, Date.now());
    }

    /**
     * Enforce HTTPS for UPI operations
     * @param {Object} req - Express request object
     * @returns {boolean} True if connection is secure
     */
    enforceHTTPS(req) {
        // In production, ensure HTTPS is used
        if (process.env.NODE_ENV === 'production') {
            const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
            if (!isSecure) {
                logger.error('UPI operation attempted over insecure connection');
                return false;
            }
        }
        return true;
    }

    /**
     * Create a cash payment request
     * @param {string} orderId - UUID of the order
     * @param {number} amount - Payment amount
     * @param {string} tableToken - Table token
     * @returns {Promise<Object>} Result with payment ID
     */
    async createCashPaymentRequest(orderId, amount, tableToken) {
        try {
            // Validate token
            const tokenValidation = await TableTokenService.validateToken(tableToken);
            if (!tokenValidation.valid) {
                return {
                    success: false,
                    error: `Invalid token: ${tokenValidation.reason}`
                };
            }

            // Get order details
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items(product_name, quantity, line_total)
                `)
                .eq('id', orderId)
                .single();

            if (orderError || !order) {
                return {
                    success: false,
                    error: 'Order not found'
                };
            }

            if (order.payment_status !== 'pending') {
                return {
                    success: false,
                    error: 'Order payment already processed'
                };
            }

            const now = new Date().toISOString();

            // Create payment record
            const { data: payment, error: paymentError } = await supabase
                .from('payments')
                .insert({
                    order_id: orderId,
                    table_token: tableToken,
                    table_number: tokenValidation.tableNumber,
                    amount: amount,
                    payment_method: 'cash',
                    status: 'pending_approval',
                    created_at: now,
                    updated_at: now
                })
                .select()
                .single();

            if (paymentError) {
                logger.error('Error creating payment:', paymentError);
                return {
                    success: false,
                    error: 'Failed to create payment'
                };
            }

            // Create cashier payment request
            const orderSummary = order.order_items.map(item => ({
                product: item.product_name,
                quantity: item.quantity,
                price: item.line_total
            }));

            const { error: requestError } = await supabase
                .from('cashier_payment_requests')
                .insert({
                    payment_id: payment.id,
                    order_id: orderId,
                    table_number: tokenValidation.tableNumber,
                    table_token: tableToken,
                    total_amount: amount,
                    order_summary: orderSummary,
                    status: 'pending',
                    created_at: now
                });

            if (requestError) {
                logger.error('Error creating cashier request:', requestError);
                // Rollback payment
                await supabase.from('payments').delete().eq('id', payment.id);
                return {
                    success: false,
                    error: 'Failed to create cashier request'
                };
            }

            // Update order payment status
            await supabase
                .from('orders')
                .update({
                    payment_status: 'pending_cash',
                    payment_method: 'cash',
                    status: 'payment_requested',
                    updated_at: now
                })
                .eq('id', orderId);

            logger.info(`Cash payment request created for order ${order.order_number}`);

            return {
                success: true,
                paymentId: payment.id,
                status: 'pending_approval',
                orderNumber: order.order_number
            };
        } catch (err) {
            logger.error('Error in createCashPaymentRequest:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Generate UPI QR code data
     * @param {string} orderId - UUID of the order
     * @param {number} amount - Payment amount
     * @param {string} tableToken - Table token
     * @returns {Promise<Object>} Result with QR code data
     */
    async generateUPIQRCode(orderId, amount, tableToken) {
        try {
            // Check if UPI is available (graceful degradation)
            if (!GracefulDegradationService.isPaymentMethodAvailable('upi')) {
                return {
                    success: false,
                    error: 'UPI payments are temporarily unavailable. Please use cash payment.',
                    degraded: true,
                    availableMethods: GracefulDegradationService.getAvailablePaymentMethods()
                };
            }

            // Validate token
            const tokenValidation = await TableTokenService.validateToken(tableToken);
            if (!tokenValidation.valid) {
                return {
                    success: false,
                    error: `Invalid token: ${tokenValidation.reason}`
                };
            }

            // Get order details
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select('order_number, payment_status')
                .eq('id', orderId)
                .single();

            if (orderError || !order) {
                return {
                    success: false,
                    error: 'Order not found'
                };
            }

            if (order.payment_status !== 'pending') {
                return {
                    success: false,
                    error: 'Order payment already processed'
                };
            }

            // Get UPI configuration
            const { data: upiConfig, error: configError } = await supabase
                .from('payment_methods')
                .select('upi_id, merchant_name')
                .eq('name', 'upi')
                .eq('is_enabled', true)
                .single();

            if (configError || !upiConfig || !upiConfig.upi_id) {
                logger.error('UPI configuration not found:', configError);
                return {
                    success: false,
                    error: 'UPI payment not configured'
                };
            }

            const now = new Date();
            const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

            // Generate transaction reference
            const transactionRef = `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

            // Build UPI deep-link string
            const upiString = `upi://pay?pa=${encodeURIComponent(upiConfig.upi_id)}&pn=${encodeURIComponent(upiConfig.merchant_name)}&am=${amount.toFixed(2)}&tr=${transactionRef}&tn=${encodeURIComponent(`Order ${order.order_number}`)}&cu=INR`;

            // Create payment record
            const { data: payment, error: paymentError } = await supabase
                .from('payments')
                .insert({
                    order_id: orderId,
                    table_token: tableToken,
                    table_number: tokenValidation.tableNumber,
                    amount: amount,
                    payment_method: 'upi',
                    status: 'pending',
                    qr_code_data: upiString,
                    upi_reference: transactionRef,
                    qr_generated_at: now.toISOString(),
                    upi_expires_at: expiresAt.toISOString(),
                    created_at: now.toISOString(),
                    updated_at: now.toISOString()
                })
                .select()
                .single();

            if (paymentError) {
                logger.error('Error creating UPI payment:', paymentError);
                return {
                    success: false,
                    error: 'Failed to create UPI payment'
                };
            }

            // Update order payment status
            await supabase
                .from('orders')
                .update({
                    payment_status: 'pending_upi',
                    payment_method: 'upi',
                    updated_at: now.toISOString()
                })
                .eq('id', orderId);

            logger.info(`UPI QR code generated for order ${order.order_number}`);

            return {
                success: true,
                paymentId: payment.id,
                qrCodeData: upiString,
                transactionRef: transactionRef,
                expiresAt: expiresAt.toISOString(),
                orderNumber: order.order_number
            };
        } catch (err) {
            logger.error('Error in generateUPIQRCode:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Approve a cash payment
     * @param {string} paymentId - UUID of the payment
     * @param {string} cashierId - UUID of the cashier
     * @param {string} cashierName - Name of the cashier
     * @returns {Promise<Object>} Result object
     */
    async approveCashPayment(paymentId, cashierId, cashierName) {
        try {
            // Use transaction helper for atomic payment approval
            const transactionResult = await approvePaymentTransaction(paymentId, {
                cashier_id: cashierId,
                cashier_name: cashierName,
                approved_at: new Date().toISOString()
            });

            if (!transactionResult.success) {
                return {
                    success: false,
                    error: transactionResult.error
                };
            }

            const { paymentId: approvedPaymentId, orderId } = transactionResult.result;

            // Update cashier payment request
            await supabase
                .from('cashier_payment_requests')
                .update({
                    status: 'approved',
                    cashier_id: cashierId,
                    cashier_name: cashierName,
                    responded_at: new Date().toISOString()
                })
                .eq('payment_id', paymentId);

            logger.info(`Cash payment ${paymentId} approved by ${cashierName}`);

            // Log payment transaction
            logger.logPayment({
                id: paymentId,
                orderId: orderId,
                amount: transactionResult.result.amount,
                method: 'cash',
                status: 'approved',
                tableNumber: transactionResult.result.tableNumber,
                cashierId: cashierId,
                cashierName: cashierName
            });

            // Record payment success in monitoring
            MonitoringService.recordPayment(true);

            return {
                success: true,
                paymentId: approvedPaymentId,
                orderId: orderId,
                cashierName: cashierName
            };
        } catch (err) {
            logger.error('Error in approveCashPayment:', err);
            
            // Record payment failure in monitoring
            MonitoringService.recordPayment(false);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Reject a cash payment
     * @param {string} paymentId - UUID of the payment
     * @param {string} cashierId - UUID of the cashier
     * @param {string} cashierName - Name of the cashier
     * @param {string} reason - Rejection reason
     * @returns {Promise<Object>} Result object
     */
    async rejectCashPayment(paymentId, cashierId, cashierName, reason) {
        try {
            const now = new Date().toISOString();

            // Get payment details
            const { data: payment, error: paymentError } = await supabase
                .from('payments')
                .select('order_id, status, payment_method')
                .eq('id', paymentId)
                .single();

            if (paymentError || !payment) {
                return {
                    success: false,
                    error: 'Payment not found'
                };
            }

            if (payment.payment_method !== 'cash') {
                return {
                    success: false,
                    error: 'Payment is not a cash payment'
                };
            }

            if (payment.status !== 'pending_approval') {
                return {
                    success: false,
                    error: 'Payment already processed'
                };
            }

            // Update payment status
            const { error: updateError } = await supabase
                .from('payments')
                .update({
                    status: 'rejected',
                    cashier_id: cashierId,
                    cashier_name: cashierName,
                    rejected_at: now,
                    rejection_reason: reason,
                    updated_at: now
                })
                .eq('id', paymentId);

            if (updateError) {
                logger.error('Error rejecting payment:', updateError);
                return {
                    success: false,
                    error: 'Failed to reject payment'
                };
            }

            // Update cashier payment request
            await supabase
                .from('cashier_payment_requests')
                .update({
                    status: 'rejected',
                    cashier_id: cashierId,
                    cashier_name: cashierName,
                    responded_at: now
                })
                .eq('payment_id', paymentId);

            // Update order status
            await supabase
                .from('orders')
                .update({
                    payment_status: 'failed',
                    status: 'pending_payment',
                    updated_at: now
                })
                .eq('id', payment.order_id);

            logger.info(`Cash payment ${paymentId} rejected by ${cashierName}: ${reason}`);

            return {
                success: true,
                paymentId: paymentId,
                orderId: payment.order_id,
                reason: reason
            };
        } catch (err) {
            logger.error('Error in rejectCashPayment:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Verify UPI payment
     * @param {string} transactionId - UPI transaction ID
     * @param {string} orderId - UUID of the order
     * @param {string} upiReference - Transaction reference from QR code
     * @param {number} amount - Payment amount from callback
     * @param {string} signature - Callback signature for verification
     * @param {Object} req - Express request object for HTTPS enforcement
     * @returns {Promise<Object>} Result object
     */
    async verifyUPIPayment(transactionId, orderId, upiReference, amount, signature = null, req = null) {
        try {
            // Enforce HTTPS for UPI payment processing
            if (req && !this.enforceHTTPS(req)) {
                return {
                    success: false,
                    error: 'UPI payments must be processed over HTTPS'
                };
            }

            // Check for duplicate transaction
            if (this.isDuplicateTransaction(transactionId)) {
                return {
                    success: false,
                    error: 'Transaction already processed'
                };
            }

            const now = new Date().toISOString();

            // Get payment by order and reference
            const { data: payment, error: paymentError } = await supabase
                .from('payments')
                .select('*')
                .eq('order_id', orderId)
                .eq('upi_reference', upiReference)
                .eq('payment_method', 'upi')
                .single();

            if (paymentError || !payment) {
                return {
                    success: false,
                    error: 'Payment not found or reference mismatch'
                };
            }

            if (payment.status === 'completed') {
                return {
                    success: false,
                    error: 'Payment already processed'
                };
            }

            // Verify payment amount matches
            const expectedAmount = parseFloat(payment.amount);
            const receivedAmount = parseFloat(amount);
            
            if (Math.abs(expectedAmount - receivedAmount) > 0.01) {
                logger.error(`Payment amount mismatch: expected ${expectedAmount}, received ${receivedAmount}`);
                return {
                    success: false,
                    error: 'Payment amount verification failed'
                };
            }

            // Verify UPI callback signature if provided
            if (signature) {
                const callbackData = {
                    transactionId: transactionId,
                    orderId: orderId,
                    amount: amount,
                    status: 'success'
                };
                
                if (!this.verifyUPISignature(callbackData, signature)) {
                    logger.error(`UPI signature verification failed for transaction ${transactionId}`);
                    return {
                        success: false,
                        error: 'Payment signature verification failed'
                    };
                }
            }

            // Check if QR code expired
            if (payment.upi_expires_at && new Date(payment.upi_expires_at) < new Date()) {
                return {
                    success: false,
                    error: 'QR code expired'
                };
            }

            // Mark transaction as processed (duplicate prevention)
            this.markTransactionProcessed(transactionId);

            // Update payment status
            const { error: updateError } = await supabase
                .from('payments')
                .update({
                    status: 'completed',
                    upi_transaction_id: transactionId,
                    payment_confirmed_at: now,
                    cashier_name: 'UPI', // For display purposes
                    updated_at: now
                })
                .eq('id', payment.id);

            if (updateError) {
                logger.error('Error verifying UPI payment:', updateError);
                // Remove from processed cache if update failed
                processedTransactions.delete(transactionId);
                return {
                    success: false,
                    error: 'Failed to verify payment'
                };
            }

            // Update order status
            await supabase
                .from('orders')
                .update({
                    payment_status: 'paid',
                    status: 'paid',
                    payment_confirmed_at: now,
                    updated_at: now
                })
                .eq('id', orderId);

            logger.info(`UPI payment verified for order ${orderId}, transaction: ${transactionId}`);

            // Log payment transaction
            logger.logPayment({
                id: payment.id,
                orderId: orderId,
                amount: payment.amount,
                method: 'upi',
                status: 'completed',
                tableNumber: payment.table_number,
                cashierId: null,
                cashierName: 'UPI'
            });

            // Record payment success in monitoring
            MonitoringService.recordPayment(true);

            return {
                success: true,
                paymentId: payment.id,
                orderId: orderId,
                transactionId: transactionId
            };
        } catch (err) {
            logger.error('Error in verifyUPIPayment:', err);
            
            // Record payment failure in monitoring
            MonitoringService.recordPayment(false);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Get payment by ID
     * @param {string} paymentId - UUID of the payment
     * @returns {Promise<Object>} Result with payment details
     */
    async getPaymentById(paymentId) {
        try {
            const { data: payment, error } = await supabase
                .from('payments')
                .select('*')
                .eq('id', paymentId)
                .single();

            if (error || !payment) {
                return {
                    success: false,
                    error: 'Payment not found'
                };
            }

            return {
                success: true,
                payment: payment
            };
        } catch (err) {
            logger.error('Error in getPaymentById:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }
}

module.exports = new PaymentService();
