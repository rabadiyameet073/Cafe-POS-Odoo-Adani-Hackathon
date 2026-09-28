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
    MONGODB_URI: process.env.MONGODB_URI || '',

    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET || 'cafe_pos_jwt_secret_production_key_2026',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    // Client URL for CORS / Hosted URL
    CLIENT_URL: process.env.CLIENT_URL || 'https://cafe-pos-odoo-adani-hackathon.vercel.app',

    // Optional Payment Configuration
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    UPI_ID: process.env.UPI_ID || 'merchant@upi',
    MERCHANT_NAME: process.env.MERCHANT_NAME || 'Cafe POS',

    // Helper methods
    isDevelopment: function () {
        return this.NODE_ENV === 'development';
    },

    isProduction: function () {
        return this.NODE_ENV === 'production';
    }
};

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !env[varName]);

if (missingEnvVars.length > 0 && env.NODE_ENV !== 'development') {
    console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
    console.error('Please check your .env file or Vercel environment variables');
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

module.exports = env;
