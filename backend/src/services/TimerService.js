/**
 * TimerService
 * 
 * Manages 39-minute table timers for automated table management.
 * Handles timer start, reset, extend, stop, and expiration checking.
 * 
 * Requirements: 11.1, 11.2, 13.1, 14.1, 14.2, 14.3
 */

const { supabase } = require('../config/supabase');
const TableService = require('./TableService');
const logger = require('../utils/logger');
const GracefulDegradationService = require('./GracefulDegradationService');

class TimerService {
    constructor() {
        this.TIMER_DURATION_MINUTES = 39;
        this.checkInterval = null;
    }

    /**
     * Start a 39-minute timer for a table session
     * @param {string} tableId - UUID of the table
     * @param {string} sessionId - UUID of the table session
     * @returns {Promise<Object>} Result with timer details
     */
    async startTimer(tableId, sessionId) {
        try {
            const now = new Date();
            const endsAt = new Date(now.getTime() + this.TIMER_DURATION_MINUTES * 60 * 1000);

            // Update table_sessions
            const { error: sessionError } = await supabase
                .from('table_sessions')
                .update({
                    timer_started_at: now.toISOString(),
                    timer_ends_at: endsAt.toISOString(),
                    timer_status: 'running',
                    updated_at: now.toISOString()
                })
                .eq('id', sessionId);

            if (sessionError) {
                logger.error('Error starting timer in session:', sessionError);
                return {
                    success: false,
                    error: 'Failed to start timer'
                };
            }

            // Update tables
            const { error: tableError } = await supabase
                .from('tables')
                .update({
                    occupied_until: endsAt.toISOString(),
                    updated_at: now.toISOString()
                })
                .eq('id', tableId);

            if (tableError) {
                logger.error('Error updating table timer:', tableError);
            }

            // Get session details for logging
            const { data: session } = await supabase
                .from('table_sessions')
                .select('table_token')
                .eq('id', sessionId)
                .single();

            // Create timer log
            const { error: logError } = await supabase
                .from('table_timer_logs')
                .insert({
                    table_id: tableId,
                    session_id: sessionId,
                    table_token: session?.table_token,
                    duration_minutes: this.TIMER_DURATION_MINUTES,
                    timer_started_at: now.toISOString(),
                    timer_ends_at: endsAt.toISOString(),
                    status: 'running',
                    created_at: now.toISOString(),
                    updated_at: now.toISOString()
                });

            if (logError) {
                logger.error('Error creating timer log:', logError);
                // Don't fail the operation if logging fails
            }

            logger.info(`Timer started for session ${sessionId}, ends at ${endsAt.toISOString()}`);

            return {
                success: true,
                timerStartedAt: now.toISOString(),
                timerEndsAt: endsAt.toISOString(),
                durationMinutes: this.TIMER_DURATION_MINUTES
            };
        } catch (err) {
            logger.error('Error in startTimer:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Get all active timers
     * @returns {Promise<Object>} Result with active timers
     */
    async getActiveTimers() {
        try {
            const { data: sessions, error } = await supabase
                .from('table_sessions')
                .select(`
                    id,
                    table_id,
                    table_number,
                    timer_started_at,
                    timer_ends_at,
                    timer_status,
                    tables(table_number, floor_id, floors(name))
                `)
                .eq('timer_status', 'running')
                .eq('status', 'active')
                .order('timer_ends_at', { ascending: true });

            if (error) {
                logger.error('Error fetching active timers:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            // Calculate remaining time for each timer
            const now = new Date();
            const timers = (sessions || []).map(session => {
                const endsAt = new Date(session.timer_ends_at);
                const remainingMs = Math.max(0, endsAt - now);
                const remainingSeconds = Math.floor(remainingMs / 1000);

                return {
                    sessionId: session.id,
                    tableId: session.table_id,
                    tableNumber: session.table_number,
                    timerStartedAt: session.timer_started_at,
                    timerEndsAt: session.timer_ends_at,
                    remainingSeconds: remainingSeconds,
                    remainingMinutes: Math.floor(remainingSeconds / 60),
                    isExpiring: remainingSeconds < 300 // Less than 5 minutes
                };
            });

            return {
                success: true,
                timers: timers,
                count: timers.length
            };
        } catch (err) {
            logger.error('Error in getActiveTimers:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Check for expired timers and release tables
     * This should be called periodically (every minute)
     * Respects manual table mode for graceful degradation
     * @returns {Promise<Object>} Result with released tables
     */
    async checkExpiredTimers() {
        try {
            // Check if manual table mode is enabled (graceful degradation)
            if (GracefulDegradationService.isManualTableMode()) {
                logger.info('Manual table mode active - skipping automatic timer expiration');
                return {
                    success: true,
                    releasedCount: 0,
                    releasedTables: [],
                    manualMode: true
                };
            }

            const now = new Date();

            // Find expired sessions
            const { data: expiredSessions, error } = await supabase
                .from('table_sessions')
                .select('id, table_id, table_token, table_number')
                .eq('timer_status', 'running')
                .eq('status', 'active')
                .lt('timer_ends_at', now.toISOString());

            if (error) {
                logger.error('Error finding expired timers:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            if (!expiredSessions || expiredSessions.length === 0) {
                return {
                    success: true,
                    releasedCount: 0,
                    releasedTables: []
                };
            }

            const releasedTables = [];

            // Release each expired table
            for (const session of expiredSessions) {
                const result = await TableService.releaseTable(
                    session.table_id,
                    'timer_expired',
                    null
                );

                if (result.success) {
                    releasedTables.push({
                        tableId: session.table_id,
                        tableNumber: session.table_number,
                        sessionId: session.id
                    });
                    logger.info(`Auto-released table ${session.table_number} (timer expired)`);
                }
            }

            return {
                success: true,
                releasedCount: releasedTables.length,
                releasedTables: releasedTables
            };
        } catch (err) {
            logger.error('Error in checkExpiredTimers:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Reset timer to 39 minutes from now
     * @param {string} sessionId - UUID of the session
     * @param {string} adminId - UUID of the admin
     * @returns {Promise<Object>} Result object
     */
    async resetTimer(sessionId, adminId) {
        try {
            const now = new Date();
            const newEndsAt = new Date(now.getTime() + this.TIMER_DURATION_MINUTES * 60 * 1000);

            // Get session details
            const { data: session, error: fetchError } = await supabase
                .from('table_sessions')
                .select('table_id, table_number')
                .eq('id', sessionId)
                .single();

            if (fetchError || !session) {
                return {
                    success: false,
                    error: 'Session not found'
                };
            }

            // Update session
            const { error: updateError } = await supabase
                .from('table_sessions')
                .update({
                    timer_ends_at: newEndsAt.toISOString(),
                    timer_status: 'running',
                    updated_at: now.toISOString()
                })
                .eq('id', sessionId);

            if (updateError) {
                logger.error('Error resetting timer:', updateError);
                return {
                    success: false,
                    error: 'Failed to reset timer'
                };
            }

            // Update table
            await supabase
                .from('tables')
                .update({
                    occupied_until: newEndsAt.toISOString(),
                    updated_at: now.toISOString()
                })
                .eq('id', session.table_id);

            // Log admin action
            await supabase
                .from('admin_logs')
                .insert({
                    admin_id: adminId,
                    action_type: 'reset_timer',
                    target_table: 'table_sessions',
                    target_id: sessionId,
                    details: {
                        tableNumber: session.table_number,
                        newEndsAt: newEndsAt.toISOString()
                    },
                    created_at: now.toISOString()
                });

            logger.info(`Timer reset for session ${sessionId} by admin ${adminId}`);

            return {
                success: true,
                sessionId: sessionId,
                newTimerEndsAt: newEndsAt.toISOString()
            };
        } catch (err) {
            logger.error('Error in resetTimer:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Extend timer by specified minutes
     * @param {string} sessionId - UUID of the session
     * @param {number} minutes - Minutes to add
     * @param {string} adminId - UUID of the admin
     * @returns {Promise<Object>} Result object
     */
    async extendTimer(sessionId, minutes, adminId) {
        try {
            const now = new Date();

            // Get current session
            const { data: session, error: fetchError } = await supabase
                .from('table_sessions')
                .select('table_id, table_number, timer_ends_at')
                .eq('id', sessionId)
                .single();

            if (fetchError || !session) {
                return {
                    success: false,
                    error: 'Session not found'
                };
            }

            const currentEndsAt = new Date(session.timer_ends_at);
            const newEndsAt = new Date(currentEndsAt.getTime() + minutes * 60 * 1000);

            // Update session
            const { error: updateError } = await supabase
                .from('table_sessions')
                .update({
                    timer_ends_at: newEndsAt.toISOString(),
                    timer_status: 'extended',
                    updated_at: now.toISOString()
                })
                .eq('id', sessionId);

            if (updateError) {
                logger.error('Error extending timer:', updateError);
                return {
                    success: false,
                    error: 'Failed to extend timer'
                };
            }

            // Update table
            await supabase
                .from('tables')
                .update({
                    occupied_until: newEndsAt.toISOString(),
                    updated_at: now.toISOString()
                })
                .eq('id', session.table_id);

            // Update timer log
            await supabase
                .from('table_timer_logs')
                .update({
                    extended_by: adminId,
                    extended_at: now.toISOString(),
                    extension_minutes: supabase.raw(`extension_minutes + ${minutes}`),
                    timer_ends_at: newEndsAt.toISOString(),
                    updated_at: now.toISOString()
                })
                .eq('session_id', sessionId)
                .eq('status', 'running');

            // Log admin action
            await supabase
                .from('admin_logs')
                .insert({
                    admin_id: adminId,
                    action_type: 'extend_timer',
                    target_table: 'table_sessions',
                    target_id: sessionId,
                    details: {
                        tableNumber: session.table_number,
                        extensionMinutes: minutes,
                        newEndsAt: newEndsAt.toISOString()
                    },
                    created_at: now.toISOString()
                });

            logger.info(`Timer extended for session ${sessionId} by ${minutes} minutes`);

            return {
                success: true,
                sessionId: sessionId,
                extensionMinutes: minutes,
                newTimerEndsAt: newEndsAt.toISOString()
            };
        } catch (err) {
            logger.error('Error in extendTimer:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Stop timer and immediately free table
     * @param {string} sessionId - UUID of the session
     * @param {string} adminId - UUID of the admin
     * @param {string} reason - Reason for stopping
     * @returns {Promise<Object>} Result object
     */
    async stopTimer(sessionId, adminId, reason = 'Admin stopped') {
        try {
            const now = new Date();

            // Get session details
            const { data: session, error: fetchError } = await supabase
                .from('table_sessions')
                .select('table_id, table_number')
                .eq('id', sessionId)
                .single();

            if (fetchError || !session) {
                return {
                    success: false,
                    error: 'Session not found'
                };
            }

            // Release the table
            const releaseResult = await TableService.releaseTable(
                session.table_id,
                'force_freed',
                adminId
            );

            if (!releaseResult.success) {
                return releaseResult;
            }

            // Update timer log
            await supabase
                .from('table_timer_logs')
                .update({
                    stopped_by: adminId,
                    stopped_at: now.toISOString(),
                    status: 'stopped',
                    updated_at: now.toISOString()
                })
                .eq('session_id', sessionId)
                .in('status', ['running', 'extended']);

            // Log admin action
            await supabase
                .from('admin_logs')
                .insert({
                    admin_id: adminId,
                    action_type: 'stop_timer_free_table',
                    target_table: 'table_sessions',
                    target_id: sessionId,
                    details: {
                        tableNumber: session.table_number,
                        reason: reason
                    },
                    created_at: now.toISOString()
                });

            logger.info(`Timer stopped and table freed for session ${sessionId} by admin ${adminId}`);

            return {
                success: true,
                sessionId: sessionId,
                tableId: session.table_id,
                reason: reason
            };
        } catch (err) {
            logger.error('Error in stopTimer:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Start background job to check expired timers every minute
     */
    startBackgroundJob() {
        if (this.checkInterval) {
            logger.warn('Timer background job already running');
            return;
        }

        logger.info('Starting timer expiration background job (runs every minute)');

        // Run immediately
        this.checkExpiredTimers();

        // Then run every minute
        this.checkInterval = setInterval(() => {
            this.checkExpiredTimers();
        }, 60000); // 60 seconds
    }

    /**
     * Stop background job
     */
    stopBackgroundJob() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            logger.info('Timer background job stopped');
        }
    }
}

module.exports = new TimerService();
