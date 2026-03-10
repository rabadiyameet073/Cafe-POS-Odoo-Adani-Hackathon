/**
 * Query Optimizer Utilities
 * 
 * Provides optimized query patterns and helpers for common database operations.
 * Implements best practices for Supabase/PostgreSQL query optimization.
 * 
 * Performance NFR 1, 2, 3
 */

const { supabase } = require('../config/supabase');
const logger = require('./logger');

/**
 * Batch fetch records by IDs (reduces N+1 queries)
 * @param {string} table - Table name
 * @param {Array<string>} ids - Array of UUIDs
 * @param {string} columns - Columns to select
 * @returns {Promise<Array>} Records
 */
async function batchFetchByIds(table, ids, columns = '*') {
    if (!ids || ids.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from(table)
        .select(columns)
        .in('id', ids);

    if (error) {
        logger.error(`Error batch fetching from ${table}:`, error);
        throw error;
    }

    return data || [];
}

/**
 * Get active table sessions with optimized joins
 * @param {object} filters - Optional filters
 * @returns {Promise<Array>} Active sessions
 */
async function getActiveTableSessions(filters = {}) {
    let query = supabase
        .from('table_sessions')
        .select(`
            id,
            table_id,
            table_number,
            table_token,
            status,
            timer_started_at,
            timer_ends_at,
            timer_status,
            session_start,
            tables!inner(
                table_number,
                floor_id,
                status,
                floors(name)
            )
        `)
        .eq('status', 'active');

    // Apply optional filters
    if (filters.floorId) {
        query = query.eq('floor_id', filters.floorId);
    }
    if (filters.timerStatus) {
        query = query.eq('timer_status', filters.timerStatus);
    }

    const { data, error } = await query.order('session_start', { ascending: true });

    if (error) {
        logger.error('Error fetching active sessions:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get orders with items in a single query (avoids N+1)
 * @param {object} filters - Filters (tableToken, sessionId, status)
 * @param {number} limit - Max records to return
 * @returns {Promise<Array>} Orders with items
 */
async function getOrdersWithItems(filters = {}, limit = 50) {
    let query = supabase
        .from('orders')
        .select(`
            *,
            order_items(*)
        `)
        .eq('is_deleted', false);

    // Apply filters
    if (filters.tableToken) {
        query = query.eq('table_token', filters.tableToken);
    }
    if (filters.sessionId) {
        query = query.eq('session_id', filters.sessionId);
    }
    if (filters.status) {
        if (Array.isArray(filters.status)) {
            query = query.in('status', filters.status);
        } else {
            query = query.eq('status', filters.status);
        }
    }
    if (filters.paymentStatus) {
        query = query.eq('payment_status', filters.paymentStatus);
    }

    query = query
        .order('created_at', { ascending: false })
        .limit(limit);

    const { data, error } = await query;

    if (error) {
        logger.error('Error fetching orders with items:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get kitchen orders with optimized filtering
 * @param {Array<string>} statuses - Status filter (default: active statuses)
 * @param {number} limit - Max records
 * @returns {Promise<Array>} Kitchen orders
 */
async function getActiveKitchenOrders(statuses = ['received', 'preparing', 'ready'], limit = 100) {
    const { data, error } = await supabase
        .from('kitchen_orders')
        .select('*')
        .in('status', statuses)
        .order('received_at', { ascending: true })
        .limit(limit);

    if (error) {
        logger.error('Error fetching kitchen orders:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get pending cashier payment requests (optimized)
 * @param {number} limit - Max records
 * @returns {Promise<Array>} Payment requests
 */
async function getPendingPaymentRequests(limit = 50) {
    const { data, error } = await supabase
        .from('cashier_payment_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) {
        logger.error('Error fetching payment requests:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get expiring timers (for 5-minute warning)
 * @param {number} warningMinutes - Minutes before expiry to warn
 * @returns {Promise<Array>} Sessions expiring soon
 */
async function getExpiringTimers(warningMinutes = 5) {
    const now = new Date();
    const warningTime = new Date(now.getTime() + warningMinutes * 60 * 1000);

    const { data, error } = await supabase
        .from('table_sessions')
        .select(`
            id,
            table_id,
            table_number,
            table_token,
            timer_ends_at,
            tables(table_number, floor_id, floors(name))
        `)
        .eq('status', 'active')
        .eq('timer_status', 'running')
        .lte('timer_ends_at', warningTime.toISOString())
        .gt('timer_ends_at', now.toISOString())
        .order('timer_ends_at', { ascending: true });

    if (error) {
        logger.error('Error fetching expiring timers:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get expired timers (for auto-release)
 * @returns {Promise<Array>} Expired sessions
 */
async function getExpiredTimers() {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('table_sessions')
        .select('id, table_id, table_token, table_number, timer_ends_at')
        .eq('status', 'active')
        .eq('timer_status', 'running')
        .lt('timer_ends_at', now);

    if (error) {
        logger.error('Error fetching expired timers:', error);
        throw error;
    }

    return data || [];
}

/**
 * Bulk update records (more efficient than individual updates)
 * @param {string} table - Table name
 * @param {Array<object>} updates - Array of {id, ...fields}
 * @returns {Promise<number>} Number of updated records
 */
async function bulkUpdate(table, updates) {
    if (!updates || updates.length === 0) {
        return 0;
    }

    let successCount = 0;

    // PostgreSQL doesn't support bulk updates directly via Supabase
    // So we batch them in a transaction-like manner
    for (const update of updates) {
        const { id, ...fields } = update;
        
        const { error } = await supabase
            .from(table)
            .update(fields)
            .eq('id', id);

        if (!error) {
            successCount++;
        } else {
            logger.error(`Error updating ${table} record ${id}:`, error);
        }
    }

    return successCount;
}

/**
 * Count records with filters (optimized with head: true)
 * @param {string} table - Table name
 * @param {object} filters - Filter conditions
 * @returns {Promise<number>} Count
 */
async function countRecords(table, filters = {}) {
    let query = supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            query = query.in(key, value);
        } else {
            query = query.eq(key, value);
        }
    });

    const { count, error } = await query;

    if (error) {
        logger.error(`Error counting ${table}:`, error);
        throw error;
    }

    return count || 0;
}

/**
 * Get table availability summary by floor (optimized aggregation)
 * @returns {Promise<Array>} Floor availability stats
 */
async function getTableAvailabilitySummary() {
    const { data, error } = await supabase
        .from('tables')
        .select(`
            floor_id,
            status,
            floors(name, display_order)
        `)
        .eq('is_active', true);

    if (error) {
        logger.error('Error fetching table availability:', error);
        throw error;
    }

    // Aggregate by floor
    const summary = {};
    
    (data || []).forEach(table => {
        const floorId = table.floor_id;
        const floorName = table.floors?.name || 'Unknown';
        
        if (!summary[floorId]) {
            summary[floorId] = {
                floorId,
                floorName,
                displayOrder: table.floors?.display_order || 0,
                available: 0,
                occupied: 0,
                reserved: 0,
                cleaning: 0,
                total: 0
            };
        }
        
        summary[floorId][table.status]++;
        summary[floorId].total++;
    });

    return Object.values(summary).sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Optimize subscription query with proper filters
 * @param {string} table - Table name
 * @param {object} filters - Filter conditions
 * @returns {object} Optimized query builder
 */
function buildOptimizedSubscription(table, filters = {}) {
    let query = supabase
        .from(table)
        .select('*');

    // Apply filters to reduce subscription payload
    Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            query = query.in(key, value);
        } else {
            query = query.eq(key, value);
        }
    });

    return query;
}

module.exports = {
    batchFetchByIds,
    getActiveTableSessions,
    getOrdersWithItems,
    getActiveKitchenOrders,
    getPendingPaymentRequests,
    getExpiringTimers,
    getExpiredTimers,
    bulkUpdate,
    countRecords,
    getTableAvailabilitySummary,
    buildOptimizedSubscription
};
