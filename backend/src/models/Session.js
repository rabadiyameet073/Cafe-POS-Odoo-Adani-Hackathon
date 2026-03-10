/**
 * Session Model
 * 
 * Database operations for pos_sessions table.
 */

const { supabase } = require('../config/supabase');
const { generateSessionNumber } = require('../utils/helpers');
const logger = require('../utils/logger');

const Session = {
    /**
     * Find all sessions with optional filters
     */
    async findAll(filters = {}) {
        let query = supabase
            .from('pos_sessions')
            .select('*, users(id, full_name, email)')
            .order('opened_at', { ascending: false });

        if (filters.user_id) {
            query = query.eq('user_id', filters.user_id);
        }

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },

    /**
     * Find active session for a user
     */
    async findActiveForUser(userId) {
        const { data, error } = await supabase
            .from('pos_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'open')
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Find any open session
     */
    async findAnyActive() {
        const { data, error } = await supabase
            .from('pos_sessions')
            .select('*, users(id, full_name, email)')
            .eq('status', 'open')
            .order('opened_at', { ascending: false })
            .limit(1);

        if (error) throw error;
        return data && data.length > 0 ? data[0] : null;
    },

    /**
     * Find session by ID
     */
    async findById(id) {
        const { data, error } = await supabase
            .from('pos_sessions')
            .select('*, users(id, full_name, email)')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Open a new session
     */
    async open(sessionData) {
        // Generate session number if not provided
        if (!sessionData.session_number) {
            sessionData.session_number = generateSessionNumber();
        }

        const { data, error } = await supabase
            .from('pos_sessions')
            .insert({
                ...sessionData,
                status: 'open',
                opened_at: new Date().toISOString()
            })
            .select('*, users(id, full_name, email)')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Close a session
     */
    async close(id, closingData = {}) {
        const { data, error } = await supabase
            .from('pos_sessions')
            .update({
                status: 'closed',
                closing_balance: closingData.closing_balance,
                notes: closingData.notes,
                closed_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('*, users(id, full_name, email)')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get session statistics
     */
    async getStats(sessionId) {
        // Get orders count and totals
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('total_amount, status')
            .eq('session_id', sessionId);

        if (ordersError) throw ordersError;

        // Get payments
        const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('amount, status, payment_method_id, payment_methods(name, display_name)')
            .eq('session_id', sessionId);

        if (paymentsError) throw paymentsError;

        // Calculate stats
        const completedOrders = orders.filter(o => o.status === 'completed');
        const completedPayments = payments.filter(p => p.status === 'completed');

        const stats = {
            total_orders: orders.length,
            completed_orders: completedOrders.length,
            total_revenue: completedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
            total_payments: completedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
            payment_breakdown: {}
        };

        // Group payments by method
        completedPayments.forEach(p => {
            const methodName = p.payment_methods?.display_name || 'Unknown';
            if (!stats.payment_breakdown[methodName]) {
                stats.payment_breakdown[methodName] = { count: 0, total: 0 };
            }
            stats.payment_breakdown[methodName].count++;
            stats.payment_breakdown[methodName].total += parseFloat(p.amount);
        });

        return stats;
    }
};

module.exports = Session;
