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
    const now = new Date().toISOString();

    // Users
    const users = [
        { id: '1', email: 'admin@demo.com', password_hash: bcrypt.hashSync('demo123', 10), full_name: 'Admin User', phone: '+91-9876543210', role: 'admin', is_active: true, created_at: now, updated_at: now },
        { id: '2', email: 'cashier@demo.com', password_hash: bcrypt.hashSync('demo123', 10), full_name: 'Riya Cashier', phone: '+91-9876543211', role: 'cashier', is_active: true, created_at: now, updated_at: now },
        { id: '3', email: 'kitchen@demo.com', password_hash: bcrypt.hashSync('demo123', 10), full_name: 'Chef Arun', phone: '+91-9876543212', role: 'kitchen', is_active: true, created_at: now, updated_at: now },
        { id: '4', email: 'customer@demo.com', password_hash: bcrypt.hashSync('demo123', 10), full_name: 'Customer User', phone: '+91-9876543213', role: 'customer', is_active: true, created_at: now, updated_at: now },
    ];

    // Floors
    const floors = [
        { id: 'f1', name: 'Ground Floor', description: 'Main dining area', display_order: 1, is_active: true, created_at: now, updated_at: now },
        { id: 'f2', name: 'First Floor', description: 'Premium seating area', display_order: 2, is_active: true, created_at: now, updated_at: now },
        { id: 'f3', name: 'Terrace', description: 'Open-air terrace seating', display_order: 3, is_active: true, created_at: now, updated_at: now },
    ];

    // Tables
    const tables = [
        { id: 't1', floor_id: 'f1', table_number: 'T1', seats: 4, status: 'available', is_active: true, qr_code_token: null, current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't2', floor_id: 'f1', table_number: 'T2', seats: 2, status: 'available', is_active: true, qr_code_token: null, current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't3', floor_id: 'f1', table_number: 'T3', seats: 6, status: 'available', is_active: true, qr_code_token: null, current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't4', floor_id: 'f1', table_number: 'T4', seats: 4, status: 'available', is_active: true, qr_code_token: null, current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't5', floor_id: 'f2', table_number: 'T5', seats: 4, status: 'available', is_active: true, qr_code_token: null, current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't6', floor_id: 'f2', table_number: 'T6', seats: 6, status: 'available', is_active: true, qr_code_token: null, current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't7', floor_id: 'f2', table_number: 'T7', seats: 8, status: 'available', is_active: true, qr_code_token: null, current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't8', floor_id: 'f3', table_number: 'TRC1', seats: 4, status: 'available', is_active: true, qr_code_token: null, current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
        { id: 't9', floor_id: 'f3', table_number: 'TRC2', seats: 4, status: 'available', is_active: true, qr_code_token: null, current_session_id: null, occupied_since: null, occupied_until: null, created_at: now, updated_at: now },
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
        { id: 'p1', name: 'Masala Chai', category_id: 'c1', price: 40, unit: 'cup', tax_percentage: 5, description: 'Spiced Indian tea with milk', image_url: '', display_order: 1, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p2', name: 'Filter Coffee', category_id: 'c1', price: 50, unit: 'cup', tax_percentage: 5, description: 'South Indian filter coffee', image_url: '', display_order: 2, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p3', name: 'Cappuccino', category_id: 'c1', price: 120, unit: 'cup', tax_percentage: 5, description: 'Espresso with steamed milk foam', image_url: '', display_order: 3, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p4', name: 'Green Tea', category_id: 'c1', price: 60, unit: 'cup', tax_percentage: 5, description: 'Antioxidant-rich green tea', image_url: '', display_order: 4, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p5', name: 'Cold Coffee', category_id: 'c2', price: 110, unit: 'glass', tax_percentage: 5, description: 'Chilled coffee with ice cream', image_url: '', display_order: 1, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p6', name: 'Mango Shake', category_id: 'c2', price: 130, unit: 'glass', tax_percentage: 5, description: 'Fresh mango milkshake', image_url: '', display_order: 2, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p7', name: 'Lemon Soda', category_id: 'c2', price: 60, unit: 'glass', tax_percentage: 5, description: 'Refreshing lemon soda', image_url: '', display_order: 3, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p8', name: 'Veg Samosa', category_id: 'c3', price: 30, unit: 'piece', tax_percentage: 5, description: 'Crispy fried pastry with spiced filling', image_url: '', display_order: 1, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p9', name: 'French Fries', category_id: 'c3', price: 90, unit: 'plate', tax_percentage: 5, description: 'Crispy golden fries', image_url: '', display_order: 2, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p10', name: 'Sandwich', category_id: 'c3', price: 80, unit: 'piece', tax_percentage: 5, description: 'Grilled veg sandwich', image_url: '', display_order: 3, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p11', name: 'Veg Biryani', category_id: 'c4', price: 180, unit: 'plate', tax_percentage: 5, description: 'Fragrant vegetable biryani', image_url: '', display_order: 1, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p12', name: 'Paneer Butter Masala', category_id: 'c4', price: 220, unit: 'plate', tax_percentage: 5, description: 'Creamy paneer curry', image_url: '', display_order: 2, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p13', name: 'Dal Makhani', category_id: 'c4', price: 180, unit: 'plate', tax_percentage: 5, description: 'Slow-cooked black lentils', image_url: '', display_order: 3, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p14', name: 'Gulab Jamun', category_id: 'c5', price: 60, unit: 'piece', tax_percentage: 5, description: 'Soft milk-solid-based dumplings in syrup', image_url: '', display_order: 1, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p15', name: 'Brownie', category_id: 'c5', price: 90, unit: 'piece', tax_percentage: 5, description: 'Rich chocolate brownie', image_url: '', display_order: 2, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p16', name: 'Poha', category_id: 'c6', price: 60, unit: 'plate', tax_percentage: 5, description: 'Flattened rice breakfast dish', image_url: '', display_order: 1, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p17', name: 'Idli Sambar', category_id: 'c6', price: 70, unit: 'plate', tax_percentage: 5, description: 'Steamed rice cakes with sambar', image_url: '', display_order: 2, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
        { id: 'p18', name: 'Upma', category_id: 'c6', price: 65, unit: 'plate', tax_percentage: 5, description: 'Semolina breakfast dish', image_url: '', display_order: 3, is_available: true, is_active: true, is_deleted: false, created_at: now, updated_at: now },
    ];

    const product_variants = [];
    const table_sessions = [];
    const table_timer_logs = [];
    const orders = [];
    const order_items = [];
    const payments = [];
    const cashier_payment_requests = [];
    const kitchen_orders = [];
    const feedback = [];
    const customer_feedback = [];
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
            if (this.tableName === 'tables' && this.selectedFields.includes('floors')) {
                const floor = store.floors.find(f => f.id === d.floor_id);
                if (floor) d.floors = { id: floor.id, name: floor.name };
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
