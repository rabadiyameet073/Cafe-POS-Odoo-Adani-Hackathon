/**
 * Manual Test Script for Background Jobs
 * 
 * This script tests the background job functionality without starting the full server.
 * Run with: node test-background-jobs.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const BackgroundJobManager = require('../src/jobs/BackgroundJobManager');
const logger = require('../src/utils/logger');

console.log('='.repeat(60));
console.log('Background Jobs Test Script');
console.log('='.repeat(60));
console.log('');

// Test 1: Check initial status
console.log('Test 1: Checking initial status...');
let status = BackgroundJobManager.getStatus();
console.log('Initial status:', JSON.stringify(status, null, 2));
console.log('✓ Initial status check complete\n');

// Test 2: Start background jobs
console.log('Test 2: Starting background jobs...');
BackgroundJobManager.start();
status = BackgroundJobManager.getStatus();
console.log('Status after start:', JSON.stringify(status, null, 2));
console.log('✓ Background jobs started\n');

// Test 3: Let jobs run for a few seconds
console.log('Test 3: Letting jobs run for 5 seconds...');
setTimeout(() => {
    console.log('✓ Jobs have been running for 5 seconds\n');
    
    // Test 4: Check status while running
    console.log('Test 4: Checking status while running...');
    status = BackgroundJobManager.getStatus();
    console.log('Running status:', JSON.stringify(status, null, 2));
    console.log('✓ Status check complete\n');
    
    // Test 5: Stop background jobs
    console.log('Test 5: Stopping background jobs...');
    BackgroundJobManager.stop();
    status = BackgroundJobManager.getStatus();
    console.log('Status after stop:', JSON.stringify(status, null, 2));
    console.log('✓ Background jobs stopped\n');
    
    console.log('='.repeat(60));
    console.log('All tests completed successfully!');
    console.log('='.repeat(60));
    
    // Exit after a short delay
    setTimeout(() => {
        process.exit(0);
    }, 1000);
}, 5000);

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n\nReceived SIGINT, stopping background jobs...');
    BackgroundJobManager.stop();
    process.exit(0);
});
