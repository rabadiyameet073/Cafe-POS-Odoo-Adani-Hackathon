/**
 * Kitchen Order Model
 * 
 * Database operations for kitchen_orders table.
 */

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

const KitchenOrder = {
    /**
     * Find all kitchen orders with optional filters
     */
    async findAll(filters = {}) {
        let query = supabase
            .from('kitchen_orders')
            .select('*, orders(id, order_number, table_id, tables(table_number))')
            .order('received_at', { ascending: true });

        if (filters.stage) {
            query = query.eq('stage', filters.stage);
        }

        if (filters.stages && Array.isArray(filters.stages)) {
            query = query.in('stage', filters.stages);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },

    /**
     * Find active kitchen orders (not completed)
     */
    async findActive() {
        return this.findAll({ stages: ['to_cook', 'preparing'] });
    },

    /**
     * Find kitchen order by ID
     */
    async findById(id) {
        const { data, error } = await supabase
            .from('kitchen_orders')
            .select('*, orders(id, order_number, table_id, tables(table_number))')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Find kitchen order by order ID
     */
    async findByOrderId(orderId) {
        const { data, error } = await supabase
            .from('kitchen_orders')
            .select('*, orders(id, order_number, table_id, tables(table_number))')
            .eq('order_id', orderId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Create a new kitchen order
     */
    async create(kitchenOrderData) {
        const { data, error } = await supabase
            .from('kitchen_orders')
            .insert(kitchenOrderData)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a kitchen order
     */
    async update(id, updates) {
        const { data, error } = await supabase
            .from('kitchen_orders')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update kitchen order stage
     */
    async updateStage(id, stage) {
        const updates = { stage };

        switch (stage) {
            case 'preparing':
                updates.started_at = new Date().toISOString();
                break;
            case 'completed':
                updates.completed_at = new Date().toISOString();
                break;
        }

        return this.update(id, updates);
    },

    /**
     * Update item status in kitchen order
     */
    async updateItemStatus(id, itemId, status) {
        const order = await this.findById(id);
        if (!order) return null;

        const items = order.items.map(item => {
            if (item.id === itemId || item.order_item_id === itemId) {
                return { ...item, kitchen_status: status };
            }
            return item;
        });

        return this.update(id, { items });
    },

    /**
     * Get orders grouped by stage
     */
    async getGroupedByStage() {
        const orders = await this.findAll({ stages: ['to_cook', 'preparing', 'completed'] });

        return {
            to_cook: orders.filter(o => o.stage === 'to_cook'),
            preparing: orders.filter(o => o.stage === 'preparing'),
            completed: orders.filter(o => o.stage === 'completed')
        };
    },

    /**
     * Delete a kitchen order (for picked up orders)
     */
    async delete(id) {
        const { error } = await supabase
            .from('kitchen_orders')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};

module.exports = KitchenOrder;

