

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
            .select('*, payment_methods(id, name, display_name), orders(id, order_number)')
            .order('created_at', { ascending: false });

        if (filters.order_id) {
            query = query.eq('order_id', filters.order_id);
        }

        if (filters.session_id) {
            query = query.eq('session_id', filters.session_id);
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
            .select('*, payment_methods(id, name, display_name), orders(id, order_number, total_amount)')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },


    async findByOrderId(orderId) {
        const { data, error } = await supabase
            .from('payments')
            .select('*, payment_methods(id, name, display_name)')
            .eq('order_id', orderId);

        if (error) throw error;
        return data;
    },

    async create(paymentData) {
        const { data, error } = await supabase
            .from('payments')
            .insert(paymentData)
            .select('*, payment_methods(id, name, display_name)')
            .single();

        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('payments')
            .update(updates)
            .eq('id', id)
            .select('*, payment_methods(id, name, display_name)')
            .single();

        if (error) throw error;
        return data;
    },


    async complete(id, transactionId = null) {
        return this.update(id, {
            status: 'completed',
            transaction_id: transactionId,
            paid_at: new Date().toISOString()
        });
    },


    async fail(id) {
        return this.update(id, { status: 'failed' });
    }
};

module.exports = Payment;
