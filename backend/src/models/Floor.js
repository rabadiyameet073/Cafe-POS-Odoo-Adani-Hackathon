/**
 * Floor Model
 * 
 * Database operations for floors table.
 */

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

const Floor = {
    /**
     * Find all floors with optional filters
     */
    async findAll(filters = {}) {
        let query = supabase
            .from('floors')
            .select('*')
            .order('display_order', { ascending: true });

        if (typeof filters.is_active === 'boolean') {
            query = query.eq('is_active', filters.is_active);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },

    /**
     * Find floor by ID with table count
     */
    async findById(id) {
        const { data: floor, error } = await supabase
            .from('floors')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        if (!floor) return null;

        // Get table count for this floor
        const { count } = await supabase
            .from('tables')
            .select('id', { count: 'exact', head: true })
            .eq('floor_id', id)
            .eq('is_active', true);

        floor.tables_count = count || 0;

        return floor;
    },

    /**
     * Find all floors with table counts
     */
    async findAllWithTableCounts() {
        const floors = await this.findAll({ is_active: true });

        // Get table counts for each floor
        for (const floor of floors) {
            const { count } = await supabase
                .from('tables')
                .select('id', { count: 'exact', head: true })
                .eq('floor_id', floor.id)
                .eq('is_active', true);

            floor.tables_count = count || 0;
        }

        return floors;
    },

    /**
     * Create a new floor
     */
    async create(floorData) {
        const { data, error } = await supabase
            .from('floors')
            .insert(floorData)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a floor
     */
    async update(id, updates) {
        const { data, error } = await supabase
            .from('floors')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a floor (soft delete)
     */
    async delete(id) {
        return this.update(id, { is_active: false });
    },

    /**
     * Get next display order
     */
    async getNextDisplayOrder() {
        const { data } = await supabase
            .from('floors')
            .select('display_order')
            .order('display_order', { ascending: false })
            .limit(1);

        return data && data.length > 0 ? data[0].display_order + 1 : 0;
    }
};

module.exports = Floor;
