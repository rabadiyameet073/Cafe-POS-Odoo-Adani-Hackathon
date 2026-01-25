/**
 * Supabase Client Configuration
 * 
 * Initializes and exports the Supabase client for database operations.
 * Uses the service role key for server-side access with full permissions.
 */

const { createClient } = require('@supabase/supabase-js');
const env = require('./env');
const logger = require('../utils/logger');

// Create Supabase client with service role key for server-side access
const supabase = createClient(
    env.SUPABASE_URL || 'https://mgepqbusmvqoznfgxlpt.supabase.co',
    env.SUPABASE_SERVICE_KEY || 'placeholder_key',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        db: {
            schema: 'public'
        }
    }
);

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection is successful
 */
async function testConnection() {
    try {
        const { data, error } = await supabase.from('users').select('id').limit(1);

        if (error && error.code !== 'PGRST116') {
            // PGRST116 means no rows found, which is fine for testing
            logger.error('Database connection test failed:', error.message);
            return false;
        }

        logger.info('✅ Connected to Supabase database');
        return true;
    } catch (err) {
        logger.error('Database connection error:', err.message);
        return false;
    }
}

// Test connection on startup (only in development)
if (env.isDevelopment() && env.SUPABASE_URL) {
    testConnection();
}

module.exports = {
    supabase,
    testConnection
};
