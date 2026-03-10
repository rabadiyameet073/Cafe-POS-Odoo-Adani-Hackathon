/**
 * Database Configuration
 * 
 * This module provides database utilities and query helpers.
 * Uses Supabase for PostgreSQL database access.
 */

const { supabase } = require('./supabase');
const logger = require('../utils/logger');

/**
 * Database helper utilities
 */
const db = {
    /**
     * Execute a raw SQL query using Supabase RPC
     * Note: This requires creating corresponding database functions in Supabase
     * 
     * @param {string} functionName - Name of the database function
     * @param {object} params - Parameters to pass to the function
     * @returns {Promise<object>} Query result
     */
    async rpc(functionName, params = {}) {
        try {
            const { data, error } = await supabase.rpc(functionName, params);

            if (error) {
                logger.error(`RPC error for ${functionName}:`, error);
                throw error;
            }

            return data;
        } catch (err) {
            logger.error(`Database RPC error: ${err.message}`);
            throw err;
        }
    },

    /**
     * Get a table reference for querying
     * 
     * @param {string} tableName - Name of the table
     * @returns {object} Supabase table reference
     */
    from(tableName) {
        return supabase.from(tableName);
    },

    /**
     * Begin a transaction-like operation
     * Note: Supabase doesn't support true transactions via JS client.
     * For critical operations, use database functions or stored procedures.
     * 
     * @param {Function} callback - Async function to execute
     * @returns {Promise<any>} Result of the callback
     */
    async transaction(callback) {
        // Note: For true ACID transactions, create PostgreSQL functions
        // and call them via RPC. This is a simplified wrapper.
        try {
            return await callback(supabase);
        } catch (err) {
            logger.error('Transaction error:', err.message);
            throw err;
        }
    },

    /**
     * Generate a new UUID
     * @returns {string} UUID string
     */
    generateUUID() {
        const { v4: uuidv4 } = require('uuid');
        return uuidv4();
    }
};

module.exports = db;
