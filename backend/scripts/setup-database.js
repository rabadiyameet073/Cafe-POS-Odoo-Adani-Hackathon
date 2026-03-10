/**
 * Database Setup Script
 * 
 * This script helps you:
 * 1. Test Supabase connection
 * 2. Create demo users
 * 3. Verify database setup
 */

const { supabase, testConnection } = require('../src/config/supabase');
const bcrypt = require('bcryptjs');
const logger = require('../src/utils/logger');

const demoUsers = [
    {
        email: 'admin@cafe.com',
        password: 'admin123',
        full_name: 'Admin User',
        phone: '+1234567890',
        role: 'admin'
    },
    {
        email: 'cashier@cafe.com',
        password: 'cashier123',
        full_name: 'Cashier User',
        phone: '+1234567891',
        role: 'cashier'
    },
    {
        email: 'kitchen@cafe.com',
        password: 'kitchen123',
        full_name: 'Kitchen Staff',
        phone: '+1234567892',
        role: 'kitchen'
    },
    {
        email: 'customer@cafe.com',
        password: 'customer123',
        full_name: 'Customer User',
        phone: '+1234567893',
        role: 'customer'
    }
];

async function setupDatabase() {
    console.log('\n========================================');
    console.log('  Cafe POS Database Setup');
    console.log('========================================\n');

    // Step 1: Test connection
    console.log('Step 1: Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
        console.error('\n❌ Failed to connect to database');
        console.error('Please check your .env file and Supabase credentials\n');
        process.exit(1);
    }

    console.log('✅ Database connection successful\n');

    // Step 2: Check if tables exist
    console.log('Step 2: Checking database tables...');
    const { data: tables, error: tablesError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

    if (tablesError && tablesError.code === '42P01') {
        console.error('\n❌ Tables not found!');
        console.error('Please run the schema.sql file in your Supabase SQL Editor first\n');
        console.error('File location: database/schema.sql\n');
        process.exit(1);
    }

    console.log('✅ Database tables exist\n');

    // Step 3: Create demo users
    console.log('Step 3: Creating demo users...\n');
    
    for (const user of demoUsers) {
        try {
            // Check if user already exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('id, email')
                .eq('email', user.email)
                .single();

            if (existingUser) {
                console.log(`⚠️  User already exists: ${user.email}`);
                continue;
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(user.password, salt);

            // Create user
            const { data: newUser, error } = await supabase
                .from('users')
                .insert({
                    email: user.email,
                    password_hash,
                    full_name: user.full_name,
                    phone: user.phone,
                    role: user.role,
                    is_active: true
                })
                .select('id, email, full_name, role')
                .single();

            if (error) {
                console.error(`❌ Failed to create user ${user.email}:`, error.message);
            } else {
                console.log(`✅ Created user: ${user.email} (${user.role})`);
            }
        } catch (err) {
            console.error(`❌ Error creating user ${user.email}:`, err.message);
        }
    }

    // Step 4: Verify setup
    console.log('\nStep 4: Verifying setup...');
    
    const { data: userCount, error: countError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });

    if (!countError) {
        console.log(`✅ Total users in database: ${userCount?.length || 0}\n`);
    }

    // Step 5: Display summary
    console.log('========================================');
    console.log('  Setup Complete!');
    console.log('========================================\n');
    
    console.log('Demo Accounts Created:\n');
    demoUsers.forEach(user => {
        console.log(`  ${user.role.toUpperCase()}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Password: ${user.password}\n`);
    });

    console.log('Next Steps:');
    console.log('  1. Start the backend: npm run dev');
    console.log('  2. Start the frontend: cd ../frontend && npm run dev');
    console.log('  3. Login with any demo account');
    console.log('  4. Run initial_data.sql for sample products and tables\n');

    process.exit(0);
}

// Run setup
setupDatabase().catch(err => {
    console.error('\n❌ Setup failed:', err.message);
    console.error(err);
    process.exit(1);
});
