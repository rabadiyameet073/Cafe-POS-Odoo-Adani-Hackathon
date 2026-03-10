/**
 * Monitoring Routes
 * 
 * API endpoints for system monitoring and health checks.
 * 
 * Requirements: Reliability NFR 1
 */

const express = require('express');
const router = express.Router();
const MonitoringService = require('../services/MonitoringService');
const AlertingService = require('../services/AlertingService');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

/**
 * GET /api/monitoring/health
 * Get system health metrics
 * Public endpoint for health checks
 */
router.get('/health', async (req, res, next) => {
    try {
        const metrics = await MonitoringService.getHealthMetrics();
        
        res.status(metrics.success ? 200 : 503).json({
            success: metrics.success,
            data: metrics
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/monitoring/metrics
 * Get detailed system metrics
 * Requires admin authentication
 */
router.get('/metrics', verifyToken, requireRole(['admin', 'manager']), async (req, res, next) => {
    try {
        const metrics = await MonitoringService.getHealthMetrics();
        
        res.json({
            success: true,
            data: metrics
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/monitoring/payments
 * Get payment statistics
 * Requires admin authentication
 */
router.get('/payments', verifyToken, requireRole(['admin', 'manager']), async (req, res, next) => {
    try {
        const timeRange = req.query.timeRange || '24h';
        const stats = await MonitoringService.getPaymentStats(timeRange);
        
        res.json({
            success: true,
            data: stats
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/monitoring/timers
 * Get timer accuracy metrics
 * Requires admin authentication
 */
router.get('/timers', verifyToken, requireRole(['admin', 'manager']), async (req, res, next) => {
    try {
        const accuracy = await MonitoringService.getTimerAccuracy();
        
        res.json({
            success: true,
            data: accuracy
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/monitoring/alerts
 * Get alert history
 * Requires admin authentication
 */
router.get('/alerts', verifyToken, requireRole(['admin', 'manager']), async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const alerts = await AlertingService.getAlertHistory(limit);
        
        res.json({
            success: true,
            data: alerts
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/monitoring/alerts/config
 * Get alert configuration
 * Requires admin authentication
 */
router.get('/alerts/config', verifyToken, requireRole(['admin']), async (req, res, next) => {
    try {
        const config = AlertingService.getConfiguration();
        
        res.json({
            success: true,
            data: config
        });
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /api/monitoring/alerts/config
 * Update alert thresholds
 * Requires admin authentication
 */
router.put('/alerts/config', verifyToken, requireRole(['admin']), async (req, res, next) => {
    try {
        const { thresholds } = req.body;
        
        if (!thresholds) {
            return res.status(400).json({
                success: false,
                message: 'Thresholds are required'
            });
        }

        AlertingService.updateThresholds(thresholds);
        
        logger.logAdminAction(
            req.user.id,
            req.user.email,
            'update_alert_thresholds',
            { thresholds }
        );

        res.json({
            success: true,
            message: 'Alert thresholds updated',
            data: AlertingService.getConfiguration()
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/monitoring/metrics/reset
 * Reset metrics counters
 * Requires admin authentication
 */
router.post('/metrics/reset', verifyToken, requireRole(['admin']), async (req, res, next) => {
    try {
        MonitoringService.resetMetrics();
        
        logger.logAdminAction(
            req.user.id,
            req.user.email,
            'reset_metrics',
            {}
        );

        res.json({
            success: true,
            message: 'Metrics reset successfully'
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
