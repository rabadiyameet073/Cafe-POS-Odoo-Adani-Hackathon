

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

const Payment = {
    async getAllMethods() {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .order('display_name', { ascending: true });

        if (error) throw error;
        return data;
    },

    async getEnabledMethods() {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('is_enabled', true)
            .order('display_name', { ascending: true });

        if (error) throw error;
        return data;
    },


    async getMethodById(id) {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },


    async createMethod(methodData) {
        const { data, error } = await supabase
            .from('payment_methods')
            .insert(methodData)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },


    async updateMethod(id, updates) {
        const { data, error } = await supabase
            .from('payment_methods')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },


    async toggleMethod(id) {
        const method = await this.getMethodById(id);
        if (!method) return null;

        return this.updateMethod(id, { is_enabled: !method.is_enabled });
    },

    async findAll(filters = {}) {
        let query = supabase
            .from('payments')
            .select('*, orders(id, order_number, table_number, table_token)')
            .order('created_at', { ascending: false });

        if (filters.order_id) {
            query = query.eq('order_id', filters.order_id);
        }

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },


    async findById(id) {
        const { data, error } = await supabase
            .from('payments')
            .select('*, orders(id, order_number, total_amount, table_number, table_token)')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },


    async findByOrderId(orderId) {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('order_id', orderId);

        if (error) throw error;
        return data;
    },

    async create(paymentData) {
        const { data, error } = await supabase
            .from('payments')
            .insert(paymentData)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('payments')
            .update(updates)
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },


    async complete(id, transactionId = null) {
        // Align with schema.sql: mark payment as completed and store UPI transaction id
        return this.update(id, {
            status: 'completed',
            upi_transaction_id: transactionId,
            payment_confirmed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    },


    async fail(id) {
        return this.update(id, { status: 'failed' });
    }
};

module.exports = Payment;
