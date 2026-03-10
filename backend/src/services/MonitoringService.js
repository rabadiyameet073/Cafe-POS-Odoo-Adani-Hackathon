/**
 * MonitoringService
 * 
 * Provides system health metrics and monitoring capabilities.
 * 
 * Requirements: Reliability NFR 1
 */

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

class MonitoringService {
    constructor() {
        this.metrics = {
            requests: {
                total: 0,
                success: 0,
                errors: 0,
                lastReset: new Date()
            },
            payments: {
                total: 0,
                success: 0,
                failed: 0,
                lastReset: new Date()
            },
            subscriptions: {
                active: 0,
                connections: new Map()
            },
            timers: {
                active: 0,
                expired: 0,
                lastCheck: null
            }
        };
    }

    /**
     * Record API request
     */
    recordRequest(success = true) {
        this.metrics.requests.total++;
        if (success) {
            this.metrics.requests.success++;
        } else {
            this.metrics.requests.errors++;
        }
    }

    /**
     * Record payment transaction
     */
    recordPayment(success = true) {
        this.metrics.payments.total++;
        if (success) {
            this.metrics.payments.success++;
        } else {
            this.metrics.payments.failed++;
        }
    }

    /**
     * Register subscription connection
     */
    registerSubscription(clientId, channel) {
        this.metrics.subscriptions.connections.set(clientId, {
            channel,
            connectedAt: new Date()
        });
        this.metrics.subscriptions.active = this.metrics.subscriptions.connections.size;
        
        logger.debug(`Subscription registered: ${clientId} on ${channel}`);
    }

    /**
     * Unregister subscription connection
     */
    unregisterSubscription(clientId) {
        this.metrics.subscriptions.connections.delete(clientId);
        this.metrics.subscriptions.active = this.metrics.subscriptions.connections.size;
        
        logger.debug(`Subscription unregistered: ${clientId}`);
    }

    /**
     * Get system health metrics
     */
    async getHealthMetrics() {
        try {
            // Get active timers count
            const { data: activeSessions, error: sessionError } = await supabase
                .from('table_sessions')
                .select('id', { count: 'exact', head: true })
                .eq('timer_status', 'running')
                .eq('status', 'active');

            if (!sessionError) {
                this.metrics.timers.active = activeSessions?.length || 0;
            }

            // Get database connection status
            const { data: dbTest, error: dbError } = await supabase
                .from('tables')
                .select('id', { count: 'exact', head: true })
                .limit(1);

            const dbConnected = !dbError;

            // Calculate error rate
            const errorRate = this.metrics.requests.total > 0
                ? (this.metrics.requests.errors / this.metrics.requests.total * 100).toFixed(2)
                : 0;

            // Calculate payment success rate
            const paymentSuccessRate = this.metrics.payments.total > 0
                ? (this.metrics.payments.success / this.metrics.payments.total * 100).toFixed(2)
                : 100;

            return {
                success: true,
                timestamp: new Date().toISOString(),
                status: dbConnected && errorRate < 10 ? 'healthy' : 'degraded',
                metrics: {
                    requests: {
                        total: this.metrics.requests.total,
                        success: this.metrics.requests.success,
                        errors: this.metrics.requests.errors,
                        errorRate: `${errorRate}%`,
                        since: this.metrics.requests.lastReset
                    },
                    payments: {
                        total: this.metrics.payments.total,
                        success: this.metrics.payments.success,
                        failed: this.metrics.payments.failed,
                        successRate: `${paymentSuccessRate}%`,
                        since: this.metrics.payments.lastReset
                    },
                    subscriptions: {
                        activeConnections: this.metrics.subscriptions.active,
                        channels: Array.from(this.metrics.subscriptions.connections.values())
                            .map(conn => conn.channel)
                    },
                    timers: {
                        active: this.metrics.timers.active,
                        expired: this.metrics.timers.expired,
                        lastCheck: this.metrics.timers.lastCheck
                    },
                    database: {
                        connected: dbConnected,
                        status: dbConnected ? 'connected' : 'disconnected'
                    }
                }
            };
        } catch (err) {
            logger.error('Error getting health metrics:', err);
            return {
                success: false,
                error: err.message,
                status: 'error'
            };
        }
    }

    /**
     * Get payment statistics
     */
    async getPaymentStats(timeRange = '24h') {
        try {
            const now = new Date();
            let fromDate;

            switch (timeRange) {
                case '1h':
                    fromDate = new Date(now.getTime() - 60 * 60 * 1000);
                    break;
                case '24h':
                    fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            }

            // Get payment statistics
            const { data: payments, error } = await supabase
                .from('payments')
                .select('status, payment_method, amount, created_at')
                .gte('created_at', fromDate.toISOString());

            if (error) {
                throw error;
            }

            const stats = {
                total: payments.length,
                byStatus: {},
                byMethod: {},
                totalAmount: 0,
                successRate: 0,
                failureRate: 0
            };

            payments.forEach(payment => {
                // Count by status
                stats.byStatus[payment.status] = (stats.byStatus[payment.status] || 0) + 1;

                // Count by method
                stats.byMethod[payment.payment_method] = (stats.byMethod[payment.payment_method] || 0) + 1;

                // Sum amounts for successful payments
                if (payment.status === 'approved' || payment.status === 'completed') {
                    stats.totalAmount += parseFloat(payment.amount);
                }
            });

            const successCount = (stats.byStatus.approved || 0) + (stats.byStatus.completed || 0);
            const failureCount = (stats.byStatus.rejected || 0) + (stats.byStatus.failed || 0);

            stats.successRate = payments.length > 0
                ? ((successCount / payments.length) * 100).toFixed(2)
                : 100;

            stats.failureRate = payments.length > 0
                ? ((failureCount / payments.length) * 100).toFixed(2)
                : 0;

            return {
                success: true,
                timeRange,
                fromDate: fromDate.toISOString(),
                toDate: now.toISOString(),
                stats
            };
        } catch (err) {
            logger.error('Error getting payment stats:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Get timer accuracy metrics
     */
    async getTimerAccuracy() {
        try {
            // Get completed sessions from the last 24 hours
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const { data: sessions, error } = await supabase
                .from('table_sessions')
                .select('timer_started_at, timer_ends_at, session_end, status')
                .gte('session_end', yesterday.toISOString())
                .in('status', ['expired', 'completed']);

            if (error) {
                throw error;
            }

            let totalDeviation = 0;
            let expiredCount = 0;

            sessions.forEach(session => {
                if (session.status === 'expired' && session.timer_ends_at && session.session_end) {
                    const expectedEnd = new Date(session.timer_ends_at);
                    const actualEnd = new Date(session.session_end);
                    const deviation = Math.abs(actualEnd - expectedEnd) / 1000; // seconds
                    
                    totalDeviation += deviation;
                    expiredCount++;
                }
            });

            const avgDeviation = expiredCount > 0 ? (totalDeviation / expiredCount).toFixed(2) : 0;

            return {
                success: true,
                sessionsAnalyzed: sessions.length,
                expiredSessions: expiredCount,
                averageDeviationSeconds: avgDeviation,
                accuracy: expiredCount > 0 ? `${(100 - (avgDeviation / 60) * 100).toFixed(2)}%` : '100%'
            };
        } catch (err) {
            logger.error('Error getting timer accuracy:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics.requests = {
            total: 0,
            success: 0,
            errors: 0,
            lastReset: new Date()
        };
        this.metrics.payments = {
            total: 0,
            success: 0,
            failed: 0,
            lastReset: new Date()
        };
        
        logger.info('Metrics reset');
    }
}

// Export singleton instance
module.exports = new MonitoringService();
