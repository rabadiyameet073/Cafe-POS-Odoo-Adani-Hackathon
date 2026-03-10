/**
 * System Routes
 * 
 * Provides system health and degradation status endpoints
 */

const express = require('express');
const router = express.Router();
const GracefulDegradationService = require('../services/GracefulDegradationService');
const { backupCriticalData, recoverPendingWAL } = require('../utils/transactionHelper');
const logger = require('../utils/logger');

/**
 * GET /api/system/status
 * Get system degradation status
 */
router.get('/status', async (req, res) => {
    try {
        const status = GracefulDegradationService.getStatus();
        const userMessage = GracefulDegradationService.getUserMessage();

        res.json({
            success: true,
            status,
            userMessage,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting system status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get system status'
        });
    }
});

/**
 * GET /api/system/health
 * Perform health checks and return results
 */
router.get('/health', async (req, res) => {
    try {
        const healthResult = await GracefulDegradationService.performHealthChecks();

        res.json({
            success: true,
            health: healthResult,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error performing health check:', error);
        res.status(500).json({
            success: false,
            error: 'Health check failed'
        });
    }
});

/**
 * GET /api/system/payment-methods
 * Get available payment methods based on degradation state
 */
router.get('/payment-methods', (req, res) => {
    try {
        const methods = GracefulDegradationService.getAvailablePaymentMethods();
        const cashOnlyMode = GracefulDegradationService.isCashOnlyMode();

        res.json({
            success: true,
            availableMethods: methods,
            cashOnlyMode,
            message: cashOnlyMode ? 'UPI payments temporarily unavailable' : null
        });
    } catch (error) {
        logger.error('Error getting payment methods:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get payment methods'
        });
    }
});

/**
 * POST /api/system/backup
 * Trigger manual backup (admin only)
 */
router.post('/backup', async (req, res) => {
    try {
        // TODO: Add admin authentication middleware
        const backupResult = await backupCriticalData();

        if (backupResult.success) {
            res.json({
                success: true,
                message: 'Backup completed successfully',
                ordersCount: backupResult.ordersCount,
                paymentsCount: backupResult.paymentsCount,
                backupFile: backupResult.backupFile
            });
        } else {
            res.status(500).json({
                success: false,
                error: backupResult.error
            });
        }
    } catch (error) {
        logger.error('Error creating backup:', error);
        res.status(500).json({
            success: false,
            error: 'Backup failed'
        });
    }
});

/**
 * GET /api/system/wal-status
 * Get write-ahead log status (admin only)
 */
router.get('/wal-status', async (req, res) => {
    try {
        // TODO: Add admin authentication middleware
        const walResult = await recoverPendingWAL();

        res.json({
            success: true,
            pendingCount: walResult.pendingCount,
            entries: walResult.entries || []
        });
    } catch (error) {
        logger.error('Error getting WAL status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get WAL status'
        });
    }
});

module.exports = router;
