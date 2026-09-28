/**
 * Environment Configuration
 * 
 * Loads and validates environment variables from .env file.
 * Provides a single source of truth for all environment settings.
 * On Vercel, env vars are injected via dashboard and dotenv silently skips.
 */

const path = require('path');
// Load from backend/.env — works locally; silently skipped on Vercel (env injected via dashboard)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = {
    // Server Configuration
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: parseInt(process.env.PORT, 10) || 3000,

    // MongoDB Configuration - Uses MongoDB Atlas connection string
    // Return empty string if it's a placeholder value
    get MONGODB_URI() {
        const raw = process.env.MONGODB_URI || '';
        const isPlaceholder = !raw || raw.includes('user:password') || raw.includes('<password>') || raw.includes('<username>') || raw.length < 40;
        return isPlaceholder ? '' : raw;
    },

    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET || 'cafe_pos_jwt_secret_production_key_2026',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    // Client URL for CORS / Hosted URL
    CLIENT_URL: process.env.CLIENT_URL || 'https://cafe-pos-odoo-adani-hackathon.vercel.app',

    // Optional Payment Configuration
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    UPI_ID: process.env.UPI_ID || 'rabadiyameet09@okaxis',
    MERCHANT_NAME: process.env.MERCHANT_NAME || 'Meet Rabadiya - Cafe POS',

    // Helper methods
    isDevelopment: function () {
        return this.NODE_ENV === 'development';
    },

    isProduction: function () {
        return this.NODE_ENV === 'production';
    }
};

// Only warn, don't throw - allow app to start in memory mode
if (!env.MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI not set. App will run in in-memory mode (data resets on restart).');
    console.warn('   To persist data: set MONGODB_URI in your Vercel environment variables or backend/.env');
}

module.exports = env;
