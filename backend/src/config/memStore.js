/**
 * In-Memory Database Store
 * 
 * Full-featured in-memory store that seeds demo data for the Cafe POS system.
 * Used when MONGODB_URI is not configured. Data resets on each serverless cold start.
 * Supports all CRUD operations matching the MongoDB query builder API.
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// ─── Seed Data ─────────────────────────────────────────────────────────────────

function buildStore() {
    const nowMs = Date.now();
    const now = new Date(nowMs).toISOString();
    const minAgo = (m) => new Date(nowMs - m * 60 * 1000).toISOString();
    const minFromNow = (m) => new Date(nowMs + m * 60 * 1000).toISOString();

    // Users (both demo and production credentials supported)
    const users = [
        { id: '1', email: 'admin@demo.com', password_hash: bcrypt.hashSync('demo123', 10), full_name: 'Admin User', phone: '+91-9876543210', role: 'admin', is_active: true, created_at: now, updated_at: now },
        { id: '2', email: 'cashier@demo.com', password_hash: bcrypt.hashSync('demo123', 10), full_name: 'Riya Cashier', phone: '+91-9876543211', role: 'cashier', is_active: true, created_at: now, updated_at: now },
        { id: '3', email: 'kitchen@demo.com', password_hash: bcrypt.hashSync('demo123', 10), full_name: 'Chef Arun', phone: '+91-9876543212', role: 'kitchen', is_active: true, created_at: now, updated_at: now },
        { id: '4', email: 'customer@demo.com', password_hash: bcrypt.hashSync('demo123', 10), full_name: 'Customer User', phone: '+91-9876543213', role: 'customer', is_active: true, created_at: now, updated_at: now },
        { id: '5', email: 'admin@cafe.com', password_hash: bcrypt.hashSync('admin123', 10), full_name: 'Administrator', phone: '+91-9876543210', role: 'admin', is_active: true, created_at: now, updated_at: now },
        { id: '6', email: 'cashier@cafe.com', password_hash: bcrypt.hashSync('cashier123', 10), full_name: 'Cashier Staff', phone: '+91-9876543211', role: 'cashier', is_active: true, created_at: now, updated_at: now },
        { id: '7', email: 'kitchen@cafe.com', password_hash: bcrypt.hashSync('kitchen123', 10), full_name: 'Head Chef', phone: '+91-9876543212', role: 'kitchen', is_active: true, created_at: now, updated_at: now },
        { id: '8', email: 'customer@cafe.com', password_hash: bcrypt.hashSync('customer123', 10), full_name: 'Meet Rabadiya', role: 'customer', phone: '+91-9876543213', role: 'customer', is_active: true, created_at: now, updated_at: now },
    ];

    // Floors
    const floors = [
        { id: 'f1', name: 'Ground Floor', description: 'Main dining area with maximum seating and cashier counter', display_order: 1, is_active: true, created_at: now, updated_at: now },
        { id: 'f2', name: 'First Floor', description: 'Quiet seating area suitable for families and groups', display_order: 2, is_active: true, created_at: now, updated_at: now },
        { id: 'f3', name: 'Terrace', description: 'Open-air rooftop seating with city view', display_order: 3, is_active: true, created_at: now, updated_at: now },
    ];

    // Tables (All 27 tables from database/mock_data.sql — with active occupied sessions on G-2, F-3, T-2)
    const tables = [
        // Ground Floor (G-1 to G-9)
        { id: 't1', floor_id: 'f1', table_number: 'G-1', seats: 4, status: 'available', is_active: true, qr_code_token: 'GF-T1', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't2', floor_id: 'f1', table_number: 'G-2', seats: 4, status: 'occupied', is_active: true, qr_code_token: 'GF-T2', current_session_id: 'sess-g2', occupied_since: minAgo(14), occupied_until: minFromNow(25), created_at: minAgo(120), updated_at: minAgo(14) },
        { id: 't3', floor_id: 'f1', table_number: 'G-3', seats: 2, status: 'available', is_active: true, qr_code_token: 'GF-T3', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't4', floor_id: 'f1', table_number: 'G-4', seats: 6, status: 'available', is_active: true, qr_code_token: 'GF-T4', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't5', floor_id: 'f1', table_number: 'G-5', seats: 4, status: 'available', is_active: true, qr_code_token: 'GF-T5', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't6', floor_id: 'f1', table_number: 'G-6', seats: 2, status: 'available', is_active: true, qr_code_token: 'GF-T6', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't7', floor_id: 'f1', table_number: 'G-7', seats: 8, status: 'available', is_active: true, qr_code_token: 'GF-T7', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't8', floor_id: 'f1', table_number: 'G-8', seats: 4, status: 'available', is_active: true, qr_code_token: 'GF-T8', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't9', floor_id: 'f1', table_number: 'G-9', seats: 2, status: 'available', is_active: true, qr_code_token: 'GF-T9', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },

        // First Floor (F-1 to F-11)
        { id: 't10', floor_id: 'f2', table_number: 'F-1', seats: 4, status: 'available', is_active: true, qr_code_token: 'FF-T1', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't11', floor_id: 'f2', table_number: 'F-2', seats: 4, status: 'available', is_active: true, qr_code_token: 'FF-T2', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't12', floor_id: 'f2', table_number: 'F-3', seats: 6, status: 'occupied', is_active: true, qr_code_token: 'FF-T3', current_session_id: 'sess-f3', occupied_since: minAgo(31), occupied_until: minFromNow(8), created_at: minAgo(120), updated_at: minAgo(31) },
        { id: 't13', floor_id: 'f2', table_number: 'F-4', seats: 2, status: 'available', is_active: true, qr_code_token: 'FF-T4', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't14', floor_id: 'f2', table_number: 'F-5', seats: 8, status: 'available', is_active: true, qr_code_token: 'FF-T5', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't15', floor_id: 'f2', table_number: 'F-6', seats: 4, status: 'available', is_active: true, qr_code_token: 'FF-T6', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't16', floor_id: 'f2', table_number: 'F-7', seats: 2, status: 'available', is_active: true, qr_code_token: 'FF-T7', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't17', floor_id: 'f2', table_number: 'F-8', seats: 6, status: 'available', is_active: true, qr_code_token: 'FF-T8', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't18', floor_id: 'f2', table_number: 'F-9', seats: 4, status: 'available', is_active: true, qr_code_token: 'FF-T9', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't19', floor_id: 'f2', table_number: 'F-10', seats: 2, status: 'available', is_active: true, qr_code_token: 'FF-T10', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't20', floor_id: 'f2', table_number: 'F-11', seats: 4, status: 'available', is_active: true, qr_code_token: 'FF-T11', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },

        // Terrace (T-1 to T-7)
        { id: 't21', floor_id: 'f3', table_number: 'T-1', seats: 4, status: 'available', is_active: true, qr_code_token: 'TR-T1', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't22', floor_id: 'f3', table_number: 'T-2', seats: 2, status: 'occupied', is_active: true, qr_code_token: 'TR-T2', current_session_id: 'sess-t2', occupied_since: minAgo(5), occupied_until: minFromNow(34), created_at: minAgo(120), updated_at: minAgo(5) },
        { id: 't23', floor_id: 'f3', table_number: 'T-3', seats: 6, status: 'available', is_active: true, qr_code_token: 'TR-T3', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't24', floor_id: 'f3', table_number: 'T-4', seats: 4, status: 'available', is_active: true, qr_code_token: 'TR-T4', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't25', floor_id: 'f3', table_number: 'T-5', seats: 8, status: 'available', is_active: true, qr_code_token: 'TR-T5', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't26', floor_id: 'f3', table_number: 'T-6', seats: 2, status: 'available', is_active: true, qr_code_token: 'TR-T6', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't27', floor_id: 'f3', table_number: 'T-7', seats: 4, status: 'available', is_active: true, qr_code_token: 'TR-T7', current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
    ];

    // Product Categories
    const product_categories = [
        { id: 'c1', name: 'Hot Beverages', description: 'Teas, coffees & more', icon_emoji: '☕', send_to_kitchen: false, display_order: 1, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'c2', name: 'Cold Beverages', description: 'Cold drinks & shakes', icon_emoji: '🥤', send_to_kitchen: false, display_order: 2, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'c3', name: 'Snacks', description: 'Quick bites & snacks', icon_emoji: '🍟', send_to_kitchen: true, display_order: 3, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'c4', name: 'Main Course', description: 'Full meals & mains', icon_emoji: '🍽️', send_to_kitchen: true, display_order: 4, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'c5', name: 'Desserts', description: 'Sweets & desserts', icon_emoji: '🍰', send_to_kitchen: true, display_order: 5, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'c6', name: 'Breakfast', description: 'Morning specials', icon_emoji: '🍳', send_to_kitchen: true, display_order: 6, is_active: true, is_deleted: false, created_at: now, updated_at: now },
    ];

    // Products
    const products = [
        { id: 'p1', name: 'Masala Chai', category_id: 'c1', price: 40, unit: 'cup', tax_percentage: 5, description: 'Spiced Indian tea with milk, fresh cardamom and ginger', image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80', display_order: 1, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p2', name: 'Filter Coffee', category_id: 'c1', price: 50, unit: 'cup', tax_percentage: 5, description: 'Authentic South Indian chicory filter coffee', image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80', display_order: 2, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p3', name: 'Cappuccino', category_id: 'c1', price: 120, unit: 'cup', tax_percentage: 5, description: 'Double shot espresso with creamy micro-foam', image_url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=80', display_order: 3, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p4', name: 'Green Tea', category_id: 'c1', price: 60, unit: 'cup', tax_percentage: 5, description: 'Antioxidant-rich whole leaf organic green tea', image_url: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=500&auto=format&fit=crop&q=80', display_order: 4, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p5', name: 'Classic Espresso', category_id: 'c1', price: 90, unit: 'cup', tax_percentage: 5, description: 'Rich bold single shot espresso with golden crema', image_url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500&auto=format&fit=crop&q=80', display_order: 5, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p6', name: 'Cold Coffee', category_id: 'c2', price: 110, unit: 'glass', tax_percentage: 5, description: 'Chilled blended coffee topped with vanilla ice cream', image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80', display_order: 1, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p7', name: 'Mango Shake', category_id: 'c2', price: 130, unit: 'glass', tax_percentage: 5, description: 'Thick fresh Alphonso mango pulp milkshake', image_url: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=500&auto=format&fit=crop&q=80', display_order: 2, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p8', name: 'Lemon Soda', category_id: 'c2', price: 60, unit: 'glass', tax_percentage: 5, description: 'Sparkling freshly squeezed lime soda with mint', image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed514?w=500&auto=format&fit=crop&q=80', display_order: 3, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p9', name: 'Caramel Frappe', category_id: 'c2', price: 150, unit: 'glass', tax_percentage: 5, description: 'Iced frappe with salted caramel drizzle and whipped cream', image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80', display_order: 4, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p10', name: 'Veg Samosa', category_id: 'c3', price: 30, unit: 'piece', tax_percentage: 5, description: 'Crispy pastry stuffed with spiced potato and peas', image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80', display_order: 1, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p11', name: 'French Fries', category_id: 'c3', price: 90, unit: 'plate', tax_percentage: 5, description: 'Hot salted golden potato fries with dipping mayo', image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80', display_order: 2, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p12', name: 'Sandwich', category_id: 'c3', price: 80, unit: 'piece', tax_percentage: 5, description: 'Grilled triple-layer cheese and garden veg sandwich', image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80', display_order: 3, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p13', name: 'Loaded Nachos', category_id: 'c3', price: 160, unit: 'plate', tax_percentage: 5, description: 'Corn tortilla chips smothered in warm cheese and salsa', image_url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&auto=format&fit=crop&q=80', display_order: 4, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p14', name: 'Garlic Bread', category_id: 'c3', price: 140, unit: 'plate', tax_percentage: 5, description: 'Toasted baguette with garlic butter and melted mozzarella', image_url: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500&auto=format&fit=crop&q=80', display_order: 5, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p15', name: 'Veg Biryani', category_id: 'c4', price: 180, unit: 'plate', tax_percentage: 5, description: 'Fragrant basmati rice dum-cooked with vegetables and spices', image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80', display_order: 1, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p16', name: 'Paneer Butter Masala', category_id: 'c4', price: 220, unit: 'plate', tax_percentage: 5, description: 'Succulent paneer cubes simmered in velvety tomato gravy', image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80', display_order: 2, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p17', name: 'Dal Makhani', category_id: 'c4', price: 180, unit: 'plate', tax_percentage: 5, description: 'Overnight slow-cooked black lentils in creamy butter sauce', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80', display_order: 3, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p18', name: 'Veggie Burger', category_id: 'c4', price: 190, unit: 'piece', tax_percentage: 5, description: 'Crispy seasoned vegetable patty in soft brioche bun', image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80', display_order: 4, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p19', name: 'Gulab Jamun', category_id: 'c5', price: 60, unit: 'piece', tax_percentage: 5, description: 'Soft golden milk-solid dumplings soaked in rose syrup', image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=80', display_order: 1, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p20', name: 'Brownie', category_id: 'c5', price: 90, unit: 'piece', tax_percentage: 5, description: 'Warm fudgy dark chocolate walnut brownie', image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80', display_order: 2, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p21', name: 'New York Cheesecake', category_id: 'c5', price: 210, unit: 'piece', tax_percentage: 5, description: 'Velvety classic cheesecake on graham cracker crust', image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=80', display_order: 3, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p22', name: 'Poha', category_id: 'c6', price: 60, unit: 'plate', tax_percentage: 5, description: 'Steamed flattened rice tempered with mustard, onions & peanuts', image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80', display_order: 1, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p23', name: 'Idli Sambar', category_id: 'c6', price: 70, unit: 'plate', tax_percentage: 5, description: 'Soft steamed rice idlis served with hot sambar and chutney', image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80', display_order: 2, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p24', name: 'Upma', category_id: 'c6', price: 65, unit: 'plate', tax_percentage: 5, description: 'Savory roasted semolina porridge with garden vegetables', image_url: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=500&auto=format&fit=crop&q=80', display_order: 3, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
    ];

    const product_variants = [];

    // Table Sessions (Active sessions with live 39-minute countdown timers)
    const table_sessions = [
        {
            id: 'sess-g2',
            table_id: 't2',
            floor_id: 'f1',
            table_number: 'G-2',
            table_token: 'GF-T2',
            customer_name: 'Walk-in Guest',
            status: 'active',
            timer_status: 'running',
            duration_minutes: 39,
            session_start: minAgo(14),
            timer_started_at: minAgo(14),
            timer_ends_at: minFromNow(25),
            created_at: minAgo(14),
            updated_at: minAgo(14)
        },
        {
            id: 'sess-f3',
            table_id: 't12',
            floor_id: 'f2',
            table_number: 'F-3',
            table_token: 'FF-T3',
            customer_name: 'Pooja & Friends',
            status: 'active',
            timer_status: 'running',
            duration_minutes: 39,
            session_start: minAgo(31),
            timer_started_at: minAgo(31),
            timer_ends_at: minFromNow(8),
            created_at: minAgo(31),
            updated_at: minAgo(31)
        },
        {
            id: 'sess-t2',
            table_id: 't22',
            floor_id: 'f3',
            table_number: 'T-2',
            table_token: 'TR-T2',
            customer_name: 'Rohan Sharma',
            status: 'active',
            timer_status: 'running',
            duration_minutes: 39,
            session_start: minAgo(5),
            timer_started_at: minAgo(5),
            timer_ends_at: minFromNow(34),
            created_at: minAgo(5),
            updated_at: minAgo(5)
        }
    ];

    const table_timer_logs = [
        { id: 'ttl-1', session_id: 'sess-g2', table_id: 't2', table_token: 'GF-T2', action: 'started', duration_minutes: 39, timer_started_at: minAgo(14), timer_ends_at: minFromNow(25), status: 'running', created_at: minAgo(14), updated_at: minAgo(14) },
        { id: 'ttl-2', session_id: 'sess-f3', table_id: 't12', table_token: 'FF-T3', action: 'started', duration_minutes: 39, timer_started_at: minAgo(31), timer_ends_at: minFromNow(8), status: 'running', created_at: minAgo(31), updated_at: minAgo(31) },
        { id: 'ttl-3', session_id: 'sess-t2', table_id: 't22', table_token: 'TR-T2', action: 'started', duration_minutes: 39, timer_started_at: minAgo(5), timer_ends_at: minFromNow(34), status: 'running', created_at: minAgo(5), updated_at: minAgo(5) },
    ];

    // Orders (Active kitchen orders + completed orders for real-time dashboard analytics)
    const orders = [
        {
            id: 'ord-1001',
            order_number: 'ORD-20260928-1001',
            table_id: 't2',
            table_number: 'G-2',
            table_token: 'GF-T2',
            session_id: 'sess-g2',
            customer_id: '4',
            subtotal: 330,
            tax_amount: 16.50,
            total_amount: 346.50,
            status: 'received',
            payment_status: 'paid',
            payment_method: 'upi',
            order_type: 'dine_in',
            is_deleted: false,
            created_at: minAgo(14),
            payment_confirmed_at: minAgo(14),
            sent_to_kitchen_at: minAgo(14),
            updated_at: minAgo(14)
        },
        {
            id: 'ord-1002',
            order_number: 'ORD-20260928-1002',
            table_id: 't12',
            table_number: 'F-3',
            table_token: 'FF-T3',
            session_id: 'sess-f3',
            customer_id: '4',
            subtotal: 620,
            tax_amount: 31,
            total_amount: 651,
            status: 'preparing',
            payment_status: 'paid',
            payment_method: 'cash',
            order_type: 'dine_in',
            is_deleted: false,
            created_at: minAgo(31),
            payment_confirmed_at: minAgo(30),
            sent_to_kitchen_at: minAgo(30),
            updated_at: minAgo(20)
        },
        {
            id: 'ord-1003',
            order_number: 'ORD-20260928-1003',
            table_id: 't22',
            table_number: 'T-2',
            table_token: 'TR-T2',
            session_id: 'sess-t2',
            customer_id: '8',
            subtotal: 450,
            tax_amount: 22.50,
            total_amount: 472.50,
            status: 'ready',
            payment_status: 'paid',
            payment_method: 'upi',
            order_type: 'dine_in',
            is_deleted: false,
            created_at: minAgo(22),
            payment_confirmed_at: minAgo(21),
            sent_to_kitchen_at: minAgo(21),
            ready_at: minAgo(4),
            updated_at: minAgo(4)
        },
        {
            id: 'ord-1004',
            order_number: 'ORD-20260928-1004',
            table_id: 't5',
            table_number: 'G-5',
            table_token: 'GF-T5',
            session_id: 'sess-g5',
            customer_id: '8',
            subtotal: 160,
            tax_amount: 8,
            total_amount: 168,
            status: 'payment_requested',
            payment_status: 'pending_cash',
            payment_method: 'cash',
            order_type: 'dine_in',
            is_deleted: false,
            created_at: minAgo(3),
            updated_at: minAgo(3)
        },
        {
            id: 'ord-0901',
            order_number: 'ORD-20260928-0901',
            table_id: 't1',
            table_number: 'G-1',
            table_token: 'GF-T1',
            session_id: 'sess-prev1',
            subtotal: 680,
            tax_amount: 34,
            total_amount: 714,
            status: 'completed',
            payment_status: 'paid',
            payment_method: 'upi',
            order_type: 'dine_in',
            is_deleted: false,
            created_at: minAgo(65),
            payment_confirmed_at: minAgo(64),
            completed_at: minAgo(30),
            updated_at: minAgo(30)
        },
        {
            id: 'ord-0902',
            order_number: 'ORD-20260928-0902',
            table_id: 't10',
            table_number: 'F-1',
            table_token: 'FF-T1',
            session_id: 'sess-prev2',
            subtotal: 440,
            tax_amount: 22,
            total_amount: 462,
            status: 'completed',
            payment_status: 'paid',
            payment_method: 'cash',
            order_type: 'dine_in',
            is_deleted: false,
            created_at: minAgo(130),
            payment_confirmed_at: minAgo(129),
            completed_at: minAgo(90),
            updated_at: minAgo(90)
        },
        {
            id: 'ord-0903',
            order_number: 'ORD-20260928-0903',
            table_id: 't21',
            table_number: 'T-1',
            table_token: 'TR-T1',
            session_id: 'sess-prev3',
            subtotal: 230,
            tax_amount: 11.50,
            total_amount: 241.50,
            status: 'completed',
            payment_status: 'paid',
            payment_method: 'upi',
            order_type: 'dine_in',
            is_deleted: false,
            created_at: minAgo(190),
            payment_confirmed_at: minAgo(189),
            completed_at: minAgo(150),
            updated_at: minAgo(150)
        },
        {
            id: 'ord-0904',
            order_number: 'ORD-20260928-0904',
            table_id: 't4',
            table_number: 'G-4',
            table_token: 'GF-T4',
            session_id: 'sess-prev4',
            subtotal: 480,
            tax_amount: 24,
            total_amount: 504,
            status: 'completed',
            payment_status: 'paid',
            payment_method: 'cash',
            order_type: 'dine_in',
            is_deleted: false,
            created_at: minAgo(250),
            payment_confirmed_at: minAgo(249),
            completed_at: minAgo(210),
            updated_at: minAgo(210)
        }
    ];

    // Order Items
    const order_items = [
        // For ord-1001 (G-2)
        { id: 'oi-1', order_id: 'ord-1001', product_id: 'p1', product_name: 'Masala Chai', quantity: 2, unit_price: 40, tax_percentage: 5, line_total: 80, kitchen_status: 'received', created_at: minAgo(14), updated_at: minAgo(14) },
        { id: 'oi-2', order_id: 'ord-1001', product_id: 'p13', product_name: 'Loaded Nachos', quantity: 1, unit_price: 160, tax_percentage: 5, line_total: 160, kitchen_status: 'received', created_at: minAgo(14), updated_at: minAgo(14) },
        { id: 'oi-3', order_id: 'ord-1001', product_id: 'p20', product_name: 'Brownie', quantity: 1, unit_price: 90, tax_percentage: 5, line_total: 90, kitchen_status: 'received', created_at: minAgo(14), updated_at: minAgo(14) },

        // For ord-1002 (F-3)
        { id: 'oi-4', order_id: 'ord-1002', product_id: 'p16', product_name: 'Paneer Butter Masala', quantity: 1, unit_price: 220, tax_percentage: 5, line_total: 220, kitchen_status: 'preparing', created_at: minAgo(31), updated_at: minAgo(20) },
        { id: 'oi-5', order_id: 'ord-1002', product_id: 'p15', product_name: 'Veg Biryani', quantity: 1, unit_price: 180, tax_percentage: 5, line_total: 180, kitchen_status: 'preparing', created_at: minAgo(31), updated_at: minAgo(20) },
        { id: 'oi-6', order_id: 'ord-1002', product_id: 'p6', product_name: 'Cold Coffee', quantity: 2, unit_price: 110, tax_percentage: 5, line_total: 220, kitchen_status: 'preparing', created_at: minAgo(31), updated_at: minAgo(20) },

        // For ord-1003 (T-2)
        { id: 'oi-7', order_id: 'ord-1003', product_id: 'p3', product_name: 'Cappuccino', quantity: 2, unit_price: 120, tax_percentage: 5, line_total: 240, kitchen_status: 'ready', created_at: minAgo(22), updated_at: minAgo(4) },
        { id: 'oi-8', order_id: 'ord-1003', product_id: 'p21', product_name: 'New York Cheesecake', quantity: 1, unit_price: 210, tax_percentage: 5, line_total: 210, kitchen_status: 'ready', created_at: minAgo(22), updated_at: minAgo(4) },

        // For ord-1004 (G-5)
        { id: 'oi-9', order_id: 'ord-1004', product_id: 'p10', product_name: 'Veg Samosa', quantity: 2, unit_price: 30, tax_percentage: 5, line_total: 60, kitchen_status: 'pending', created_at: minAgo(3), updated_at: minAgo(3) },
        { id: 'oi-10', order_id: 'ord-1004', product_id: 'p2', product_name: 'Filter Coffee', quantity: 2, unit_price: 50, tax_percentage: 5, line_total: 100, kitchen_status: 'pending', created_at: minAgo(3), updated_at: minAgo(3) },

        // For ord-0901 (G-1)
        { id: 'oi-11', order_id: 'ord-0901', product_id: 'p18', product_name: 'Veggie Burger', quantity: 2, unit_price: 190, tax_percentage: 5, line_total: 380, kitchen_status: 'completed', is_completed: true, created_at: minAgo(65), updated_at: minAgo(30) },
        { id: 'oi-12', order_id: 'ord-0901', product_id: 'p9', product_name: 'Caramel Frappe', quantity: 2, unit_price: 150, tax_percentage: 5, line_total: 300, kitchen_status: 'completed', is_completed: true, created_at: minAgo(65), updated_at: minAgo(30) },

        // For ord-0902 (F-1)
        { id: 'oi-13', order_id: 'ord-0902', product_id: 'p17', product_name: 'Dal Makhani', quantity: 1, unit_price: 180, tax_percentage: 5, line_total: 180, kitchen_status: 'completed', is_completed: true, created_at: minAgo(130), updated_at: minAgo(90) },
        { id: 'oi-14', order_id: 'ord-0902', product_id: 'p15', product_name: 'Veg Biryani', quantity: 1, unit_price: 180, tax_percentage: 5, line_total: 180, kitchen_status: 'completed', is_completed: true, created_at: minAgo(130), updated_at: minAgo(90) },
        { id: 'oi-15', order_id: 'ord-0902', product_id: 'p1', product_name: 'Masala Chai', quantity: 2, unit_price: 40, tax_percentage: 5, line_total: 80, kitchen_status: 'completed', is_completed: true, created_at: minAgo(130), updated_at: minAgo(90) },

        // For ord-0903 (T-1)
        { id: 'oi-16', order_id: 'ord-0903', product_id: 'p12', product_name: 'Sandwich', quantity: 1, unit_price: 80, tax_percentage: 5, line_total: 80, kitchen_status: 'completed', is_completed: true, created_at: minAgo(190), updated_at: minAgo(150) },
        { id: 'oi-17', order_id: 'ord-0903', product_id: 'p11', product_name: 'French Fries', quantity: 1, unit_price: 90, tax_percentage: 5, line_total: 90, kitchen_status: 'completed', is_completed: true, created_at: minAgo(190), updated_at: minAgo(150) },
        { id: 'oi-18', order_id: 'ord-0903', product_id: 'p8', product_name: 'Lemon Soda', quantity: 1, unit_price: 60, tax_percentage: 5, line_total: 60, kitchen_status: 'completed', is_completed: true, created_at: minAgo(190), updated_at: minAgo(150) },

        // For ord-0904 (G-4)
        { id: 'oi-19', order_id: 'ord-0904', product_id: 'p23', product_name: 'Idli Sambar', quantity: 3, unit_price: 70, tax_percentage: 5, line_total: 210, kitchen_status: 'completed', is_completed: true, created_at: minAgo(250), updated_at: minAgo(210) },
        { id: 'oi-20', order_id: 'ord-0904', product_id: 'p2', product_name: 'Filter Coffee', quantity: 3, unit_price: 50, tax_percentage: 5, line_total: 150, kitchen_status: 'completed', is_completed: true, created_at: minAgo(250), updated_at: minAgo(210) },
        { id: 'oi-21', order_id: 'ord-0904', product_id: 'p19', product_name: 'Gulab Jamun', quantity: 2, unit_price: 60, tax_percentage: 5, line_total: 120, kitchen_status: 'completed', is_completed: true, created_at: minAgo(250), updated_at: minAgo(210) }
    ];

    // Payments (Today's revenue ~₹3,391.50)
    const payments = [
        {
            id: 'pay-1001',
            order_id: 'ord-1001',
            table_token: 'GF-T2',
            table_number: 'G-2',
            amount: 346.50,
            payment_method: 'upi',
            status: 'completed',
            cashier_name: 'UPI Gateway',
            payment_confirmed_at: minAgo(14),
            created_at: minAgo(14),
            updated_at: minAgo(14)
        },
        {
            id: 'pay-1002',
            order_id: 'ord-1002',
            table_token: 'FF-T3',
            table_number: 'F-3',
            amount: 651,
            payment_method: 'cash',
            status: 'approved',
            cashier_name: 'Riya Cashier',
            approved_at: minAgo(30),
            payment_confirmed_at: minAgo(30),
            created_at: minAgo(31),
            updated_at: minAgo(30)
        },
        {
            id: 'pay-1003',
            order_id: 'ord-1003',
            table_token: 'TR-T2',
            table_number: 'T-2',
            amount: 472.50,
            payment_method: 'upi',
            status: 'completed',
            cashier_name: 'UPI Gateway',
            payment_confirmed_at: minAgo(21),
            created_at: minAgo(22),
            updated_at: minAgo(21)
        },
        {
            id: 'pay-1004',
            order_id: 'ord-1004',
            table_token: 'GF-T5',
            table_number: 'G-5',
            amount: 168,
            payment_method: 'cash',
            status: 'pending_approval',
            cashier_name: null,
            created_at: minAgo(3),
            updated_at: minAgo(3)
        },
        {
            id: 'pay-0901',
            order_id: 'ord-0901',
            table_token: 'GF-T1',
            table_number: 'G-1',
            amount: 714,
            payment_method: 'upi',
            status: 'completed',
            cashier_name: 'UPI Gateway',
            payment_confirmed_at: minAgo(64),
            created_at: minAgo(65),
            updated_at: minAgo(64)
        },
        {
            id: 'pay-0902',
            order_id: 'ord-0902',
            table_token: 'FF-T1',
            table_number: 'F-1',
            amount: 462,
            payment_method: 'cash',
            status: 'approved',
            cashier_name: 'Riya Cashier',
            approved_at: minAgo(129),
            payment_confirmed_at: minAgo(129),
            created_at: minAgo(130),
            updated_at: minAgo(129)
        },
        {
            id: 'pay-0903',
            order_id: 'ord-0903',
            table_token: 'TR-T1',
            table_number: 'T-1',
            amount: 241.50,
            payment_method: 'upi',
            status: 'completed',
            cashier_name: 'UPI Gateway',
            payment_confirmed_at: minAgo(189),
            created_at: minAgo(190),
            updated_at: minAgo(189)
        },
        {
            id: 'pay-0904',
            order_id: 'ord-0904',
            table_token: 'GF-T4',
            table_number: 'G-4',
            amount: 504,
            payment_method: 'cash',
            status: 'approved',
            cashier_name: 'Riya Cashier',
            approved_at: minAgo(249),
            payment_confirmed_at: minAgo(249),
            created_at: minAgo(250),
            updated_at: minAgo(249)
        }
    ];

    // Cashier Payment Requests (1 pending cash approval for Table G-5, 1 approved in history)
    const cashier_payment_requests = [
        {
            id: 'cpr-1004',
            order_id: 'ord-1004',
            payment_id: 'pay-1004',
            table_number: 'G-5',
            table_token: 'GF-T5',
            total_amount: 168,
            amount: 168,
            payment_method: 'cash',
            order_summary: [
                { product_name: 'Veg Samosa', quantity: 2, unit_price: 30, line_total: 60 },
                { product_name: 'Filter Coffee', quantity: 2, unit_price: 50, line_total: 100 }
            ],
            status: 'pending',
            created_at: minAgo(3),
            updated_at: minAgo(3)
        },
        {
            id: 'cpr-1002',
            order_id: 'ord-1002',
            payment_id: 'pay-1002',
            table_number: 'F-3',
            table_token: 'FF-T3',
            total_amount: 651,
            amount: 651,
            payment_method: 'cash',
            order_summary: [
                { product_name: 'Paneer Butter Masala', quantity: 1, unit_price: 220, line_total: 220 },
                { product_name: 'Veg Biryani', quantity: 1, unit_price: 180, line_total: 180 },
                { product_name: 'Cold Coffee', quantity: 2, unit_price: 110, line_total: 220 }
            ],
            status: 'approved',
            cashier_name: 'Riya Cashier',
            responded_at: minAgo(30),
            created_at: minAgo(31),
            updated_at: minAgo(30)
        }
    ];

    // Kitchen Orders (1 Received, 1 Preparing, 1 Ready)
    const kitchen_orders = [
        {
            id: 'ko-1',
            order_id: 'ord-1001',
            order_number: 'ORD-20260928-1001',
            table_number: 'G-2',
            table_token: 'GF-T2',
            status: 'received',
            stage: 'to_cook',
            payment_method: 'upi',
            items: [
                { product_name: 'Masala Chai', quantity: 2, unit_price: 40 },
                { product_name: 'Loaded Nachos', quantity: 1, unit_price: 160 },
                { product_name: 'Brownie', quantity: 1, unit_price: 90 }
            ],
            priority: 0,
            received_at: minAgo(14),
            created_at: minAgo(14),
            updated_at: minAgo(14)
        },
        {
            id: 'ko-2',
            order_id: 'ord-1002',
            order_number: 'ORD-20260928-1002',
            table_number: 'F-3',
            table_token: 'FF-T3',
            status: 'preparing',
            stage: 'cooking',
            payment_method: 'cash',
            items: [
                { product_name: 'Paneer Butter Masala', quantity: 1, unit_price: 220 },
                { product_name: 'Veg Biryani', quantity: 1, unit_price: 180 },
                { product_name: 'Cold Coffee', quantity: 2, unit_price: 110 }
            ],
            priority: 1,
            received_at: minAgo(30),
            started_preparing_at: minAgo(20),
            created_at: minAgo(30),
            updated_at: minAgo(20)
        },
        {
            id: 'ko-3',
            order_id: 'ord-1003',
            order_number: 'ORD-20260928-1003',
            table_number: 'T-2',
            table_token: 'TR-T2',
            status: 'ready',
            stage: 'ready',
            payment_method: 'upi',
            items: [
                { product_name: 'Cappuccino', quantity: 2, unit_price: 120 },
                { product_name: 'New York Cheesecake', quantity: 1, unit_price: 210 }
            ],
            priority: 0,
            received_at: minAgo(21),
            started_preparing_at: minAgo(16),
            ready_at: minAgo(4),
            created_at: minAgo(21),
            updated_at: minAgo(4)
        }
    ];

    // Customer Feedback
    const customer_feedback = [
        {
            id: 'fb-1',
            order_id: 'ord-0901',
            table_number: 'G-1',
            table_token: 'GF-T1',
            overall_rating: 5,
            food_quality_rating: 5,
            service_rating: 5,
            service_speed_rating: 4,
            payment_experience_rating: 5,
            comment: 'Fantastic caramel frappe and the veggie burger was so crispy! Fast QR checkout.',
            created_at: minAgo(28),
            updated_at: minAgo(28)
        },
        {
            id: 'fb-2',
            order_id: 'ord-0902',
            table_number: 'F-1',
            table_token: 'FF-T1',
            overall_rating: 5,
            food_quality_rating: 5,
            service_rating: 4,
            service_speed_rating: 5,
            payment_experience_rating: 5,
            comment: 'Dal makhani was exceptionally rich. Cashier was friendly and prompt.',
            created_at: minAgo(85),
            updated_at: minAgo(85)
        }
    ];
    const feedback = customer_feedback;
    const pos_sessions = [];
    const pos_terminals = [
        { id: 'pt1', terminal_name: 'POS-01', location: 'Main Counter', last_closing_amount: 0, is_active: true, created_at: now, updated_at: now }
    ];
    const payment_methods = [
        { id: 'pm1', name: 'cash', display_name: 'Cash', is_enabled: true, upi_id: null, config: {}, created_at: now, updated_at: now },
        { id: 'pm2', name: 'upi', display_name: 'UPI / QR Code', is_enabled: true, upi_id: 'rabadiyameet09@okaxis', config: {}, created_at: now, updated_at: now },
    ];
    const self_order_tokens = [];
    const audit_logs = [];
    const reports_cache = [];

    return {
        users, floors, tables, product_categories, products, product_variants,
        table_sessions, table_timer_logs, orders, order_items, payments,
        cashier_payment_requests, kitchen_orders, feedback, customer_feedback,
        pos_sessions, pos_terminals, payment_methods, self_order_tokens,
        audit_logs, reports_cache
    };
}

// Singleton store — shared across all requires in the same serverless container
let _store = null;

function getStore() {
    if (!_store) _store = buildStore();
    return _store;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function matchesFilter(doc, filter) {
    for (const [key, value] of Object.entries(filter)) {
        if (value === undefined) continue;
        const docVal = doc[key];

        // Special handling for soft delete flag: if filter expects false, accept false, null, or undefined
        if (key === 'is_deleted' && value === false) {
            if (docVal === true) return false;
            continue;
        }

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            // MongoDB-style operators
            if (value.$ne !== undefined && docVal === value.$ne) return false;
            if (value.$in !== undefined && !value.$in.includes(docVal)) return false;
            if (value.$nin !== undefined && value.$nin.includes(docVal)) return false;
            if (value.$gt !== undefined && !(docVal > value.$gt)) return false;
            if (value.$gte !== undefined && !(docVal >= value.$gte)) return false;
            if (value.$lt !== undefined && !(docVal < value.$lt)) return false;
            if (value.$lte !== undefined && !(docVal <= value.$lte)) return false;
            if (value.$regex !== undefined) {
                const re = value.$regex instanceof RegExp ? value.$regex : new RegExp(value.$regex, value.$options || 'i');
                if (!re.test(String(docVal))) return false;
            }
        } else {
            if (docVal !== value) return false;
        }
    }
    return true;
}

function cloneDeep(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// ─── In-Memory Query Builder ──────────────────────────────────────────────────

class MemQueryBuilder {
    constructor(tableName) {
        this.tableName = tableName;
        this.operation = 'select';
        this.filter = {};
        this.sortField = null;
        this.sortAsc = true;
        this.limitCount = null;
        this.isSingle = false;
        this.isMaybeSingle = false;
        this.mutationData = null;
        this.selectedFields = '*';
        this.selectOptions = {};
        this._io = null;
    }

    select(fields = '*', options = {}) {
        this.operation = 'select';
        this.selectedFields = fields;
        this.selectOptions = options || {};
        return this;
    }

    eq(field, value) { this.filter[field] = value; return this; }
    neq(field, value) { this.filter[field] = { $ne: value }; return this; }
    in(field, values) { this.filter[field] = { $in: Array.isArray(values) ? values : [values] }; return this; }
    not(field, op, value) {
        if (op === 'in') {
            const arr = typeof value === 'string' ? value.replace(/[()\"]/g, '').split(',').map(s => s.trim()) : value;
            this.filter[field] = { $nin: arr };
        } else if (op === 'eq') {
            this.filter[field] = { $ne: value };
        }
        return this;
    }
    gt(field, value) { this.filter[field] = { ...(this.filter[field] || {}), $gt: value }; return this; }
    gte(field, value) { this.filter[field] = { ...(this.filter[field] || {}), $gte: value }; return this; }
    lt(field, value) { this.filter[field] = { ...(this.filter[field] || {}), $lt: value }; return this; }
    lte(field, value) { this.filter[field] = { ...(this.filter[field] || {}), $lte: value }; return this; }
    ilike(field, pattern) {
        const regexStr = pattern.replace(/%/g, '.*');
        this.filter[field] = { $regex: new RegExp(regexStr, 'i') };
        return this;
    }
    order(field, { ascending = true } = {}) { this.sortField = field; this.sortAsc = ascending; return this; }
    limit(n) { this.limitCount = n; return this; }
    single() { this.isSingle = true; this.isMaybeSingle = false; return this; }
    maybeSingle() { this.isSingle = false; this.isMaybeSingle = true; return this; }
    insert(data) { this.operation = 'insert'; this.mutationData = data; return this; }
    update(updates) { this.operation = 'update'; this.mutationData = updates; return this; }
    delete() { this.operation = 'delete'; return this; }

    _getCollection() {
        const store = getStore();
        return store[this.tableName] || null;
    }

    _enrichDoc(doc) {
        const d = cloneDeep(doc);
        const store = getStore();

        try {
            if (this.tableName === 'tables') {
                if (this.selectedFields.includes('floors')) {
                    const floor = store.floors.find(f => f.id === d.floor_id);
                    if (floor) d.floors = { id: floor.id, name: floor.name };
                }
                if (this.selectedFields.includes('table_sessions')) {
                    const sessions = store.table_sessions.filter(s => s.table_id === d.id).map(s => cloneDeep(s));
                    d.table_sessions = sessions;
                }
            }
            if (this.tableName === 'table_sessions' && this.selectedFields.includes('tables')) {
                const tbl = store.tables.find(t => t.id === d.table_id);
                if (tbl) d.tables = { id: tbl.id, table_number: tbl.table_number, floor_id: tbl.floor_id };
            }
            if (this.tableName === 'products' && this.selectedFields.includes('product_categories')) {
                const cat = store.product_categories.find(c => c.id === d.category_id);
                if (cat) d.product_categories = { id: cat.id, name: cat.name, icon_emoji: cat.icon_emoji, send_to_kitchen: cat.send_to_kitchen };
            }
            if (this.tableName === 'orders') {
                if (this.selectedFields.includes('tables') && d.table_id) {
                    const tbl = store.tables.find(t => t.id === d.table_id);
                    if (tbl) {
                        const floor = store.floors.find(f => f.id === tbl.floor_id);
                        d.tables = { id: tbl.id, table_number: tbl.table_number, floor_id: tbl.floor_id, floors: floor ? { id: floor.id, name: floor.name } : null };
                    }
                }
                if (this.selectedFields.includes('order_items')) {
                    d.order_items = store.order_items.filter(i => i.order_id === d.id).map(i => cloneDeep(i));
                }
            }
            if (this.tableName === 'payments') {
                if (this.selectedFields.includes('orders') && d.order_id) {
                    const ord = store.orders.find(o => o.id === d.order_id);
                    if (ord) d.orders = { id: ord.id, order_number: ord.order_number, total_amount: ord.total_amount, status: ord.status, table_number: ord.table_number, table_token: ord.table_token };
                }
            }
            if (this.tableName === 'kitchen_orders' && this.selectedFields.includes('orders') && d.order_id) {
                const ord = store.orders.find(o => o.id === d.order_id);
                if (ord) {
                    const tbl = ord.table_id ? store.tables.find(t => t.id === ord.table_id) : null;
                    d.orders = { id: ord.id, order_number: ord.order_number, table_id: ord.table_id, tables: tbl ? { table_number: tbl.table_number } : null };
                }
            }
        } catch (e) { /* enrichment is best-effort */ }

        return d;
    }

    async execute() {
        const col = this._getCollection();
        if (col === null) {
            return { data: null, error: { message: `Collection "${this.tableName}" not found` } };
        }

        const now = new Date().toISOString();

        try {
            if (this.operation === 'insert') {
                const isArray = Array.isArray(this.mutationData);
                const items = isArray ? this.mutationData : [this.mutationData];
                const created = items.map(item => ({
                    id: item.id || uuidv4(),
                    ...item,
                    created_at: item.created_at || now,
                    updated_at: item.updated_at || now
                }));
                col.push(...created);
                return { data: isArray ? created : created[0], error: null };
            }

            if (this.operation === 'update') {
                const updated = [];
                for (let i = 0; i < col.length; i++) {
                    if (matchesFilter(col[i], this.filter)) {
                        Object.assign(col[i], this.mutationData, { updated_at: now });
                        updated.push(cloneDeep(col[i]));
                    }
                }
                const result = (this.isSingle || this.isMaybeSingle) ? (updated[0] || null) : updated;
                return { data: result, error: null };
            }

            if (this.operation === 'delete') {
                const toDelete = col.filter(d => matchesFilter(d, this.filter));
                for (let i = col.length - 1; i >= 0; i--) {
                    if (matchesFilter(col[i], this.filter)) col.splice(i, 1);
                }
                return { data: toDelete, error: null };
            }

            // SELECT with count
            if (this.selectOptions && this.selectOptions.count === 'exact') {
                const count = col.filter(d => matchesFilter(d, this.filter)).length;
                if (this.selectOptions.head) return { data: null, count, error: null };
            }

            let results = col.filter(d => matchesFilter(d, this.filter)).map(d => this._enrichDoc(d));

            if (this.sortField) {
                const sf = this.sortField;
                const asc = this.sortAsc;
                results.sort((a, b) => {
                    const va = a[sf], vb = b[sf];
                    if (va == null && vb == null) return 0;
                    if (va == null) return asc ? -1 : 1;
                    if (vb == null) return asc ? 1 : -1;
                    return asc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
                });
            }

            if (this.limitCount) results = results.slice(0, this.limitCount);

            if (this.isSingle) {
                if (!results[0]) return { data: null, error: { code: 'PGRST116', message: 'The result contains 0 rows' } };
                return { data: results[0], error: null };
            }
            if (this.isMaybeSingle) return { data: results[0] || null, error: null };

            return { data: results, count: results.length, error: null };
        } catch (err) {
            return { data: null, error: { message: err.message } };
        }
    }

    then(resolve, reject) {
        return this.execute().then(resolve, reject);
    }
}

const memDb = {
    from(tableName) { return new MemQueryBuilder(tableName); },
    raw(sql) { return sql; }
};

module.exports = { memDb, getStore };
