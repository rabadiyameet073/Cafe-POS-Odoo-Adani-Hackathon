/**
 * Feedback Model
 * 
 * Database operations for feedback table.
 */

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

const Feedback = {
    /**
     * Find all feedback with optional filters
     */
    async findAll(filters = {}) {
        let query = supabase
            .from('feedback')
            .select('*, orders(id, order_number), users(id, full_name)')
            .order('created_at', { ascending: false });

        if (filters.customer_id) {
            query = query.eq('customer_id', filters.customer_id);
        }

        if (filters.min_rating) {
            query = query.gte('overall_rating', filters.min_rating);
        }

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },

    /**
     * Find feedback by ID
     */
    async findById(id) {
        const { data, error } = await supabase
            .from('feedback')
            .select('*, orders(id, order_number), users(id, full_name)')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Find feedback for an order
     */
    async findByOrderId(orderId) {
        const { data, error } = await supabase
            .from('feedback')
            .select('*')
            .eq('order_id', orderId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Create feedback
     */
    async create(feedbackData) {
        const { data, error } = await supabase
            .from('feedback')
            .insert(feedbackData)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get feedback statistics
     */
    async getStats() {
        const { data: feedbacks, error } = await supabase
            .from('feedback')
            .select('*');

        if (error) throw error;

        if (!feedbacks || feedbacks.length === 0) {
            return {
                total_count: 0,
                average_overall: 0,
                average_food_quality: 0,
                average_service: 0,
                average_payment_experience: 0,
                average_ambience: 0,
                average_cleanliness: 0,
                recommendation_rate: 0
            };
        }

        const count = feedbacks.length;
        const avg = (field) => {
            const values = feedbacks.filter(f => f[field] != null).map(f => f[field]);
            return values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0;
        };

        const recommendations = feedbacks.filter(f => f.would_recommend === true).length;

        return {
            total_count: count,
            average_overall: parseFloat(avg('overall_rating')),
            average_food_quality: parseFloat(avg('food_quality_rating')),
            average_service: parseFloat(avg('service_rating')),
            average_payment_experience: parseFloat(avg('payment_experience_rating')),
            average_ambience: parseFloat(avg('ambience_rating')),
            average_cleanliness: parseFloat(avg('cleanliness_rating')),
            recommendation_rate: parseFloat(((recommendations / count) * 100).toFixed(2))
        };
    }
};

module.exports = Feedback;
