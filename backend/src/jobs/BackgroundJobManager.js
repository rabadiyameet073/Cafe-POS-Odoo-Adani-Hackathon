/**
 * BackgroundJobManager
 * 
 * Manages all background jobs for the cafe management system.
 * Handles timer expiration checks and payment timeout handling.
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 6.3, 7.3
 */

const TimerService = require('../services/TimerService');
const PaymentService = require('../services/PaymentService');
const NotificationService = require('../services/NotificationService');
const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

class BackgroundJobManager {
    constructor() {
        this.timerCheckInterval = null;
        this.paymentTimeoutInterval = null;
        this.isRunning = false;
    }

    /**
     * Start all background jobs
     */
    start() {
        if (this.isRunning) {
            logger.warn('Background jobs already running');
            return;
        }

        logger.info('🔄 Starting background jobs...');

        // Start timer expiration job
        this.startTimerExpirationJob();

        // Start payment timeout job
        this.startPaymentTimeoutJob();

        this.isRunning = true;
        logger.info('✅ All background jobs started successfully');
    }

    /**
     * Stop all background jobs
     */
    stop() {
        if (!this.isRunning) {
            logger.warn('Background jobs not running');
            return;
        }

        logger.info('🛑 Stopping background jobs...');

        // Stop timer expiration job
        if (this.timerCheckInterval) {
            clearInterval(this.timerCheckInterval);
            this.timerCheckInterval = null;
            logger.info('Timer expiration job stopped');
        }

        // Stop payment timeout job
        if (this.paymentTimeoutInterval) {
            clearInterval(this.paymentTimeoutInterval);
            this.paymentTimeoutInterval = null;
            logger.info('Payment timeout job stopped');
        }

        this.isRunning = false;
        logger.info('✅ All background jobs stopped');
    }

    /**
     * Start timer expiration background job
     * Runs every minute to check for expired timers
     * Requirements: 13.1, 13.2, 13.3, 13.4
     */
    startTimerExpirationJob() {
        logger.info('Starting timer expiration job (runs every minute)');

        // Run immediately on startup
        this.checkExpiredTimers();

        // Then run every minute (60 seconds)
        this.timerCheckInterval = setInterval(() => {
            this.checkExpiredTimers();
        }, 60000);
    }

    /**
     * Check for expired timers and release tables
     */
    async checkExpiredTimers() {
        try {
            const result = await TimerService.checkExpiredTimers();

            if (result.success && result.releasedCount > 0) {
                logger.info(`✅ Timer expiration check: Released ${result.releasedCount} table(s)`);
                
                // Log details of released tables
                result.releasedTables.forEach(table => {
                    logger.info(`  - Table ${table.tableNumber} (ID: ${table.tableId}) auto-released`);
                });
            } else if (!result.success) {
                logger.error('❌ Timer expiration check failed:', result.error);
            }
            // No logging for 0 releases to avoid spam
        } catch (err) {
            logger.error('❌ Error in timer expiration job:', err);
        }
    }

    /**
     * Start payment timeout background job
     * Runs every minute to check for expired UPI QR codes
     * Requirements: 6.3, 7.3
     */
    startPaymentTimeoutJob() {
        logger.info('Starting payment timeout job (runs every minute)');

        // Run immediately on startup
        this.checkPaymentTimeouts();

        // Then run every minute (60 seconds)
        this.paymentTimeoutInterval = setInterval(() => {
            this.checkPaymentTimeouts();
        }, 60000);
    }

    /**
     * Check for expired UPI payments and update their status
     */
    async checkPaymentTimeouts() {
        try {
            const now = new Date();

            // Find expired UPI payments
            const { data: expiredPayments, error } = await supabase
                .from('payments')
                .select(`
                    id,
                    order_id,
                    table_number,
                    amount,
                    upi_reference,
                    upi_expires_at,
                    orders(order_number, table_token)
                `)
                .eq('payment_method', 'upi')
                .eq('status', 'pending')
                .not('upi_expires_at', 'is', null)
                .lt('upi_expires_at', now.toISOString());

            if (error) {
                logger.error('Error finding expired payments:', error);
                return;
            }

            if (!expiredPayments || expiredPayments.length === 0) {
                return; // No expired payments, no logging to avoid spam
            }

            logger.info(`Found ${expiredPayments.length} expired UPI payment(s)`);

            // Process each expired payment
            for (const payment of expiredPayments) {
                await this.expirePayment(payment);
            }

            logger.info(`✅ Payment timeout check: Expired ${expiredPayments.length} payment(s)`);
        } catch (err) {
            logger.error('❌ Error in payment timeout job:', err);
        }
    }

    /**
     * Expire a payment and notify customer
     * @param {Object} payment - Payment object with order details
     */
    async expirePayment(payment) {
        try {
            const now = new Date().toISOString();

            // Update payment status to expired
            const { error: paymentError } = await supabase
                .from('payments')
                .update({
                    status: 'expired',
                    updated_at: now
                })
                .eq('id', payment.id);

            if (paymentError) {
                logger.error(`Error expiring payment ${payment.id}:`, paymentError);
                return;
            }

            // Update order status back to pending payment
            const { error: orderError } = await supabase
                .from('orders')
                .update({
                    payment_status: 'pending',
                    status: 'pending_payment',
                    updated_at: now
                })
                .eq('id', payment.order_id);

            if (orderError) {
                logger.error(`Error updating order ${payment.order_id}:`, orderError);
            }

            // Notify customer of expiration
            await NotificationService.notifyCustomer(payment.order_id, 'payment_expired', {
                orderNumber: payment.orders?.order_number,
                tableNumber: payment.table_number,
                amount: payment.amount,
                message: 'Your UPI QR code has expired. Please generate a new QR code to complete payment.'
            });

            logger.info(`  - Payment ${payment.upi_reference} expired for order ${payment.orders?.order_number}`);
        } catch (err) {
            logger.error(`Error expiring payment ${payment.id}:`, err);
        }
    }

    /**
     * Get status of all background jobs
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            jobs: {
                timerExpiration: {
                    running: this.timerCheckInterval !== null,
                    interval: '60 seconds'
                },
                paymentTimeout: {
                    running: this.paymentTimeoutInterval !== null,
                    interval: '60 seconds'
                }
            }
        };
    }
}

// Export singleton instance
module.exports = new BackgroundJobManager();
