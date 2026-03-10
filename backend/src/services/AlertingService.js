/**
 * AlertingService
 * 
 * Monitors system health and sends alerts for critical issues.
 * 
 * Requirements: Reliability NFR 1
 */

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');
const MonitoringService = require('./MonitoringService');

class AlertingService {
    constructor() {
        this.alertThresholds = {
            errorRate: 10, // Alert if error rate > 10%
            paymentFailureRate: 20, // Alert if payment failure rate > 20%
            dbConnectionFailures: 3, // Alert after 3 consecutive failures
            timerDeviationSeconds: 120 // Alert if timer deviation > 2 minutes
        };

        this.alertState = {
            dbConnectionFailures: 0,
            lastAlerts: new Map(),
            alertCooldown: 5 * 60 * 1000 // 5 minutes cooldown between same alerts
        };

        this.monitoringInterval = null;
    }

    /**
     * Start monitoring and alerting
     */
    start() {
        if (this.monitoringInterval) {
            logger.warn('Alerting service already running');
            return;
        }

        logger.info('🔔 Starting alerting service...');

        // Run checks every minute
        this.monitoringInterval = setInterval(() => {
            this.runHealthChecks();
        }, 60000);

        // Run immediately on startup
        this.runHealthChecks();

        logger.info('✅ Alerting service started');
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            logger.info('🛑 Alerting service stopped');
        }
    }

    /**
     * Run all health checks
     */
    async runHealthChecks() {
        try {
            await this.checkErrorRate();
            await this.checkPaymentFailures();
            await this.checkDatabaseConnection();
            await this.checkSubscriptionHealth();
        } catch (err) {
            logger.error('Error running health checks:', err);
        }
    }

    /**
     * Check error rate
     */
    async checkErrorRate() {
        try {
            const metrics = await MonitoringService.getHealthMetrics();
            
            if (!metrics.success) return;

            const errorRate = parseFloat(metrics.metrics.requests.errorRate);

            if (errorRate > this.alertThresholds.errorRate) {
                await this.sendAlert({
                    type: 'high_error_rate',
                    severity: 'warning',
                    title: 'High Error Rate Detected',
                    message: `Error rate is ${errorRate}% (threshold: ${this.alertThresholds.errorRate}%)`,
                    data: {
                        errorRate,
                        totalRequests: metrics.metrics.requests.total,
                        errors: metrics.metrics.requests.errors
                    }
                });
            }
        } catch (err) {
            logger.error('Error checking error rate:', err);
        }
    }

    /**
     * Check payment failure rate
     */
    async checkPaymentFailures() {
        try {
            const stats = await MonitoringService.getPaymentStats('1h');
            
            if (!stats.success) return;

            const failureRate = parseFloat(stats.stats.failureRate);

            if (failureRate > this.alertThresholds.paymentFailureRate) {
                await this.sendAlert({
                    type: 'payment_failures',
                    severity: 'critical',
                    title: 'High Payment Failure Rate',
                    message: `Payment failure rate is ${failureRate}% in the last hour (threshold: ${this.alertThresholds.paymentFailureRate}%)`,
                    data: {
                        failureRate,
                        totalPayments: stats.stats.total,
                        failed: stats.stats.byStatus.failed || 0,
                        rejected: stats.stats.byStatus.rejected || 0
                    }
                });
            }
        } catch (err) {
            logger.error('Error checking payment failures:', err);
        }
    }

    /**
     * Check database connection
     */
    async checkDatabaseConnection() {
        try {
            const { data, error } = await supabase
                .from('tables')
                .select('id', { count: 'exact', head: true })
                .limit(1);

            if (error) {
                this.alertState.dbConnectionFailures++;

                if (this.alertState.dbConnectionFailures >= this.alertThresholds.dbConnectionFailures) {
                    await this.sendAlert({
                        type: 'database_connection',
                        severity: 'critical',
                        title: 'Database Connection Failure',
                        message: `Database connection has failed ${this.alertState.dbConnectionFailures} times consecutively`,
                        data: {
                            consecutiveFailures: this.alertState.dbConnectionFailures,
                            error: error.message
                        }
                    });
                }
            } else {
                // Reset failure count on successful connection
                if (this.alertState.dbConnectionFailures > 0) {
                    logger.info('Database connection restored');
                    this.alertState.dbConnectionFailures = 0;
                }
            }
        } catch (err) {
            logger.error('Error checking database connection:', err);
            this.alertState.dbConnectionFailures++;
        }
    }

    /**
     * Check subscription health
     */
    async checkSubscriptionHealth() {
        try {
            const metrics = await MonitoringService.getHealthMetrics();
            
            if (!metrics.success) return;

            const activeConnections = metrics.metrics.subscriptions.activeConnections;

            // Alert if no active connections during business hours (9 AM - 10 PM)
            const hour = new Date().getHours();
            const isBusinessHours = hour >= 9 && hour <= 22;

            if (isBusinessHours && activeConnections === 0) {
                await this.sendAlert({
                    type: 'subscription_health',
                    severity: 'warning',
                    title: 'No Active Subscriptions',
                    message: 'No real-time subscription connections detected during business hours',
                    data: {
                        activeConnections,
                        hour
                    }
                });
            }
        } catch (err) {
            logger.error('Error checking subscription health:', err);
        }
    }

    /**
     * Send alert
     */
    async sendAlert(alert) {
        try {
            // Check cooldown to prevent alert spam
            const lastAlert = this.alertState.lastAlerts.get(alert.type);
            const now = Date.now();

            if (lastAlert && (now - lastAlert) < this.alertState.alertCooldown) {
                logger.debug(`Alert ${alert.type} in cooldown, skipping`);
                return;
            }

            // Log alert
            logger.error(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.title}`, {
                type: alert.type,
                message: alert.message,
                data: alert.data
            });

            // Create notification in database
            await supabase.from('notifications').insert({
                type: 'system_alert',
                recipient_role: 'admin',
                title: `[${alert.severity.toUpperCase()}] ${alert.title}`,
                body: alert.message,
                data: {
                    alertType: alert.type,
                    severity: alert.severity,
                    ...alert.data,
                    timestamp: new Date().toISOString()
                },
                created_at: new Date().toISOString()
            });

            // Update last alert time
            this.alertState.lastAlerts.set(alert.type, now);

            // TODO: In production, integrate with external alerting services
            // - Send email to administrators
            // - Send SMS for critical alerts
            // - Post to Slack/Teams channel
            // - Create PagerDuty incident
            // - Send to monitoring service (DataDog, New Relic, etc.)

        } catch (err) {
            logger.error('Error sending alert:', err);
        }
    }

    /**
     * Get alert history
     */
    async getAlertHistory(limit = 50) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('type', 'system_alert')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                throw error;
            }

            return {
                success: true,
                alerts: data || []
            };
        } catch (err) {
            logger.error('Error getting alert history:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Update alert thresholds
     */
    updateThresholds(newThresholds) {
        this.alertThresholds = {
            ...this.alertThresholds,
            ...newThresholds
        };

        logger.info('Alert thresholds updated:', this.alertThresholds);
    }

    /**
     * Get current alert configuration
     */
    getConfiguration() {
        return {
            thresholds: this.alertThresholds,
            cooldown: this.alertState.alertCooldown,
            isRunning: this.monitoringInterval !== null
        };
    }
}

// Export singleton instance
module.exports = new AlertingService();
