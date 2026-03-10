/**
 * Order Model
 * 
 * Database operations for orders table.
 */

const { supabase } = require('../config/supabase');
const { generateOrderNumber } = require('../utils/helpers');
const logger = require('../utils/logger');

const Order = {
    /**
     * Find all orders with optional filters
     */
    async findAll(filters = {}) {
        let query = supabase
            .from('orders')
            // Keep this select conservative and aligned with schema.sql
            .select(`
                *,
                tables(id, table_number, floor_id, floors(id, name))
            `)
            .order('created_at', { ascending: false });

        if (filters.session_id) {
            query = query.eq('session_id', filters.session_id);
        }

        if (filters.customer_id) {
            query = query.eq('customer_id', filters.customer_id);
        }

        if (filters.table_id) {
            query = query.eq('table_id', filters.table_id);
        }

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        if (filters.statuses && Array.isArray(filters.statuses)) {
            query = query.in('status', filters.statuses);
        }

        if (filters.start_date) {
            query = query.gte('created_at', filters.start_date);
        }

        if (filters.end_date) {
            query = query.lte('created_at', filters.end_date);
        }

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },

    /**
     * Find order by ID with items
     */
    async findById(id) {
        const { data: order, error } = await supabase
            .from('orders')
            .select(`
                *,
                tables(id, table_number, floor_id, floors(id, name))
            `)
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        if (!order) return null;

        // Get order items
        const { data: items } = await supabase
            .from('order_items')
            .select(`
                *,
                products(id, name, image_url),
                product_variants(id, attribute_name, attribute_value)
            `)
            .eq('order_id', id)
            .order('created_at', { ascending: true });

        order.items = items || [];

        return order;
    },

    /**
     * Find orders by customer
     */
    async findByCustomer(customerId) {
        return this.findAll({ customer_id: customerId });
    },

    /**
     * Find orders by session
     */
    async findBySession(sessionId) {
        return this.findAll({ session_id: sessionId });
    },

    /**
     * Create a new order
     */
    async create(orderData) {
        // Generate order number if not provided
        if (!orderData.order_number) {
            orderData.order_number = generateOrderNumber();
        }

        const { data, error } = await supabase
            .from('orders')
            .insert(orderData)
            .select(`
                *,
                tables(id, table_number)
            `)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update an order
     */
    async update(id, updates) {
        const { data, error } = await supabase
            .from('orders')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select(`
                *,
                tables(id, table_number)
            `)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update order status
     */
    async updateStatus(id, status) {
        const updates = { status };

        // Set timestamp based on status
        switch (status) {
            case 'sent_to_kitchen':
                updates.sent_to_kitchen_at = new Date().toISOString();
                break;
            case 'ready':
                updates.ready_at = new Date().toISOString();
                break;
            case 'completed':
                updates.completed_at = new Date().toISOString();
                break;
            case 'cancelled':
                updates.cancelled_at = new Date().toISOString();
                break;
        }

        return this.update(id, updates);
    },

    /**
     * Update order totals
     */
    async updateTotals(id) {
        // Get all items for this order
        const { data: items } = await supabase
            .from('order_items')
            .select('line_total, tax_percentage, unit_price, variant_price, quantity')
            .eq('order_id', id);

        if (!items || items.length === 0) {
            return this.update(id, { subtotal: 0, tax_amount: 0, total_amount: 0 });
        }

        let subtotal = 0;
        let taxAmount = 0;

        items.forEach(item => {
            subtotal += parseFloat(item.line_total);
            const itemTax = parseFloat(item.line_total) * (parseFloat(item.tax_percentage) / 100);
            taxAmount += itemTax;
        });

        const total = subtotal + taxAmount;

        return this.update(id, {
            subtotal: parseFloat(subtotal.toFixed(2)),
            tax_amount: parseFloat(taxAmount.toFixed(2)),
            total_amount: parseFloat(total.toFixed(2))
        });
    },

    /**
     * Cancel an order
     */
    async cancel(id) {
        return this.updateStatus(id, 'cancelled');
    }
};

module.exports = Order;
