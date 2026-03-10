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
    env.SUPABASE_URL || 'https://smxqcotsqhiofecfzykg.supabase.co',
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
 * Test database connection with a timeout
 * @returns {Promise<boolean>} True if connection is successful
 */
let _isConnected = false;

async function testConnection() {
    try {
        // Race the Supabase query against a 10-second timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timed out after 10s – Supabase project may be paused')), 10000)
        );
        const queryPromise = supabase.from('users').select('id').limit(1);

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (error && error.code !== 'PGRST116') {
            logger.error('Database connection test failed:', error.message);
            _isConnected = false;
            return false;
        }

        logger.info('✅ Connected to Supabase database');
        _isConnected = true;
        return true;
    } catch (err) {
        _isConnected = false;
        if (err.message.includes('timed out') || err.message.includes('fetch failed')) {
            logger.error('❌ Cannot reach Supabase – project may be PAUSED. Go to https://supabase.com/dashboard and resume it.');
        } else {
            logger.error('Database connection error:', err.message);
        }
        return false;
    }
}

/**
 * Returns current connection status (set by last testConnection call)
 */
function getConnectionStatus() {
    return _isConnected;
}

// Test connection on startup
if (env.SUPABASE_URL) {
    testConnection();
}

module.exports = {
    supabase,
    testConnection,
    getConnectionStatus
};
