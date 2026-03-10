/**
 * Environment Configuration
 * 
 * Loads and validates environment variables from .env file.
 * Provides a single source of truth for all environment settings.
 */

require('dotenv').config();

const env = {
    // Server Configuration
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT, 10) || 3000,

    // Supabase Configuration
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,

    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'default_jwt_secret_change_in_production'),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    // Client URL for CORS
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

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
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !env[varName]);

if (missingEnvVars.length > 0 && env.NODE_ENV !== 'development') {
    console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
    console.error('Please check your .env file or Vercel environment variables');
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

module.exports = env;
