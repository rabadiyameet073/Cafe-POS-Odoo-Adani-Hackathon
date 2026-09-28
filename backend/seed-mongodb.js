/**
 * MongoDB Database Seeding Script
 * 
 * Seeds:
 *  - Floors & Tables (from schema & mock_data)
 *  - Demo Users (Admin, Cashier, Kitchen, Customer)
 *  - Payment Methods (Cash, UPI QR, Card)
 *  - Categories & Delicious Cafe Menu Products
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { connectMongoDB, mongoose } = require('./src/config/mongodb');
const schemas = require('./src/models/schemas');
const env = require('./src/config/env');
const logger = require('./src/utils/logger');

async function seed() {
    console.log('\n========================================');
    console.log('   Cafe POS - MongoDB Seeder');
    console.log('========================================\n');

    await connectMongoDB();

    if (mongoose.connection.readyState !== 1) {
        console.error('❌ Could not connect to MongoDB. Please check your MONGODB_URI in backend/.env');
        process.exit(1);
    }

    console.log('✅ Connected to MongoDB\n');

    // 1. Seed Demo Users
    console.log('--- 1. Seeding Users ---');
    const demoUsers = [
        { email: 'admin@cafe.com', password: 'admin123', full_name: 'Admin User', role: 'admin', phone: '+91 98765 43210' },
        { email: 'cashier@cafe.com', password: 'cashier123', full_name: 'Cashier Staff', role: 'cashier', phone: '+91 98765 43211' },
        { email: 'kitchen@cafe.com', password: 'kitchen123', full_name: 'Head Chef', role: 'kitchen', phone: '+91 98765 43212' },
        { email: 'customer@cafe.com', password: 'customer123', full_name: 'Meet Rabadiya', role: 'customer', phone: '+91 98765 43213' }
    ];

    for (const u of demoUsers) {
        const existing = await schemas.User.findOne({ email: u.email });
        if (!existing) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(u.password, salt);
            await schemas.User.create({
                id: uuidv4(),
                email: u.email,
                password_hash,
                full_name: u.full_name,
                role: u.role,
                phone: u.phone,
                is_active: true
            });
            console.log(`  + Created user: ${u.email} (${u.role})`);
        } else {
            console.log(`  - User already exists: ${u.email}`);
        }
    }

    // 2. Seed Floors
    console.log('\n--- 2. Seeding Floors ---');
    const floorsData = [
        {
            name: 'Ground Floor',
            description: 'Main dining area with maximum seating and cashier counter',
            display_order: 1
        },
        {
            name: 'First Floor',
            description: 'Quiet seating area suitable for families and groups',
            display_order: 2
        },
        {
            name: 'Terrace',
            description: 'Open-air rooftop seating with city view',
            display_order: 3
        }
    ];

    const floorMap = {};
    for (const f of floorsData) {
        let floor = await schemas.Floor.findOne({ name: f.name });
        if (!floor) {
            floor = await schemas.Floor.create({
                id: uuidv4(),
                name: f.name,
                description: f.description,
                display_order: f.display_order,
                is_active: true
            });
            console.log(`  + Created floor: ${f.name}`);
        } else {
            console.log(`  - Floor already exists: ${f.name}`);
        }
        floorMap[f.name] = floor.id;
    }

    // 3. Seed Tables
    console.log('\n--- 3. Seeding Tables ---');
    const tablesData = [
        // Ground Floor
        { floor: 'Ground Floor', number: 'G-1', seats: 4, token: 'GF-T1' },
        { floor: 'Ground Floor', number: 'G-2', seats: 4, token: 'GF-T2' },
        { floor: 'Ground Floor', number: 'G-3', seats: 2, token: 'GF-T3' },
        { floor: 'Ground Floor', number: 'G-4', seats: 6, token: 'GF-T4' },
        { floor: 'Ground Floor', number: 'G-5', seats: 4, token: 'GF-T5' },
        { floor: 'Ground Floor', number: 'G-6', seats: 2, token: 'GF-T6' },
        { floor: 'Ground Floor', number: 'G-7', seats: 8, token: 'GF-T7' },
        { floor: 'Ground Floor', number: 'G-8', seats: 4, token: 'GF-T8' },
        { floor: 'Ground Floor', number: 'G-9', seats: 2, token: 'GF-T9' },

        // First Floor
        { floor: 'First Floor', number: 'F-1', seats: 4, token: 'FF-T1' },
        { floor: 'First Floor', number: 'F-2', seats: 4, token: 'FF-T2' },
        { floor: 'First Floor', number: 'F-3', seats: 6, token: 'FF-T3' },
        { floor: 'First Floor', number: 'F-4', seats: 2, token: 'FF-T4' },
        { floor: 'First Floor', number: 'F-5', seats: 8, token: 'FF-T5' },
        { floor: 'First Floor', number: 'F-6', seats: 4, token: 'FF-T6' },
        { floor: 'First Floor', number: 'F-7', seats: 2, token: 'FF-T7' },
        { floor: 'First Floor', number: 'F-8', seats: 6, token: 'FF-T8' },
        { floor: 'First Floor', number: 'F-9', seats: 4, token: 'FF-T9' },
        { floor: 'First Floor', number: 'F-10', seats: 2, token: 'FF-T10' },
        { floor: 'First Floor', number: 'F-11', seats: 4, token: 'FF-T11' },

        // Terrace
        { floor: 'Terrace', number: 'T-1', seats: 4, token: 'TR-T1' },
        { floor: 'Terrace', number: 'T-2', seats: 2, token: 'TR-T2' },
        { floor: 'Terrace', number: 'T-3', seats: 6, token: 'TR-T3' },
        { floor: 'Terrace', number: 'T-4', seats: 4, token: 'TR-T4' },
        { floor: 'Terrace', number: 'T-5', seats: 8, token: 'TR-T5' },
        { floor: 'Terrace', number: 'T-6', seats: 2, token: 'TR-T6' },
        { floor: 'Terrace', number: 'T-7', seats: 4, token: 'TR-T7' }
    ];

    for (const t of tablesData) {
        const floorId = floorMap[t.floor];
        const existing = await schemas.Table.findOne({ floor_id: floorId, table_number: t.number });
        if (!existing) {
            await schemas.Table.create({
                id: uuidv4(),
                floor_id: floorId,
                table_number: t.number,
                seats: t.seats,
                status: 'available',
                qr_code_token: t.token,
                is_active: true
            });
            console.log(`  + Created table: ${t.number} (${t.floor}, ${t.seats} seats)`);
        }
    }

    // 4. Seed Payment Methods
    console.log('\n--- 4. Seeding Payment Methods ---');
    const paymentMethods = [
        { name: 'cash', display_name: 'Cash', is_enabled: true, upi_id: null },
        { name: 'upi_qr', display_name: 'UPI / QR Code', is_enabled: true, upi_id: env.UPI_ID || 'rabadiyameet09@okaxis', config: { merchant_name: 'Cafe POS' } },
        { name: 'card', display_name: 'Credit / Debit Card', is_enabled: true, upi_id: null }
    ];

    for (const pm of paymentMethods) {
        const existing = await schemas.PaymentMethod.findOne({ name: pm.name });
        if (!existing) {
            await schemas.PaymentMethod.create({
                id: uuidv4(),
                name: pm.name,
                display_name: pm.display_name,
                is_enabled: pm.is_enabled,
                upi_id: pm.upi_id,
                config: pm.config || {}
            });
            console.log(`  + Created payment method: ${pm.display_name}`);
        }
    }

    // 5. Seed Product Categories
    console.log('\n--- 5. Seeding Product Categories ---');
    const categoriesData = [
        { name: 'Coffee & Hot Brews', description: 'Freshly roasted artisanal coffees and specialty hot teas', send_to_kitchen: true, display_order: 1 },
        { name: 'Cold Beverages & Coolers', description: 'Chilled iced coffees, fresh fruit smoothies, and refreshing coolers', send_to_kitchen: true, display_order: 2 },
        { name: 'Snacks & Starters', description: 'Crispy finger foods, seasoned fries, and loaded nachos', send_to_kitchen: true, display_order: 3 },
        { name: 'Artisan Sandwiches & Burgers', description: 'Gourmet handcrafted burgers and toasted panini sandwiches', send_to_kitchen: true, display_order: 4 },
        { name: 'Desserts & Bakes', description: 'Decadent cakes, warm brownies, and freshly baked pastries', send_to_kitchen: true, display_order: 5 }
    ];

    const categoryMap = {};
    for (const c of categoriesData) {
        let cat = await schemas.ProductCategory.findOne({ name: c.name });
        if (!cat) {
            cat = await schemas.ProductCategory.create({
                id: uuidv4(),
                name: c.name,
                description: c.description,
                send_to_kitchen: c.send_to_kitchen,
                display_order: c.display_order,
                is_active: true
            });
            console.log(`  + Created category: ${c.name}`);
        } else {
            console.log(`  - Category already exists: ${c.name}`);
        }
        categoryMap[c.name] = cat.id;
    }

    // 6. Seed Products
    console.log('\n--- 6. Seeding Menu Products ---');
    const productsData = [
        // Coffee
        {
            category: 'Coffee & Hot Brews',
            name: 'Classic Espresso',
            price: 120,
            tax: 5,
            description: 'Rich, bold single shot of pure espresso with a golden crema.',
            image_url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500&auto=format&fit=crop&q=60'
        },
        {
            category: 'Coffee & Hot Brews',
            name: 'Creamy Cappuccino',
            price: 180,
            tax: 5,
            description: 'Balanced espresso poured over velvety steamed milk and thick foam.',
            image_url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=60'
        },
        {
            category: 'Coffee & Hot Brews',
            name: 'Cafe Latte',
            price: 190,
            tax: 5,
            description: 'Smooth espresso blend with silky steamed milk and subtle latte art.',
            image_url: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=500&auto=format&fit=crop&q=60'
        },
        {
            category: 'Coffee & Hot Brews',
            name: 'Desi Masala Chai',
            price: 90,
            tax: 5,
            description: 'Traditional Indian spiced tea brewed with fresh cardamom, ginger, and cloves.',
            image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60'
        },

        // Cold Beverages
        {
            category: 'Cold Beverages & Coolers',
            name: 'Classic Iced Americano',
            price: 160,
            tax: 5,
            description: 'Espresso poured over ice and crisp chilled water for a refreshing kick.',
            image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=60'
        },
        {
            category: 'Cold Beverages & Coolers',
            name: 'Blended Caramel Frappe',
            price: 240,
            tax: 5,
            description: 'Rich iced coffee blended with salted caramel syrup and whipped cream.',
            image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=60'
        },
        {
            category: 'Cold Beverages & Coolers',
            name: 'Fresh Mint Mojito',
            price: 180,
            tax: 5,
            description: 'Crushed garden mint, freshly squeezed lime, and sparkling soda over ice.',
            image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=60'
        },

        // Snacks
        {
            category: 'Snacks & Starters',
            name: 'Crispy Peri Peri Fries',
            price: 150,
            tax: 5,
            description: 'Golden fries tossed in spicy African peri peri seasoning served with garlic mayo dip.',
            image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60'
        },
        {
            category: 'Snacks & Starters',
            name: 'Loaded Cheesy Nachos',
            price: 220,
            tax: 5,
            description: 'Crisp corn tortilla chips smothered in melted cheddar, salsa, and jalapenos.',
            image_url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&auto=format&fit=crop&q=60'
        },
        {
            category: 'Snacks & Starters',
            name: 'Cheese Garlic Bread',
            price: 170,
            tax: 5,
            description: 'Toasted baguette with herb garlic butter and bubbling mozzarella cheese.',
            image_url: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500&auto=format&fit=crop&q=60'
        },

        // Sandwiches & Burgers
        {
            category: 'Artisan Sandwiches & Burgers',
            name: 'Gourmet Veggie Burger',
            price: 250,
            tax: 5,
            description: 'Spiced vegetable patty, fresh lettuce, heirloom tomatoes, and secret cafe sauce in brioche.',
            image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60'
        },
        {
            category: 'Artisan Sandwiches & Burgers',
            name: 'Grilled Pesto Panini',
            price: 230,
            tax: 5,
            description: 'Fresh basil pesto, grilled vegetables, and mozzarella pressed between crusty focaccia.',
            image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=60'
        },

        // Desserts
        {
            category: 'Desserts & Bakes',
            name: 'Sizzling Chocolate Brownie',
            price: 210,
            tax: 5,
            description: 'Fudgy warm walnut brownie served on a hot plate with vanilla bean ice cream.',
            image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60'
        },
        {
            category: 'Desserts & Bakes',
            name: 'New York Cheesecake',
            price: 260,
            tax: 5,
            description: 'Dense and creamy classic cheesecake on a buttery graham cracker crust.',
            image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=60'
        }
    ];

    for (const p of productsData) {
        const catId = categoryMap[p.category];
        const existing = await schemas.Product.findOne({ name: p.name });
        if (!existing) {
            await schemas.Product.create({
                id: uuidv4(),
                category_id: catId,
                name: p.name,
                price: p.price,
                tax_percentage: p.tax,
                description: p.description,
                image_url: p.image_url,
                is_available: true,
                is_active: true
            });
            console.log(`  + Created product: ${p.name} (₹${p.price})`);
        }
    }

    console.log('\n========================================');
    console.log('       MongoDB Seeding Complete!');
    console.log('========================================\n');
    console.log('Demo Accounts:');
    console.log('  Admin:    admin@cafe.com    / admin123');
    console.log('  Cashier:  cashier@cafe.com  / cashier123');
    console.log('  Kitchen:  kitchen@cafe.com  / kitchen123');
    console.log('  Customer: customer@cafe.com / customer123\n');

    process.exit(0);
}

seed().catch(err => {
    console.error('\n❌ Seeding failed:', err);
    process.exit(1);
});
