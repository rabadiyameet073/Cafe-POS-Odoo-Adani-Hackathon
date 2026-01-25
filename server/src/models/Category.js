/**
 * Category Model
 * 
 * Database operations for product_categories table.
 */

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

const Category = {
    /**
     * Find all categories with optional filters
     */
    async findAll(filters = {}) {
        let query = supabase
            .from('product_categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (typeof filters.is_active === 'boolean') {
            query = query.eq('is_active', filters.is_active);
        }

        if (typeof filters.send_to_kitchen === 'boolean') {
            query = query.eq('send_to_kitchen', filters.send_to_kitchen);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },

    /**
     * Find category by ID
     */
    async findById(id) {
        const { data, error } = await supabase
            .from('product_categories')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Find category by name
     */
    async findByName(name) {
        const { data, error } = await supabase
            .from('product_categories')
            .select('*')
            .eq('name', name)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Find all categories with product counts
     */
    async findAllWithProductCounts() {
        const categories = await this.findAll({ is_active: true });

        // Get product counts for each category
        for (const category of categories) {
            const { count } = await supabase
                .from('products')
                .select('id', { count: 'exact', head: true })
                .eq('category_id', category.id)
                .eq('is_active', true);

            category.products_count = count || 0;
        }

        return categories;
    },

    /**
     * Create a new category
     */
    async create(categoryData) {
        const { data, error } = await supabase
            .from('product_categories')
            .insert(categoryData)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a category
     */
    async update(id, updates) {
        const { data, error } = await supabase
            .from('product_categories')
            .update(updates)
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a category (soft delete)
     */
    async delete(id) {
        return this.update(id, { is_active: false });
    },

    /**
     * Get next display order
     */
    async getNextDisplayOrder() {
        const { data } = await supabase
            .from('product_categories')
            .select('display_order')
            .order('display_order', { ascending: false })
            .limit(1);

        return data && data.length > 0 ? data[0].display_order + 1 : 0;
    }
};

module.exports = Category;
