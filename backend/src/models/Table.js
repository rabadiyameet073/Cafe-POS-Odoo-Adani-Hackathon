/**
 * Table Model
 * 
 * Database operations for tables table.
 */

const { supabase } = require('../config/supabase');
const { generateQRToken } = require('../utils/helpers');
const logger = require('../utils/logger');

const Table = {
    /**
     * Find all tables with optional filters
     */
    async findAll(filters = {}) {
        let query = supabase
            .from('tables')
            .select('*, floors(id, name)')
            .order('table_number', { ascending: true });

        if (typeof filters.is_active === 'boolean') {
            query = query.eq('is_active', filters.is_active);
        }

        if (filters.floor_id) {
            query = query.eq('floor_id', filters.floor_id);
        }

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },

    /**
     * Find tables by floor ID
     */
    async findByFloorId(floorId) {
        const { data, error } = await supabase
            .from('tables')
            .select('*')
            .eq('floor_id', floorId)
            .eq('is_active', true)
            .order('table_number', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Find available tables
     */
    async findAvailable() {
        const { data, error } = await supabase
            .from('tables')
            .select('*, floors(id, name)')
            .eq('status', 'available')
            .eq('is_active', true)
            .order('table_number', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Find table by ID
     */
    async findById(id) {
        const { data, error } = await supabase
            .from('tables')
            .select('*, floors(id, name)')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Find table by QR token
     */
    async findByQRToken(token) {
        const { data, error } = await supabase
            .from('tables')
            .select('*, floors(id, name)')
            .eq('qr_code_token', token)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Create a new table
     */
    async create(tableData) {
        // Generate QR token if not provided
        if (!tableData.qr_code_token) {
            tableData.qr_code_token = generateQRToken();
        }

        const { data, error } = await supabase
            .from('tables')
            .insert(tableData)
            .select('*, floors(id, name)')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a table
     */
    async update(id, updates) {
        const { data, error } = await supabase
            .from('tables')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*, floors(id, name)')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update table status
     */
    async updateStatus(id, status) {
        return this.update(id, { status });
    },

    /**
     * Delete a table (soft delete)
     */
    async delete(id) {
        return this.update(id, { is_active: false });
    },

    /**
     * Check if table has active orders
     */
    async hasActiveOrders(id) {
        const { count, error } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('table_id', id)
            .not('status', 'in', '("completed","cancelled")');

        if (error) throw error;
        return count > 0;
    }
};

module.exports = Table;
