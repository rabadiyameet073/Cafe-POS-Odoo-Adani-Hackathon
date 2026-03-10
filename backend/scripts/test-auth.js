/**
 * Manual Authentication Test Script
 * 
 * This script tests the authentication and authorization system
 * by making HTTP requests to the API endpoints.
 * 
 * Run with: node test-auth.js
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function runTests() {
    console.log('🧪 Testing Authentication and Authorization System\n');

    try {
        // Test 1: Login with admin credentials
        console.log('Test 1: Admin Login');
        const loginResponse = await makeRequest('POST', '/auth/login', {
            email: 'admin@cafe.com',
            password: 'admin123'
        });
        
        if (loginResponse.status === 200 && loginResponse.data.success) {
            console.log('✅ Admin login successful');
            console.log(`   Token: ${loginResponse.data.data.token.substring(0, 20)}...`);
            console.log(`   Role: ${loginResponse.data.data.user.role}\n`);
        } else {
            console.log('❌ Admin login failed');
            console.log(`   Status: ${loginResponse.status}`);
            console.log(`   Response: ${JSON.stringify(loginResponse.data)}\n`);
            return;
        }

        const adminToken = loginResponse.data.data.token;

        // Test 2: Access protected endpoint with token
        console.log('Test 2: Access Admin Dashboard Stats (requires admin role)');
        const statsResponse = await makeRequest('GET', '/admin/dashboard-stats', null, adminToken);
        
        if (statsResponse.status === 200) {
            console.log('✅ Admin can access admin endpoints');
            console.log(`   Response: ${JSON.stringify(statsResponse.data).substring(0, 100)}...\n`);
        } else {
            console.log('❌ Admin cannot access admin endpoints');
            console.log(`   Status: ${statsResponse.status}\n`);
        }

        // Test 3: Access protected endpoint without token
        console.log('Test 3: Access Admin Endpoint Without Token');
        const noTokenResponse = await makeRequest('GET', '/admin/dashboard-stats');
        
        if (noTokenResponse.status === 401) {
            console.log('✅ Unauthorized access properly blocked');
            console.log(`   Status: ${noTokenResponse.status}\n`);
        } else {
            console.log('❌ Unauthorized access not blocked');
            console.log(`   Status: ${noTokenResponse.status}\n`);
        }

        // Test 4: Token refresh
        console.log('Test 4: Token Refresh');
        const refreshResponse = await makeRequest('POST', '/auth/refresh', null, adminToken);
        
        if (refreshResponse.status === 200 && refreshResponse.data.success) {
            console.log('✅ Token refresh successful');
            console.log(`   New Token: ${refreshResponse.data.data.token.substring(0, 20)}...\n`);
        } else {
            console.log('❌ Token refresh failed');
            console.log(`   Status: ${refreshResponse.status}\n`);
        }

        // Test 5: Get current user
        console.log('Test 5: Get Current User');
        const meResponse = await makeRequest('GET', '/auth/me', null, adminToken);
        
        if (meResponse.status === 200 && meResponse.data.success) {
            console.log('✅ Get current user successful');
            console.log(`   User: ${meResponse.data.data.user.email} (${meResponse.data.data.user.role})\n`);
        } else {
            console.log('❌ Get current user failed');
            console.log(`   Status: ${meResponse.status}\n`);
        }

        // Test 6: Login as cashier
        console.log('Test 6: Cashier Login');
        const cashierLoginResponse = await makeRequest('POST', '/auth/login', {
            email: 'cashier@demo.com',
            password: 'demo123'
        });
        
        if (cashierLoginResponse.status === 200 && cashierLoginResponse.data.success) {
            console.log('✅ Cashier login successful');
            console.log(`   Role: ${cashierLoginResponse.data.data.user.role}\n`);
        } else {
            console.log('❌ Cashier login failed');
            console.log(`   Status: ${cashierLoginResponse.status}\n`);
        }

        const cashierToken = cashierLoginResponse.data.data.token;

        // Test 7: Cashier tries to access admin endpoint
        console.log('Test 7: Cashier Tries to Access Admin Endpoint');
        const cashierAdminResponse = await makeRequest('GET', '/admin/dashboard-stats', null, cashierToken);
        
        if (cashierAdminResponse.status === 403) {
            console.log('✅ Cashier properly blocked from admin endpoints');
            console.log(`   Status: ${cashierAdminResponse.status}\n`);
        } else {
            console.log('❌ Cashier not blocked from admin endpoints');
            console.log(`   Status: ${cashierAdminResponse.status}\n`);
        }

        // Test 8: Cashier can access payment endpoints
        console.log('Test 8: Cashier Can Access Payment Endpoints');
        const cashierPaymentResponse = await makeRequest('GET', '/payments/cash/requests', null, cashierToken);
        
        if (cashierPaymentResponse.status === 200) {
            console.log('✅ Cashier can access payment endpoints');
            console.log(`   Status: ${cashierPaymentResponse.status}\n`);
        } else {
            console.log('❌ Cashier cannot access payment endpoints');
            console.log(`   Status: ${cashierPaymentResponse.status}\n`);
        }

        console.log('✅ All authentication and authorization tests completed!\n');

    } catch (error) {
        console.error('❌ Test error:', error.message);
        console.error('\n⚠️  Make sure the server is running on http://localhost:3000');
    }
}

// Check if server is running
console.log('Checking if server is running...\n');
makeRequest('GET', '/')
    .then(() => {
        console.log('✅ Server is running\n');
        return runTests();
    })
    .catch(() => {
        console.error('❌ Server is not running!');
        console.error('Please start the server with: npm run dev\n');
        process.exit(1);
    });
