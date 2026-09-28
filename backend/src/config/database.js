/**
 * Database Configuration
 * 
 * Re-exports the unified db interface and provides helper utilities.
 * Uses MongoDB or in-memory store depending on MONGODB_URI availability.
 */

const { db, testConnection, getConnectionStatus } = require('./db');
const logger = require('../utils/logger');

/**
 * Database helper utilities
 */
const database = {
    /**
     * Get a table reference for querying
     */
    from(tableName) {
        return db.from(tableName);
    },

    /**
     * Execute an RPC / function call
     * Simplified wrapper — performs a select with filter as fallback
     */
    async rpc(functionName, params = {}) {
        try {
            logger.debug(`RPC call: ${functionName}`, params);
            return { data: null, error: { message: `RPC ${functionName} not implemented` } };
        } catch (err) {
            logger.error(`Database RPC error: ${err.message}`);
            throw err;
        }
    },

    /**
     * Simplified transaction wrapper
     */
    async transaction(callback) {
        try {
            return await callback(db);
        } catch (err) {
            logger.error('Transaction error:', err.message);
            throw err;
        }
    },

    /**
     * Generate a new UUID
     */
    generateUUID() {
        const { v4: uuidv4 } = require('uuid');
        return uuidv4();
    },

    testConnection,
    getConnectionStatus
};

module.exports = database;
