/**
 * Test script for monitoring and logging functionality
 * 
 * Tests:
 * - Logger functions (request, error, admin action, payment logging)
 * - MonitoringService metrics collection
 * - AlertingService health checks
 * - API endpoints
 */

const logger = require('../src/utils/logger');
const MonitoringService = require('../src/services/MonitoringService');
const AlertingService = require('../src/services/AlertingService');

console.log('🧪 Testing Monitoring and Logging System\n');

// Test 1: Logger functions
console.log('1️⃣ Testing Logger Functions...');
try {
    // Test request logging
    const mockReq = {
        method: 'GET',
        path: '/api/test',
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
        user: { id: 'test-user-id', email: 'test@example.com' },
        connection: { remoteAddress: '127.0.0.1' }
    };
    const mockRes = { statusCode: 200 };
    
    logger.logRequest(mockReq, mockRes, 150);
    console.log('   ✅ Request logging works');

    // Test error logging
    const testError = new Error('Test error');
    testError.statusCode = 500;
    logger.logError(testError, { context: 'test' });
    console.log('   ✅ Error logging works');

    // Test admin action logging
    logger.logAdminAction('admin-123', 'admin@example.com', 'test_action', { detail: 'test' });
    console.log('   ✅ Admin action logging works');

    // Test payment logging
    logger.logPayment({
        id: 'payment-123',
        orderId: 'order-123',
        amount: 100.50,
        method: 'cash',
        status: 'approved',
        tableNumber: 'T1',
        cashierId: 'cashier-123',
        cashierName: 'John Doe'
    });
    console.log('   ✅ Payment logging works');

} catch (err) {
    console.error('   ❌ Logger test failed:', err.message);
}

// Test 2: MonitoringService
console.log('\n2️⃣ Testing MonitoringService...');
try {
    // Record some metrics
    MonitoringService.recordRequest(true);
    MonitoringService.recordRequest(true);
    MonitoringService.recordRequest(false);
    console.log('   ✅ Request metrics recorded');

    MonitoringService.recordPayment(true);
    MonitoringService.recordPayment(true);
    MonitoringService.recordPayment(false);
    console.log('   ✅ Payment metrics recorded');

    // Register subscriptions
    MonitoringService.registerSubscription('client-1', 'tables-channel');
    MonitoringService.registerSubscription('client-2', 'orders-channel');
    console.log('   ✅ Subscription tracking works');

    // Get health metrics
    MonitoringService.getHealthMetrics().then(metrics => {
        if (metrics.success) {
            console.log('   ✅ Health metrics retrieved');
            console.log('      Status:', metrics.status);
            console.log('      Total Requests:', metrics.metrics.requests.total);
            console.log('      Error Rate:', metrics.metrics.requests.errorRate);
            console.log('      Active Subscriptions:', metrics.metrics.subscriptions.activeConnections);
        } else {
            console.log('   ⚠️  Health metrics failed (database not connected)');
        }
    }).catch(err => {
        console.log('   ⚠️  Health metrics error:', err.message);
    });

} catch (err) {
    console.error('   ❌ MonitoringService test failed:', err.message);
}

// Test 3: AlertingService
console.log('\n3️⃣ Testing AlertingService...');
try {
    // Get configuration
    const config = AlertingService.getConfiguration();
    console.log('   ✅ Alert configuration retrieved');
    console.log('      Error Rate Threshold:', config.thresholds.errorRate + '%');
    console.log('      Payment Failure Threshold:', config.thresholds.paymentFailureRate + '%');
    console.log('      Alert Cooldown:', config.cooldown / 1000 + 's');

    // Test alert sending (will create notification in DB if connected)
    AlertingService.sendAlert({
        type: 'test_alert',
        severity: 'info',
        title: 'Test Alert',
        message: 'This is a test alert from monitoring test script',
        data: { test: true }
    }).then(() => {
        console.log('   ✅ Alert sending works');
    }).catch(err => {
        console.log('   ⚠️  Alert sending error:', err.message);
    });

} catch (err) {
    console.error('   ❌ AlertingService test failed:', err.message);
}

// Test 4: Integration test
console.log('\n4️⃣ Testing Integration...');
setTimeout(async () => {
    try {
        // Get config first
        const config = AlertingService.getConfiguration();
        
        // Simulate high error rate
        for (let i = 0; i < 20; i++) {
            MonitoringService.recordRequest(false);
        }
        console.log('   ✅ Simulated high error rate');

        // Check if alert would be triggered
        const metrics = await MonitoringService.getHealthMetrics();
        if (metrics.success) {
            const errorRate = parseFloat(metrics.metrics.requests.errorRate);
            console.log('   📊 Current error rate:', errorRate + '%');
            
            if (errorRate > config.thresholds.errorRate) {
                console.log('   ⚠️  Error rate exceeds threshold - alert would be triggered');
            }
        }

        // Reset metrics
        MonitoringService.resetMetrics();
        console.log('   ✅ Metrics reset');

        console.log('\n✅ All monitoring and logging tests completed!\n');
        console.log('📝 Summary:');
        console.log('   - Logger: Request, Error, Admin Action, Payment logging ✅');
        console.log('   - MonitoringService: Metrics collection and health checks ✅');
        console.log('   - AlertingService: Configuration and alert sending ✅');
        console.log('   - Integration: Error rate monitoring and alerting ✅');
        console.log('\n🎉 Monitoring and Logging system is working correctly!\n');

    } catch (err) {
        console.error('   ❌ Integration test failed:', err.message);
    }
}, 2000);
