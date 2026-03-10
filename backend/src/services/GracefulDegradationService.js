/**
 * Graceful Degradation Service
 * 
 * Provides fallback mechanisms when external services fail
 * - Cash-only mode when payment gateway is down
 * - Manual table management when timer service fails
 * 
 * Requirements: Reliability NFR 1 - 99.5% uptime
 */

const logger = require('../utils/logger');

class GracefulDegradationService {
    constructor() {
        this.degradationState = {
            cashOnlyMode: false,
            manualTableMode: false,
            paymentGatewayDown: false,
            timerServiceDown: false,
            lastHealthCheck: null
        };
    }

    /**
     * Enable cash-only mode
     * Disables UPI payments when payment gateway is unavailable
     */
    enableCashOnlyMode(reason = 'Payment gateway unavailable') {
        if (!this.degradationState.cashOnlyMode) {
            this.degradationState.cashOnlyMode = true;
            this.degradationState.paymentGatewayDown = true;
            logger.warn(`⚠ CASH-ONLY MODE ENABLED: ${reason}`);
        }
    }

    /**
     * Disable cash-only mode
     * Re-enables UPI payments when payment gateway is restored
     */
    disableCashOnlyMode() {
        if (this.degradationState.cashOnlyMode) {
            this.degradationState.cashOnlyMode = false;
            this.degradationState.paymentGatewayDown = false;
            logger.info('✓ Cash-only mode disabled, UPI payments restored');
        }
    }

    /**
     * Check if cash-only mode is active
     * @returns {boolean} True if cash-only mode is enabled
     */
    isCashOnlyMode() {
        return this.degradationState.cashOnlyMode;
    }

    /**
     * Enable manual table management mode
     * Disables automatic timer-based table release
     */
    enableManualTableMode(reason = 'Timer service unavailable') {
        if (!this.degradationState.manualTableMode) {
            this.degradationState.manualTableMode = true;
            this.degradationState.timerServiceDown = true;
            logger.warn(`⚠ MANUAL TABLE MODE ENABLED: ${reason}`);
        }
    }

    /**
     * Disable manual table management mode
     * Re-enables automatic timer-based table release
     */
    disableManualTableMode() {
        if (this.degradationState.manualTableMode) {
            this.degradationState.manualTableMode = false;
            this.degradationState.timerServiceDown = false;
            logger.info('✓ Manual table mode disabled, automatic timers restored');
        }
    }

    /**
     * Check if manual table mode is active
     * @returns {boolean} True if manual table mode is enabled
     */
    isManualTableMode() {
        return this.degradationState.manualTableMode;
    }

    /**
     * Get available payment methods based on degradation state
     * @returns {Array<string>} Available payment methods
     */
    getAvailablePaymentMethods() {
        if (this.degradationState.cashOnlyMode) {
            return ['cash'];
        }
        return ['cash', 'upi'];
    }

    /**
     * Check if a payment method is available
     * @param {string} method - Payment method ('cash' or 'upi')
     * @returns {boolean} True if method is available
     */
    isPaymentMethodAvailable(method) {
        const available = this.getAvailablePaymentMethods();
        return available.includes(method);
    }

    /**
     * Get degradation status
     * @returns {Object} Current degradation state
     */
    getStatus() {
        return {
            ...this.degradationState,
            availablePaymentMethods: this.getAvailablePaymentMethods(),
            systemMode: this.getSystemMode()
        };
    }

    /**
     * Get system mode description
     * @returns {string} System mode
     */
    getSystemMode() {
        if (this.degradationState.cashOnlyMode && this.degradationState.manualTableMode) {
            return 'degraded-critical';
        } else if (this.degradationState.cashOnlyMode || this.degradationState.manualTableMode) {
            return 'degraded-partial';
        }
        return 'normal';
    }

    /**
     * Test payment gateway connectivity
     * @returns {Promise<boolean>} True if gateway is reachable
     */
    async testPaymentGateway() {
        try {
            // In a real implementation, this would ping the UPI gateway
            // For now, we'll simulate a health check
            const { supabase } = require('../config/supabase');
            
            const { data, error } = await supabase
                .from('payment_methods')
                .select('is_enabled')
                .eq('name', 'upi')
                .single();

            if (error || !data || !data.is_enabled) {
                return false;
            }

            return true;
        } catch (error) {
            logger.error('Payment gateway health check failed:', error);
            return false;
        }
    }

    /**
     * Test timer service health
     * @returns {Promise<boolean>} True if timer service is healthy
     */
    async testTimerService() {
        try {
            // Check if timer service can access database
            const { supabase } = require('../config/supabase');
            
            const { data, error } = await supabase
                .from('table_sessions')
                .select('id')
                .eq('timer_status', 'running')
                .limit(1);

            if (error) {
                return false;
            }

            return true;
        } catch (error) {
            logger.error('Timer service health check failed:', error);
            return false;
        }
    }

    /**
     * Perform automatic health checks and enable degradation modes as needed
     */
    async performHealthChecks() {
        this.degradationState.lastHealthCheck = new Date().toISOString();

        // Check payment gateway
        const paymentGatewayHealthy = await this.testPaymentGateway();
        if (!paymentGatewayHealthy && !this.degradationState.cashOnlyMode) {
            this.enableCashOnlyMode('Payment gateway health check failed');
        } else if (paymentGatewayHealthy && this.degradationState.cashOnlyMode) {
            this.disableCashOnlyMode();
        }

        // Check timer service
        const timerServiceHealthy = await this.testTimerService();
        if (!timerServiceHealthy && !this.degradationState.manualTableMode) {
            this.enableManualTableMode('Timer service health check failed');
        } else if (timerServiceHealthy && this.degradationState.manualTableMode) {
            this.disableManualTableMode();
        }

        return {
            paymentGatewayHealthy,
            timerServiceHealthy,
            systemMode: this.getSystemMode()
        };
    }

    /**
     * Start automatic health monitoring
     * @param {number} intervalMs - Health check interval (default: 60000ms = 1 minute)
     */
    startHealthMonitoring(intervalMs = 60000) {
        if (this.healthCheckInterval) {
            logger.warn('Health monitoring already started');
            return;
        }

        logger.info(`Starting graceful degradation health monitoring (interval: ${intervalMs}ms)`);

        // Perform initial check
        this.performHealthChecks();

        // Schedule periodic checks
        this.healthCheckInterval = setInterval(() => {
            this.performHealthChecks();
        }, intervalMs);
    }

    /**
     * Stop automatic health monitoring
     */
    stopHealthMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
            logger.info('Health monitoring stopped');
        }
    }

    /**
     * Get degradation message for users
     * @returns {string|null} User-facing message or null if no degradation
     */
    getUserMessage() {
        if (this.degradationState.cashOnlyMode && this.degradationState.manualTableMode) {
            return 'System is operating in limited mode. Only cash payments are available and table management is manual. We apologize for the inconvenience.';
        } else if (this.degradationState.cashOnlyMode) {
            return 'UPI payments are temporarily unavailable. Please use cash payment at the counter.';
        } else if (this.degradationState.manualTableMode) {
            return 'Automatic table timers are temporarily unavailable. Staff will manage table availability manually.';
        }
        return null;
    }
}

module.exports = new GracefulDegradationService();
