/**
 * OrderItem Model
 * 
 * Database operations for order_items table.
 */

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

const OrderItem = {
    /**
     * Find all items for an order
     */
    async findByOrderId(orderId) {
        const { data, error } = await supabase
            .from('order_items')
            .select(`
                *,
                products(id, name, image_url, category_id),
                product_variants(id, attribute_name, attribute_value)
            `)
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Find item by ID
     */
    async findById(id) {
        const { data, error } = await supabase
            .from('order_items')
            .select(`
                *,
                products(id, name, image_url),
                product_variants(id, attribute_name, attribute_value)
            `)
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Create a new order item
     */
    async create(itemData) {
        // Calculate line total if not provided
        if (!itemData.line_total) {
            const unitPrice = parseFloat(itemData.unit_price) || 0;
            const variantPrice = parseFloat(itemData.variant_price) || 0;
            const quantity = parseInt(itemData.quantity) || 1;
            itemData.line_total = (unitPrice + variantPrice) * quantity;
        }

        const { data, error } = await supabase
            .from('order_items')
            .insert(itemData)
            .select(`
                *,
                products(id, name, image_url),
                product_variants(id, attribute_name, attribute_value)
            `)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update an order item
     */
    async update(id, updates) {
        // Recalculate line total if quantity or prices changed
        if (updates.quantity || updates.unit_price || updates.variant_price) {
            const existingItem = await this.findById(id);
            const unitPrice = parseFloat(updates.unit_price ?? existingItem.unit_price);
            const variantPrice = parseFloat(updates.variant_price ?? existingItem.variant_price);
            const quantity = parseInt(updates.quantity ?? existingItem.quantity);
            updates.line_total = (unitPrice + variantPrice) * quantity;
        }

        const { data, error } = await supabase
            .from('order_items')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update item kitchen status
     */
    async updateKitchenStatus(id, kitchenStatus) {
        return this.update(id, { kitchen_status: kitchenStatus });
    },

    /**
     * Delete an order item
     */
    async delete(id) {
        const { error } = await supabase
            .from('order_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    /**
     * Get items pending in kitchen
     */
    async getPendingKitchenItems(orderId) {
        const { data, error } = await supabase
            .from('order_items')
            .select(`
                *,
                products(id, name, category_id, product_categories(send_to_kitchen)),
                product_variants(id, attribute_name, attribute_value)
            `)
            .eq('order_id', orderId)
            .in('kitchen_status', ['pending', 'preparing']);

        if (error) throw error;

        // Filter only items from categories that go to kitchen
        return data.filter(item => item.products?.product_categories?.send_to_kitchen);
    }
};

module.exports = OrderItem;
