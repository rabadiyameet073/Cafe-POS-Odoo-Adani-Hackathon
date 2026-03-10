/**
 * Jest Test Setup
 * 
 * Global setup and teardown for E2E tests
 */

require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';

// Increase timeout for E2E tests
jest.setTimeout(60000);

// Global setup
beforeAll(async () => {
  console.log('Starting E2E test suite...');
  console.log('Supabase URL:', process.env.SUPABASE_URL);
});

// Global teardown
afterAll(async () => {
  console.log('E2E test suite completed.');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
