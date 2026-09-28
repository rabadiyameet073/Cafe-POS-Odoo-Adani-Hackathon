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
            image_url: 'https://images.unsplash.com/photo-1556008531-57e6eefc7be4?w=500&auto=format&fit=crop&q=60'
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

    // 5. Seed Table Sessions & Occupied Tables
    console.log('\n--- 5. Seeding Table Sessions & Live Timers ---');
    const nowMs = Date.now();
    const minAgo = (m) => new Date(nowMs - m * 60 * 1000);
    const minFromNow = (m) => new Date(nowMs + m * 60 * 1000);

    // Find table IDs
    const tableG2 = await schemas.Table.findOne({ table_number: 'G-2' });
    const tableF3 = await schemas.Table.findOne({ table_number: 'F-3' });
    const tableT2 = await schemas.Table.findOne({ table_number: 'T-2' });
    const tableG5 = await schemas.Table.findOne({ table_number: 'G-5' });
    const tableG1 = await schemas.Table.findOne({ table_number: 'G-1' });
    const tableF1 = await schemas.Table.findOne({ table_number: 'F-1' });
    const tableT1 = await schemas.Table.findOne({ table_number: 'T-1' });
    const tableG4 = await schemas.Table.findOne({ table_number: 'G-4' });

    if (tableG2) {
        await schemas.Table.updateOne({ id: tableG2.id }, {
            status: 'occupied',
            current_session_id: 'sess-g2',
            occupied_since: minAgo(14),
            occupied_until: minFromNow(25),
            qr_code_token: 'GF-T2'
        });
        await schemas.TableSession.deleteMany({ table_id: tableG2.id });
        await schemas.TableSession.create({
            id: 'sess-g2',
            table_id: tableG2.id,
            floor_id: tableG2.floor_id,
            table_number: 'G-2',
            table_token: 'GF-T2',
            customer_name: 'Walk-in Guest',
            status: 'active',
            timer_status: 'running',
            duration_minutes: 39,
            session_start: minAgo(14),
            timer_started_at: minAgo(14),
            timer_ends_at: minFromNow(25)
        });
        console.log('  + Table G-2 marked occupied with 25 mins remaining');
    }

    if (tableF3) {
        await schemas.Table.updateOne({ id: tableF3.id }, {
            status: 'occupied',
            current_session_id: 'sess-f3',
            occupied_since: minAgo(31),
            occupied_until: minFromNow(8),
            qr_code_token: 'FF-T3'
        });
        await schemas.TableSession.deleteMany({ table_id: tableF3.id });
        await schemas.TableSession.create({
            id: 'sess-f3',
            table_id: tableF3.id,
            floor_id: tableF3.floor_id,
            table_number: 'F-3',
            table_token: 'FF-T3',
            customer_name: 'Pooja & Friends',
            status: 'active',
            timer_status: 'running',
            duration_minutes: 39,
            session_start: minAgo(31),
            timer_started_at: minAgo(31),
            timer_ends_at: minFromNow(8)
        });
        console.log('  + Table F-3 marked occupied with 8 mins remaining');
    }

    if (tableT2) {
        await schemas.Table.updateOne({ id: tableT2.id }, {
            status: 'occupied',
            current_session_id: 'sess-t2',
            occupied_since: minAgo(5),
            occupied_until: minFromNow(34),
            qr_code_token: 'TR-T2'
        });
        await schemas.TableSession.deleteMany({ table_id: tableT2.id });
        await schemas.TableSession.create({
            id: 'sess-t2',
            table_id: tableT2.id,
            floor_id: tableT2.floor_id,
            table_number: 'T-2',
            table_token: 'TR-T2',
            customer_name: 'Rohan Sharma',
            status: 'active',
            timer_status: 'running',
            duration_minutes: 39,
            session_start: minAgo(5),
            timer_started_at: minAgo(5),
            timer_ends_at: minFromNow(34)
        });
        console.log('  + Table T-2 marked occupied with 34 mins remaining');
    }

    // 6. Seed Orders & Order Items
    console.log('\n--- 6. Seeding Orders, Items & Payments ---');
    const mockOrders = [
        {
            id: 'ord-1001',
            order_number: 'ORD-20260928-1001',
            table_id: tableG2?.id || 't2',
            table_number: 'G-2',
            table_token: 'GF-T2',
            session_id: 'sess-g2',
            subtotal: 330,
            tax_amount: 16.50,
            total_amount: 346.50,
            status: 'received',
            payment_status: 'paid',
            payment_method: 'upi',
            created_at: minAgo(14),
            payment_confirmed_at: minAgo(14),
            items: [
                { product_name: 'Masala Chai', quantity: 2, unit_price: 40, line_total: 80 },
                { product_name: 'Loaded Cheesy Nachos', quantity: 1, unit_price: 160, line_total: 160 },
                { product_name: 'Sizzling Chocolate Brownie', quantity: 1, unit_price: 90, line_total: 90 }
            ],
            payment: {
                id: 'pay-1001',
                amount: 346.50,
                payment_method: 'upi',
                status: 'completed',
                cashier_name: 'UPI Gateway',
                payment_confirmed_at: minAgo(14)
            },
            kitchen: {
                id: 'ko-1',
                status: 'received',
                stage: 'to_cook',
                priority: 0,
                received_at: minAgo(14)
            }
        },
        {
            id: 'ord-1002',
            order_number: 'ORD-20260928-1002',
            table_id: tableF3?.id || 't12',
            table_number: 'F-3',
            table_token: 'FF-T3',
            session_id: 'sess-f3',
            subtotal: 620,
            tax_amount: 31,
            total_amount: 651,
            status: 'preparing',
            payment_status: 'paid',
            payment_method: 'cash',
            created_at: minAgo(31),
            payment_confirmed_at: minAgo(30),
            items: [
                { product_name: 'Paneer Butter Masala', quantity: 1, unit_price: 220, line_total: 220 },
                { product_name: 'Veg Biryani', quantity: 1, unit_price: 180, line_total: 180 },
                { product_name: 'Cold Coffee', quantity: 2, unit_price: 110, line_total: 220 }
            ],
            payment: {
                id: 'pay-1002',
                amount: 651,
                payment_method: 'cash',
                status: 'approved',
                cashier_name: 'Cashier Staff',
                approved_at: minAgo(30),
                payment_confirmed_at: minAgo(30)
            },
            kitchen: {
                id: 'ko-2',
                status: 'preparing',
                stage: 'cooking',
                priority: 1,
                received_at: minAgo(30),
                started_preparing_at: minAgo(20)
            },
            cashierReq: {
                id: 'cpr-1002',
                status: 'approved',
                cashier_name: 'Cashier Staff',
                responded_at: minAgo(30)
            }
        },
        {
            id: 'ord-1003',
            order_number: 'ORD-20260928-1003',
            table_id: tableT2?.id || 't22',
            table_number: 'T-2',
            table_token: 'TR-T2',
            session_id: 'sess-t2',
            subtotal: 450,
            tax_amount: 22.50,
            total_amount: 472.50,
            status: 'ready',
            payment_status: 'paid',
            payment_method: 'upi',
            created_at: minAgo(22),
            payment_confirmed_at: minAgo(21),
            items: [
                { product_name: 'Cappuccino', quantity: 2, unit_price: 120, line_total: 240 },
                { product_name: 'New York Cheesecake', quantity: 1, unit_price: 210, line_total: 210 }
            ],
            payment: {
                id: 'pay-1003',
                amount: 472.50,
                payment_method: 'upi',
                status: 'completed',
                cashier_name: 'UPI Gateway',
                payment_confirmed_at: minAgo(21)
            },
            kitchen: {
                id: 'ko-3',
                status: 'ready',
                stage: 'ready',
                priority: 0,
                received_at: minAgo(21),
                started_preparing_at: minAgo(16),
                ready_at: minAgo(4)
            }
        },
        {
            id: 'ord-1004',
            order_number: 'ORD-20260928-1004',
            table_id: tableG5?.id || 't5',
            table_number: 'G-5',
            table_token: 'GF-T5',
            session_id: 'sess-g5',
            subtotal: 160,
            tax_amount: 8,
            total_amount: 168,
            status: 'payment_requested',
            payment_status: 'pending_cash',
            payment_method: 'cash',
            created_at: minAgo(3),
            items: [
                { product_name: 'Veg Samosa', quantity: 2, unit_price: 30, line_total: 60 },
                { product_name: 'Filter Coffee', quantity: 2, unit_price: 50, line_total: 100 }
            ],
            payment: {
                id: 'pay-1004',
                amount: 168,
                payment_method: 'cash',
                status: 'pending_approval'
            },
            cashierReq: {
                id: 'cpr-1004',
                status: 'pending'
            }
        },
        {
            id: 'ord-0901',
            order_number: 'ORD-20260928-0901',
            table_id: tableG1?.id || 't1',
            table_number: 'G-1',
            table_token: 'GF-T1',
            subtotal: 680,
            tax_amount: 34,
            total_amount: 714,
            status: 'completed',
            payment_status: 'paid',
            payment_method: 'upi',
            created_at: minAgo(65),
            payment_confirmed_at: minAgo(64),
            completed_at: minAgo(30),
            items: [
                { product_name: 'Gourmet Veggie Burger', quantity: 2, unit_price: 190, line_total: 380 },
                { product_name: 'Blended Caramel Frappe', quantity: 2, unit_price: 150, line_total: 300 }
            ],
            payment: {
                id: 'pay-0901',
                amount: 714,
                payment_method: 'upi',
                status: 'completed',
                cashier_name: 'UPI Gateway',
                payment_confirmed_at: minAgo(64)
            }
        },
        {
            id: 'ord-0902',
            order_number: 'ORD-20260928-0902',
            table_id: tableF1?.id || 't10',
            table_number: 'F-1',
            table_token: 'FF-T1',
            subtotal: 440,
            tax_amount: 22,
            total_amount: 462,
            status: 'completed',
            payment_status: 'paid',
            payment_method: 'cash',
            created_at: minAgo(130),
            payment_confirmed_at: minAgo(129),
            completed_at: minAgo(90),
            items: [
                { product_name: 'Dal Makhani', quantity: 1, unit_price: 180, line_total: 180 },
                { product_name: 'Veg Biryani', quantity: 1, unit_price: 180, line_total: 180 },
                { product_name: 'Masala Chai', quantity: 2, unit_price: 40, line_total: 80 }
            ],
            payment: {
                id: 'pay-0902',
                amount: 462,
                payment_method: 'cash',
                status: 'approved',
                cashier_name: 'Cashier Staff',
                approved_at: minAgo(129),
                payment_confirmed_at: minAgo(129)
            }
        },
        {
            id: 'ord-0903',
            order_number: 'ORD-20260928-0903',
            table_id: tableT1?.id || 't21',
            table_number: 'T-1',
            table_token: 'TR-T1',
            subtotal: 230,
            tax_amount: 11.50,
            total_amount: 241.50,
            status: 'completed',
            payment_status: 'paid',
            payment_method: 'upi',
            created_at: minAgo(190),
            payment_confirmed_at: minAgo(189),
            completed_at: minAgo(150),
            items: [
                { product_name: 'Sandwich', quantity: 1, unit_price: 80, line_total: 80 },
                { product_name: 'Crispy Peri Peri Fries', quantity: 1, unit_price: 90, line_total: 90 },
                { product_name: 'Lemon Soda', quantity: 1, unit_price: 60, line_total: 60 }
            ],
            payment: {
                id: 'pay-0903',
                amount: 241.50,
                payment_method: 'upi',
                status: 'completed',
                cashier_name: 'UPI Gateway',
                payment_confirmed_at: minAgo(189)
            }
        },
        {
            id: 'ord-0904',
            order_number: 'ORD-20260928-0904',
            table_id: tableG4?.id || 't4',
            table_number: 'G-4',
            table_token: 'GF-T4',
            subtotal: 480,
            tax_amount: 24,
            total_amount: 504,
            status: 'completed',
            payment_status: 'paid',
            payment_method: 'cash',
            created_at: minAgo(250),
            payment_confirmed_at: minAgo(249),
            completed_at: minAgo(210),
            items: [
                { product_name: 'Idli Sambar', quantity: 3, unit_price: 70, line_total: 210 },
                { product_name: 'Filter Coffee', quantity: 3, unit_price: 50, line_total: 150 },
                { product_name: 'Gulab Jamun', quantity: 2, unit_price: 60, line_total: 120 }
            ],
            payment: {
                id: 'pay-0904',
                amount: 504,
                payment_method: 'cash',
                status: 'approved',
                cashier_name: 'Cashier Staff',
                approved_at: minAgo(249),
                payment_confirmed_at: minAgo(249)
            }
        }
    ];

    for (const o of mockOrders) {
        await schemas.Order.deleteOne({ id: o.id });
        await schemas.Order.create({
            id: o.id,
            order_number: o.order_number,
            table_id: o.table_id,
            table_number: o.table_number,
            table_token: o.table_token,
            session_id: o.session_id,
            subtotal: o.subtotal,
            tax_amount: o.tax_amount,
            total_amount: o.total_amount,
            status: o.status,
            payment_status: o.payment_status,
            payment_method: o.payment_method,
            order_type: 'dine_in',
            is_deleted: false,
            created_at: o.created_at,
            payment_confirmed_at: o.payment_confirmed_at,
            completed_at: o.completed_at
        });

        // Seed items
        await schemas.OrderItem.deleteMany({ order_id: o.id });
        for (const item of o.items) {
            await schemas.OrderItem.create({
                id: uuidv4(),
                order_id: o.id,
                product_id: uuidv4(),
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                line_total: item.line_total,
                tax_percentage: 5,
                kitchen_status: o.status === 'completed' ? 'completed' : (o.kitchen ? o.kitchen.status : 'pending')
            });
        }

        // Seed payment
        if (o.payment) {
            await schemas.Payment.deleteOne({ id: o.payment.id });
            await schemas.Payment.create({
                id: o.payment.id,
                order_id: o.id,
                table_token: o.table_token,
                table_number: o.table_number,
                amount: o.payment.amount,
                payment_method: o.payment.payment_method,
                status: o.payment.status,
                cashier_name: o.payment.cashier_name,
                payment_confirmed_at: o.payment.payment_confirmed_at,
                approved_at: o.payment.approved_at,
                created_at: o.created_at
            });
        }

        // Seed kitchen order
        if (o.kitchen) {
            await schemas.KitchenOrder.deleteOne({ id: o.kitchen.id });
            await schemas.KitchenOrder.create({
                id: o.kitchen.id,
                order_id: o.id,
                order_number: o.order_number,
                table_number: o.table_number,
                table_token: o.table_token,
                status: o.kitchen.status,
                stage: o.kitchen.stage,
                payment_method: o.payment_method,
                items: o.items,
                priority: o.kitchen.priority,
                received_at: o.kitchen.received_at,
                started_preparing_at: o.kitchen.started_preparing_at,
                ready_at: o.kitchen.ready_at
            });
        }

        // Seed cashier request
        if (o.cashierReq) {
            await schemas.CashierPaymentRequest.deleteOne({ id: o.cashierReq.id });
            await schemas.CashierPaymentRequest.create({
                id: o.cashierReq.id,
                order_id: o.id,
                payment_id: o.payment.id,
                table_number: o.table_number,
                table_token: o.table_token,
                total_amount: o.total_amount,
                amount: o.total_amount,
                payment_method: 'cash',
                order_summary: o.items,
                status: o.cashierReq.status,
                cashier_name: o.cashierReq.cashier_name,
                responded_at: o.cashierReq.responded_at,
                created_at: o.created_at
            });
        }

        console.log(`  + Seeded order: ${o.order_number} (${o.status}, ₹${o.total_amount})`);
    }

    console.log('\n========================================');
    console.log('       MongoDB Seeding Complete!');
    console.log('========================================\n');
    console.log('Summary:');
    console.log('  Tables:          27 (G-1..9, F-1..11, T-1..7)');
    console.log('  Occupied Tables: 3  (G-2: 25m, F-3: 8m, T-2: 34m)');
    console.log('  Active Orders:   3  (1 Received, 1 Preparing, 1 Ready)');
    console.log('  Pending Cash:    1  (Table G-5, ₹168)');
    console.log('  Completed:       4  (Today Revenue: ₹3,391.50)\n');

    process.exit(0);
}

seed().catch(err => {
    console.error('\n❌ Seeding failed:', err);
    process.exit(1);
});
