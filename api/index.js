/**
 * Vercel Serverless Function - API Entry Point
 * This wraps the Express app for Vercel serverless deployment
 */

const app = require('../backend/src/app');

// Export the Express app as a serverless function
module.exports = app;
