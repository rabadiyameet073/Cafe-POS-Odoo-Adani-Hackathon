/**
 * TableService
 * 
 * Manages table operations including selection, release, and availability queries.
 * 
 * Requirements: 2.2, 2.3, 13.1, 13.2
 */

const { supabase } = require('../config/supabase');
const TableTokenService = require('./TableTokenService');
const logger = require('../utils/logger');

class TableService {
    /**
     * Select a table and generate a token for the customer session
     * @param {string} tableId - UUID of the table to select
     * @param {string} customerId - UUID of the customer (optional)
     * @param {string} customerName - Name of the customer (optional)
     * @param {string} ipAddress - IP address for rate limiting (optional)
     * @returns {Promise<Object>} Result with token and session info
     */
    async selectTable(tableId, customerId = null, customerName = null, ipAddress = 'unknown') {
        try {
            // Check if table exists and is available
            const { data: table, error: tableError } = await supabase
                .from('tables')
                .select('*, floors(name)')
                .eq('id', tableId)
                .single();

            if (tableError || !table) {
                return {
                    success: false,
                    error: 'Table not found'
                };
            }

            if (table.status !== 'available') {
                return {
                    success: false,
                    error: `Table is ${table.status}. Please select an available table.`
                };
            }

            // Generate unique token with rate limiting
            const tokenResult = await TableTokenService.generateUniqueToken(10, ipAddress);
            
            if (!tokenResult.success) {
                return {
                    success: false,
                    error: tokenResult.error,
                    retryAfter: tokenResult.retryAfter
                };
            }

            const { token: tableToken, signature, timestamp } = tokenResult;
            const now = new Date().toISOString();

            // Create table session with token signature
            const { data: session, error: sessionError } = await supabase
                .from('table_sessions')
                .insert({
                    table_id: tableId,
                    table_number: table.table_number,
                    floor_id: table.floor_id,
                    table_token: tableToken,
                    token_signature: signature,
                    token_created_at: timestamp,
                    customer_name: customerName,
                    status: 'active',
                    session_start: now,
                    timer_status: 'not_started',
                    created_at: now,
                    updated_at: now
                })
                .select()
                .single();

            if (sessionError) {
                logger.error('Error creating table session:', sessionError);
                return {
                    success: false,
                    error: 'Failed to create session'
                };
            }

            // Update table status to occupied
            const { error: updateError } = await supabase
                .from('tables')
                .update({
                    status: 'occupied',
                    qr_code_token: tableToken,
                    current_session_id: session.id,
                    occupied_since: now,
                    updated_at: now
                })
                .eq('id', tableId);

            if (updateError) {
                logger.error('Error updating table status:', updateError);
                // Rollback: delete the session
                await supabase
                    .from('table_sessions')
                    .delete()
                    .eq('id', session.id);
                
                return {
                    success: false,
                    error: 'Failed to occupy table'
                };
            }

            logger.info(`Table ${table.table_number} selected with token ${tableToken}`);

            return {
                success: true,
                tableToken: tableToken,
                sessionId: session.id,
                tableNumber: table.table_number,
                tableId: tableId,
                floorId: table.floor_id,
                floorName: table.floors?.name,
                rateLimitRemaining: tokenResult.rateLimitRemaining
            };
        } catch (err) {
            logger.error('Error in selectTable:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Release a table and archive the session
     * @param {string} tableId - UUID of the table to release
     * @param {string} reason - Reason for release (timer_expired, force_freed, completed)
     * @param {string} adminId - UUID of admin who freed the table (optional)
     * @returns {Promise<Object>} Result object
     */
    async releaseTable(tableId, reason = 'completed', adminId = null) {
        try {
            const now = new Date().toISOString();

            // Get current session
            const { data: table, error: tableError } = await supabase
                .from('tables')
                .select('current_session_id, table_number, qr_code_token')
                .eq('id', tableId)
                .single();

            if (tableError || !table) {
                return {
                    success: false,
                    error: 'Table not found'
                };
            }

            if (!table.current_session_id) {
                return {
                    success: false,
                    error: 'Table has no active session'
                };
            }

            // Update table status to available
            const { error: updateTableError } = await supabase
                .from('tables')
                .update({
                    status: 'available',
                    qr_code_token: null,
                    current_session_id: null,
                    occupied_since: null,
                    occupied_until: null,
                    updated_at: now
                })
                .eq('id', tableId);

            if (updateTableError) {
                logger.error('Error updating table status:', updateTableError);
                return {
                    success: false,
                    error: 'Failed to release table'
                };
            }

            // Update session status
            const sessionStatus = reason === 'timer_expired' ? 'expired' : 
                                 reason === 'force_freed' ? 'force_freed' : 'completed';

            const sessionUpdate = {
                status: sessionStatus,
                session_end: now,
                updated_at: now
            };

            if (adminId) {
                sessionUpdate.freed_by = adminId;
                sessionUpdate.freed_reason = reason;
            }

            if (reason === 'timer_expired') {
                sessionUpdate.timer_status = 'expired';
            }

            const { error: sessionError } = await supabase
                .from('table_sessions')
                .update(sessionUpdate)
                .eq('id', table.current_session_id);

            if (sessionError) {
                logger.error('Error updating session:', sessionError);
            }

            // Update timer log if exists
            await supabase
                .from('table_timer_logs')
                .update({
                    status: reason === 'timer_expired' ? 'expired' : 'stopped',
                    stopped_at: now,
                    stopped_by: adminId,
                    updated_at: now
                })
                .eq('session_id', table.current_session_id)
                .eq('status', 'running');

            logger.info(`Table ${table.table_number} released. Reason: ${reason}`);

            return {
                success: true,
                tableId: tableId,
                sessionId: table.current_session_id,
                reason: reason
            };
        } catch (err) {
            logger.error('Error in releaseTable:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Get all available tables for a floor
     * @param {string} floorId - UUID of the floor (optional, returns all if not provided)
     * @returns {Promise<Object>} Result with available tables
     */
    async getAvailableTables(floorId = null) {
        try {
            let query = supabase
                .from('tables')
                .select('*, floors(id, name)')
                .eq('status', 'available')
                .eq('is_active', true)
                .order('table_number', { ascending: true });

            if (floorId) {
                query = query.eq('floor_id', floorId);
            }

            const { data: tables, error } = await query;

            if (error) {
                logger.error('Error fetching available tables:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            return {
                success: true,
                tables: tables || [],
                count: tables?.length || 0
            };
        } catch (err) {
            logger.error('Error in getAvailableTables:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Validate a table token
     * @param {string} token - Token to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateToken(token) {
        return await TableTokenService.validateToken(token);
    }

    /**
     * Get table by token
     * @param {string} token - Table token
     * @returns {Promise<Object>} Table and session info
     */
    async getTableByToken(token) {
        try {
            const validation = await this.validateToken(token);
            
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.reason
                };
            }

            const { data: table, error } = await supabase
                .from('tables')
                .select('*, floors(name)')
                .eq('id', validation.tableId)
                .single();

            if (error || !table) {
                return {
                    success: false,
                    error: 'Table not found'
                };
            }

            return {
                success: true,
                table: table,
                session: validation.session
            };
        } catch (err) {
            logger.error('Error in getTableByToken:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Get all tables for a floor (regardless of status)
     * @param {string} floorId - UUID of the floor
     * @returns {Promise<Object>} Result with all tables
     */
    async getTablesByFloor(floorId) {
        try {
            const { data: tables, error } = await supabase
                .from('tables')
                .select('*, table_sessions!current_session_id(*)')
                .eq('floor_id', floorId)
                .eq('is_active', true)
                .order('table_number', { ascending: true });

            if (error) {
                logger.error('Error fetching tables by floor:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            return {
                success: true,
                tables: tables || [],
                count: tables?.length || 0
            };
        } catch (err) {
            logger.error('Error in getTablesByFloor:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }
}

module.exports = new TableService();
