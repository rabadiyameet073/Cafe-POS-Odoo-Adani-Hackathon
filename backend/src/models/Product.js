/**
 * Product Model
 * 
 * Database operations for products and product_variants tables.
 */

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

const Product = {
    /**
     * Find all products with optional filters
     */
    async findAll(filters = {}) {
        let query = supabase
            .from('products')
            .select('*, product_categories(id, name, send_to_kitchen)')
            .order('name', { ascending: true });

        if (typeof filters.is_active === 'boolean') {
            query = query.eq('is_active', filters.is_active);
        }

        if (typeof filters.is_available === 'boolean') {
            query = query.eq('is_available', filters.is_available);
        }

        if (filters.category_id) {
            query = query.eq('category_id', filters.category_id);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },

    /**
     * Find products by category
     */
    async findByCategory(categoryId) {
        const { data, error } = await supabase
            .from('products')
            .select('*, product_categories(id, name, send_to_kitchen)')
            .eq('category_id', categoryId)
            .eq('is_active', true)
            .eq('is_available', true)
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Find product by ID with variants
     */
    async findById(id) {
        const { data: product, error } = await supabase
            .from('products')
            .select('*, product_categories(id, name, send_to_kitchen)')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        if (!product) return null;

        // Get variants
        const { data: variants } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', id)
            .eq('is_active', true)
            .order('attribute_name', { ascending: true });

        product.variants = variants || [];

        return product;
    },

    /**
     * Find all products with their variants
     */
    async findAllWithVariants(filters = {}) {
        const products = await this.findAll(filters);

        // Get variants for all products
        const productIds = products.map(p => p.id);

        if (productIds.length > 0) {
            const { data: allVariants } = await supabase
                .from('product_variants')
                .select('*')
                .in('product_id', productIds)
                .eq('is_active', true);

            // Map variants to products
            for (const product of products) {
                product.variants = allVariants ? allVariants.filter(v => v.product_id === product.id) : [];
            }
        }

        return products;
    },

    /**
     * Create a new product
     */
    async create(productData) {
        const { data, error } = await supabase
            .from('products')
            .insert(productData)
            .select('*, product_categories(id, name)')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a product
     */
    async update(id, updates) {
        const { data, error } = await supabase
            .from('products')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*, product_categories(id, name)')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a product (soft delete)
     */
    async delete(id) {
        return this.update(id, { is_active: false });
    },

    /**
     * Toggle product availability
     */
    async toggleAvailability(id) {
        const product = await this.findById(id);
        if (!product) return null;

        return this.update(id, { is_available: !product.is_available });
    },

    // ==================== VARIANTS ====================

    /**
     * Get product variants
     */
    async getVariants(productId) {
        const { data, error } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', productId)
            .eq('is_active', true)
            .order('attribute_name', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Get variant by ID
     */
    async getVariantById(variantId) {
        const { data, error } = await supabase
            .from('product_variants')
            .select('*')
            .eq('id', variantId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Create a product variant
     */
    async createVariant(variantData) {
        const { data, error } = await supabase
            .from('product_variants')
            .insert(variantData)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a product variant
     */
    async updateVariant(variantId, updates) {
        const { data, error } = await supabase
            .from('product_variants')
            .update(updates)
            .eq('id', variantId)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a product variant (soft delete)
     */
    async deleteVariant(variantId) {
        return this.updateVariant(variantId, { is_active: false });
    }
};

module.exports = Product;
