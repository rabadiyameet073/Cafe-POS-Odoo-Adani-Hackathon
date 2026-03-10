const { supabase } = require('../config/supabase');
const { formatResponse } = require('../utils/helpers');
const { catchAsync, ValidationError } = require('../utils/errorHandler');
const { getAuditLogs } = require('../middleware/auditMiddleware');
const logger = require('../utils/logger');

/**
 * Get all occupied tables with timer and order info
 * GET /api/admin/occupied-tables
 * Requirements: 17.1, 17.2, 17.3
 */
const getOccupiedTables = catchAsync(async (req, res) => {
    const { data: tables, error } = await supabase
        .from('tables')
        .select(`
            id,
            table_number,
            floor_id,
            occupied_since,
            occupied_until,
            floors(name),
            table_sessions!current_session_id(
                id,
                timer_started_at,
                timer_ends_at,
                timer_status,
                session_start
            )
        `)
        .eq('status', 'occupied')
        .order('table_number', { ascending: true });

    if (error) {
        throw new Error('Failed to retrieve occupied tables');
    }

    // Calculate remaining time and get order status for each table
    const now = new Date();
    const enrichedTables = await Promise.all((tables || []).map(async (table) => {
        let timerRemaining = null;
        if (table.table_sessions && table.table_sessions.timer_ends_at) {
            const endsAt = new Date(table.table_sessions.timer_ends_at);
            const remainingMs = Math.max(0, endsAt - now);
            timerRemaining = Math.floor(remainingMs / 1000); // seconds
        }

        // Get order status for this table
        const { data: orders } = await supabase
            .from('orders')
            .select('status, payment_status')
            .eq('table_id', table.id)
            .eq('session_id', table.table_sessions?.id)
            .order('created_at', { ascending: false })
            .limit(1);

        const latestOrder = orders && orders.length > 0 ? orders[0] : null;

        return {
            table_id: table.id,
            table_number: table.table_number,
            floor_name: table.floors?.name,
            timer_remaining: timerRemaining,
            timer_ends_at: table.table_sessions?.timer_ends_at,
            order_status: latestOrder?.status || 'no_order',
            payment_status: latestOrder?.payment_status || 'no_payment',
            session_start: table.table_sessions?.session_start,
            occupied_since: table.occupied_since
        };
    }));

    res.status(200).json(formatResponse(true, 'Occupied tables retrieved', {
        tables: enrichedTables,
        count: enrichedTables.length
    }));
});

/**
 * Get dashboard summary statistics
 * GET /api/admin/dashboard-stats
 * Requirements: 17.1, 17.2
 */
const getDashboardStats = catchAsync(async (req, res) => {
    // Get table counts
    const { data: allTables } = await supabase
        .from('tables')
        .select('status')
        .eq('is_active', true);

    const totalTables = allTables?.length || 0;
    const occupiedTables = allTables?.filter(t => t.status === 'occupied').length || 0;
    const availableTables = allTables?.filter(t => t.status === 'available').length || 0;

    // Get pending payments count
    const { count: pendingPayments } = await supabase
        .from('cashier_payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    // Get active orders count
    const { count: activeOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending_payment', 'payment_requested', 'paid', 'received', 'preparing', 'ready']);

    // Get today's revenue
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data: todayPayments } = await supabase
        .from('payments')
        .select('amount')
        .in('status', ['approved', 'completed'])
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

    const todayRevenue = (todayPayments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);

    res.status(200).json(formatResponse(true, 'Dashboard statistics retrieved', {
        total_tables: totalTables,
        occupied_tables: occupiedTables,
        available_tables: availableTables,
        pending_payments: pendingPayments || 0,
        active_orders: activeOrders || 0,
        today_revenue: todayRevenue.toFixed(2)
    }));
});

/**
 * Get payment monitoring data with filters
 * GET /api/admin/payments/monitor
 * Requirements: 16.1, 16.2, 16.3, 16.5
 */
const monitorPayments = catchAsync(async (req, res) => {
    const { payment_method, status, from_date, to_date, limit = 100 } = req.query;

    let query = supabase
        .from('payments')
        .select(`
            id,
            order_id,
            table_number,
            table_token,
            amount,
            payment_method,
            status,
            cashier_name,
            created_at,
            payment_confirmed_at,
            orders(order_number)
        `)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

    if (payment_method) {
        query = query.eq('payment_method', payment_method);
    }

    if (status) {
        query = query.eq('status', status);
    }

    if (from_date) {
        query = query.gte('created_at', from_date);
    }

    if (to_date) {
        query = query.lte('created_at', to_date);
    }

    const { data: payments, error } = await query;

    if (error) {
        throw new Error('Failed to retrieve payments');
    }

    // Format payments for display
    const formattedPayments = (payments || []).map(payment => ({
        payment_id: payment.id,
        order_id: payment.order_id,
        order_number: payment.orders?.order_number,
        table_number: payment.table_number,
        amount: parseFloat(payment.amount),
        payment_method: payment.payment_method,
        status: payment.status,
        cashier_name: payment.cashier_name || (payment.payment_method === 'upi' ? 'UPI' : null),
        created_at: payment.created_at,
        confirmed_at: payment.payment_confirmed_at
    }));

    res.status(200).json(formatResponse(true, 'Payments retrieved', {
        payments: formattedPayments,
        count: formattedPayments.length
    }));
});

/**
 * Get audit logs
 * GET /api/admin/audit-logs
 * Requirements: Security NFR 3
 */
const getAdminAuditLogs = catchAsync(async (req, res) => {
    const { admin_id, action_type, target_table, from_date, to_date, limit = 100 } = req.query;

    const filters = {
        adminId: admin_id,
        actionType: action_type,
        targetTable: target_table,
        fromDate: from_date,
        toDate: to_date,
        limit: parseInt(limit)
    };

    const result = await getAuditLogs(filters);

    if (!result.success) {
        throw new Error('Failed to retrieve audit logs');
    }

    res.status(200).json(formatResponse(true, 'Audit logs retrieved', {
        logs: result.logs,
        count: result.logs.length
    }));
});

module.exports = {
    getOccupiedTables,
    getDashboardStats,
    monitorPayments,
    getAdminAuditLogs
};
