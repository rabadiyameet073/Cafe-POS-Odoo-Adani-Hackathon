/**
 * Mock Users for Development
 * Use when Supabase is not available
 */

const bcrypt = require('bcryptjs');

// Pre-hashed passwords for demo123
const DEMO_PASSWORD_HASH = '$2a$10$YourHashedPasswordHere';

const mockUsers = [
    {
        id: '1',
        email: 'admin@demo.com',
        password_hash: bcrypt.hashSync('demo123', 10),
        full_name: 'Admin User',
        phone: '+1234567890',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: '2',
        email: 'cashier@demo.com',
        password_hash: bcrypt.hashSync('demo123', 10),
        full_name: 'Cashier User',
        phone: '+1234567891',
        role: 'cashier',
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: '3',
        email: 'kitchen@demo.com',
        password_hash: bcrypt.hashSync('demo123', 10),
        full_name: 'Kitchen Staff',
        phone: '+1234567892',
        role: 'kitchen',
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: '4',
        email: 'customer@demo.com',
        password_hash: bcrypt.hashSync('demo123', 10),
        full_name: 'Customer User',
        phone: '+1234567893',
        role: 'customer',
        is_active: true,
        created_at: new Date().toISOString()
    }
];

function findUserByEmail(email) {
    return mockUsers.find(u => u.email === email);
}

function findUserById(id) {
    return mockUsers.find(u => u.id === id);
}

module.exports = {
    mockUsers,
    findUserByEmail,
    findUserById
};
