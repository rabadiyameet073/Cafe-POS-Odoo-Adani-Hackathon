const TimerService = require('../services/TimerService');
const { formatResponse } = require('../utils/helpers');
const { catchAsync, NotFoundError, ValidationError, AuthorizationError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Get all active timers
 * GET /api/timers/active
 * Requirements: 12.1
 */
const getActiveTimers = catchAsync(async (req, res) => {
    const result = await TimerService.getActiveTimers();

    if (!result.success) {
        throw new Error(result.error);
    }

    res.status(200).json(formatResponse(true, 'Active timers retrieved', {
        timers: result.timers,
        count: result.count
    }));
});

/**
 * Reset timer to 39 minutes
 * POST /api/timers/reset
 * Requirements: 14.1
 */
const resetTimer = catchAsync(async (req, res) => {
    const { session_id, admin_id } = req.body;

    if (!session_id) {
        throw new ValidationError('session_id is required');
    }

    const adminId = admin_id || req.user.id;

    const result = await TimerService.resetTimer(session_id, adminId);

    if (!result.success) {
        throw new Error(result.error);
    }

    logger.info(`Timer reset for session ${session_id} by admin ${req.user.email}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('timer_reset', {
            session_id: session_id,
            new_timer_ends_at: result.newTimerEndsAt
        });
    }

    res.status(200).json(formatResponse(true, 'Timer reset successfully', {
        success: true,
        new_timer_ends_at: result.newTimerEndsAt
    }));
});

/**
 * Extend timer by specified minutes
 * POST /api/timers/extend
 * Requirements: 14.2
 */
const extendTimer = catchAsync(async (req, res) => {
    const { session_id, extension_minutes, admin_id } = req.body;

    if (!session_id) {
        throw new ValidationError('session_id is required');
    }

    if (!extension_minutes || extension_minutes <= 0) {
        throw new ValidationError('extension_minutes must be a positive number');
    }

    const adminId = admin_id || req.user.id;

    const result = await TimerService.extendTimer(
        session_id,
        parseInt(extension_minutes),
        adminId
    );

    if (!result.success) {
        throw new Error(result.error);
    }

    logger.info(`Timer extended for session ${session_id} by ${extension_minutes} minutes`);

    const io = req.app.get('io');
    if (io) {
        io.emit('timer_extended', {
            session_id: session_id,
            extension_minutes: extension_minutes,
            new_timer_ends_at: result.newTimerEndsAt
        });
    }

    res.status(200).json(formatResponse(true, 'Timer extended successfully', {
        success: true,
        extension_minutes: result.extensionMinutes,
        new_timer_ends_at: result.newTimerEndsAt
    }));
});

/**
 * Stop timer and immediately free table
 * POST /api/timers/stop
 * Requirements: 14.3, 14.4
 */
const stopTimer = catchAsync(async (req, res) => {
    const { session_id, admin_id, reason } = req.body;

    if (!session_id) {
        throw new ValidationError('session_id is required');
    }

    const adminId = admin_id || req.user.id;

    const result = await TimerService.stopTimer(
        session_id,
        adminId,
        reason || 'Admin stopped timer'
    );

    if (!result.success) {
        throw new Error(result.error);
    }

    logger.info(`Timer stopped and table freed for session ${session_id} by admin ${req.user.email}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('timer_stopped', {
            session_id: session_id,
            table_id: result.tableId,
            reason: result.reason
        });

        io.emit('table_status_changed', {
            table_id: result.tableId,
            status: 'available'
        });
    }

    res.status(200).json(formatResponse(true, 'Timer stopped and table freed', {
        success: true,
        message: result.reason
    }));
});

module.exports = {
    getActiveTimers,
    resetTimer,
    extendTimer,
    stopTimer
};
