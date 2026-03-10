/**
 * User Model
 * 
 * Database operations for users table.
 */

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

const User = {
    /**
     * Find all users with optional filters
     */
    async findAll(filters = {}) {
        let query = supabase
            .from('users')
            .select('id, email, full_name, phone, role, is_active, created_at, updated_at')
            .order('created_at', { ascending: false });

        if (filters.role) {
            query = query.eq('role', filters.role);
        }

        if (typeof filters.is_active === 'boolean') {
            query = query.eq('is_active', filters.is_active);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },

    /**
     * Find user by ID
     */
    async findById(id) {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, full_name, phone, role, is_active, created_at, updated_at')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Find user by email
     */
    async findByEmail(email) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Create a new user
     */
    async create(userData) {
        const { data, error } = await supabase
            .from('users')
            .insert(userData)
            .select('id, email, full_name, phone, role, is_active, created_at')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a user
     */
    async update(id, updates) {
        const { data, error } = await supabase
            .from('users')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('id, email, full_name, phone, role, is_active, updated_at')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Soft delete (deactivate) a user
     */
    async deactivate(id) {
        return this.update(id, { is_active: false });
    },

    /**
     * Activate a user
     */
    async activate(id) {
        return this.update(id, { is_active: true });
    }
};

module.exports = User;
