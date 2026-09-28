/**
 * Native MongoDB Database Query Engine
 * 
 * Provides a fluent API (from, select, eq, in, order, insert, update, delete)
 * operating directly over MongoDB Atlas or local collections via Mongoose.
 */

const { v4: uuidv4 } = require('uuid');
const { connectMongoDB, testConnection, getConnectionStatus } = require('./mongodb');
const schemas = require('../models/schemas');
const logger = require('../utils/logger');

// Global Socket.IO reference for realtime broadcast
let _io = null;
function setSocketIO(io) {
    _io = io;
}

// Map collection/table names to Mongoose models
const modelMap = {
    users: schemas.User,
    floors: schemas.Floor,
    tables: schemas.Table,
    table_sessions: schemas.TableSession,
    table_timer_logs: schemas.TableTimerLog,
    product_categories: schemas.ProductCategory,
    products: schemas.Product,
    product_variants: schemas.ProductVariant,
    orders: schemas.Order,
    order_items: schemas.OrderItem,
    payment_methods: schemas.PaymentMethod,
    payments: schemas.Payment,
    cashier_payment_requests: schemas.CashierPaymentRequest,
    kitchen_orders: schemas.KitchenOrder,
    feedback: schemas.Feedback,
    customer_feedback: schemas.Feedback,
    pos_sessions: schemas.PosSession,
    pos_terminals: schemas.PosTerminal,
    self_order_tokens: schemas.SelfOrderToken,
    audit_logs: schemas.AuditLog,
    reports_cache: schemas.ReportCache
};

function getModel(tableName) {
    return modelMap[tableName] || null;
}

// Clean document for output (remove _id, __v, ensure id is present)
function cleanDoc(doc) {
    if (!doc) return null;
    let obj = doc.toObject ? doc.toObject() : { ...doc };
    delete obj._id;
    delete obj.__v;
    return obj;
}

// Helper to broadcast changes via Socket.IO
function broadcastChange(table, eventType, record, oldRecord = null) {
    if (!_io) return;
    try {
        _io.emit('db_change', {
            table,
            eventType,
            new: record,
            old: oldRecord
        });

        if (table === 'tables') {
            _io.emit('table_update', record);
        } else if (table === 'orders') {
            _io.emit('order_update', record);
        } else if (table === 'kitchen_orders') {
            _io.emit('kitchen_update', record);
        } else if (table === 'payments' || table === 'cashier_payment_requests') {
            _io.emit('payment_update', record);
        }
    } catch (err) {
        logger.debug('Broadcast note:', err.message);
    }
}

/**
 * MongoDB Query Builder
 */
class MongoQueryBuilder {
    constructor(tableName) {
        this.tableName = tableName;
        this.model = getModel(tableName);
        this.operation = 'select'; // 'select', 'insert', 'update', 'delete'
        
        this.selectedFields = '*';
        this.selectOptions = {};
        
        this.filter = {};
        this.sort = null;
        this.limitCount = null;
        this.isSingle = false;
        this.isMaybeSingle = false;
        
        this.mutationData = null;
    }

    select(fields = '*', options = {}) {
        this.operation = 'select';
        this.selectedFields = fields;
        this.selectOptions = options;
        return this;
    }

    eq(field, value) {
        this.filter[field] = value;
        return this;
    }

    neq(field, value) {
        this.filter[field] = { $ne: value };
        return this;
    }

    in(field, values) {
        this.filter[field] = { $in: Array.isArray(values) ? values : [values] };
        return this;
    }

    not(field, op, value) {
        if (op === 'in') {
            let arr = value;
            if (typeof value === 'string') {
                arr = value.replace(/[()"]/g, '').split(',').map(s => s.trim());
            }
            this.filter[field] = { $nin: arr };
        } else if (op === 'eq') {
            this.filter[field] = { $ne: value };
        }
        return this;
    }

    gt(field, value) {
        this.filter[field] = { ...(this.filter[field] || {}), $gt: value };
        return this;
    }

    gte(field, value) {
        this.filter[field] = { ...(this.filter[field] || {}), $gte: value };
        return this;
    }

    lt(field, value) {
        this.filter[field] = { ...(this.filter[field] || {}), $lt: value };
        return this;
    }

    lte(field, value) {
        this.filter[field] = { ...(this.filter[field] || {}), $lte: value };
        return this;
    }

    ilike(field, pattern) {
        const regexStr = pattern.replace(/%/g, '.*');
        this.filter[field] = { $regex: new RegExp(`^${regexStr}$`, 'i') };
        return this;
    }

    order(field, { ascending = true } = {}) {
        this.sort = { [field]: ascending ? 1 : -1 };
        return this;
    }

    limit(n) {
        this.limitCount = n;
        return this;
    }

    single() {
        this.isSingle = true;
        this.isMaybeSingle = false;
        return this;
    }

    maybeSingle() {
        this.isSingle = false;
        this.isMaybeSingle = true;
        return this;
    }

    insert(data) {
        this.operation = 'insert';
        this.mutationData = data;
        return this;
    }

    update(updates) {
        this.operation = 'update';
        this.mutationData = updates;
        return this;
    }

    delete() {
        this.operation = 'delete';
        return this;
    }

    async enrichDoc(doc) {
        if (!doc) return doc;
        const cleaned = cleanDoc(doc);
        const fields = this.selectedFields || '*';

        try {
            // Join floors and table_sessions on tables
            if (this.tableName === 'tables') {
                if (fields.includes('floors') && cleaned.floor_id) {
                    const floor = await schemas.Floor.findOne({ id: cleaned.floor_id }).lean();
                    if (floor) cleaned.floors = { id: floor.id, name: floor.name };
                }
                if (fields.includes('table_sessions')) {
                    const sessions = await schemas.TableSession.find({ table_id: cleaned.id }).lean();
                    cleaned.table_sessions = sessions.map(s => cleanDoc(s));
                }
            }

            // Join tables on table_sessions
            if (this.tableName === 'table_sessions' && fields.includes('tables')) {
                if (cleaned.table_id) {
                    const table = await schemas.Table.findOne({ id: cleaned.table_id }).lean();
                    if (table) cleaned.tables = { id: table.id, table_number: table.table_number };
                }
            }

            // Join product_categories on products
            if (this.tableName === 'products' && fields.includes('product_categories')) {
                if (cleaned.category_id) {
                    const cat = await schemas.ProductCategory.findOne({ id: cleaned.category_id }).lean();
                    if (cat) {
                        cleaned.product_categories = {
                            id: cat.id,
                            name: cat.name,
                            icon_emoji: cat.icon_emoji,
                            send_to_kitchen: cat.send_to_kitchen
                        };
                    }
                }
            }

            // Join tables & order_items on orders
            if (this.tableName === 'orders') {
                if (fields.includes('tables') && cleaned.table_id) {
                    const table = await schemas.Table.findOne({ id: cleaned.table_id }).lean();
                    if (table) {
                        const floor = await schemas.Floor.findOne({ id: table.floor_id }).lean();
                        cleaned.tables = {
                            id: table.id,
                            table_number: table.table_number,
                            floor_id: table.floor_id,
                            floors: floor ? { id: floor.id, name: floor.name } : null
                        };
                    }
                }
                if (fields.includes('order_items')) {
                    const items = await schemas.OrderItem.find({ order_id: cleaned.id }).lean();
                    cleaned.order_items = items.map(i => cleanDoc(i));
                }
            }

            // Join products and variants on order_items
            if (this.tableName === 'order_items') {
                if (fields.includes('products') && cleaned.product_id) {
                    const p = await schemas.Product.findOne({ id: cleaned.product_id }).lean();
                    if (p) cleaned.products = { id: p.id, name: p.name, image_url: p.image_url, category_id: p.category_id };
                }
                if (fields.includes('product_variants') && cleaned.variant_id) {
                    const v = await schemas.ProductVariant.findOne({ id: cleaned.variant_id }).lean();
                    if (v) cleaned.product_variants = { id: v.id, attribute_name: v.attribute_name, attribute_value: v.attribute_value };
                }
            }

            // Join orders on kitchen_orders
            if (this.tableName === 'kitchen_orders' && fields.includes('orders')) {
                if (cleaned.order_id) {
                    const o = await schemas.Order.findOne({ id: cleaned.order_id }).lean();
                    if (o) {
                        const t = o.table_id ? await schemas.Table.findOne({ id: o.table_id }).lean() : null;
                        cleaned.orders = {
                            id: o.id,
                            order_number: o.order_number,
                            table_id: o.table_id,
                            tables: t ? { table_number: t.table_number } : null
                        };
                    }
                }
            }

            // Join orders and users on feedback / customer_feedback
            if (this.tableName === 'feedback' || this.tableName === 'customer_feedback') {
                if (fields.includes('orders') && cleaned.order_id) {
                    const o = await schemas.Order.findOne({ id: cleaned.order_id }).lean();
                    if (o) cleaned.orders = { id: o.id, order_number: o.order_number };
                }
                if (fields.includes('users') && cleaned.customer_id) {
                    const u = await schemas.User.findOne({ id: cleaned.customer_id }).lean();
                    if (u) cleaned.users = { id: u.id, full_name: u.full_name };
                }
            }

            // Join orders and payment_methods on payments
            if (this.tableName === 'payments') {
                if (fields.includes('orders') && cleaned.order_id) {
                    const o = await schemas.Order.findOne({ id: cleaned.order_id }).lean();
                    if (o) {
                        cleaned.orders = {
                            id: o.id,
                            order_number: o.order_number,
                            total_amount: o.total_amount,
                            status: o.status,
                            table_number: o.table_number,
                            table_token: o.table_token
                        };
                    }
                }
                if (fields.includes('payment_methods')) {
                    const pm = cleaned.payment_method_id
                        ? await schemas.PaymentMethod.findOne({ id: cleaned.payment_method_id }).lean()
                        : await schemas.PaymentMethod.findOne({ name: cleaned.payment_method }).lean();
                    if (pm) {
                        cleaned.payment_methods = { id: pm.id, name: pm.name, display_name: pm.display_name };
                    }
                }
            }

            // Join users on pos_sessions
            if (this.tableName === 'pos_sessions' && fields.includes('users')) {
                if (cleaned.user_id) {
                    const u = await schemas.User.findOne({ id: cleaned.user_id }).lean();
                    if (u) cleaned.users = { id: u.id, full_name: u.full_name, email: u.email };
                }
            }
        } catch (e) {
            logger.debug('Enrichment note:', e.message);
        }

        return cleaned;
    }

    async execute() {
        if (!this.model) {
            return { data: null, error: { message: `Table/Collection ${this.tableName} not found` } };
        }

        try {
            if (this.operation === 'insert') {
                const isArray = Array.isArray(this.mutationData);
                const items = isArray ? this.mutationData : [this.mutationData];
                
                const prepared = items.map(item => ({
                    id: item.id || uuidv4(),
                    ...item,
                    created_at: item.created_at || new Date().toISOString(),
                    updated_at: item.updated_at || new Date().toISOString()
                }));

                const created = await this.model.create(prepared);
                const cleanedList = created.map(c => cleanDoc(c));

                cleanedList.forEach(rec => broadcastChange(this.tableName, 'INSERT', rec));

                return {
                    data: isArray ? cleanedList : cleanedList[0],
                    error: null
                };
            }

            if (this.operation === 'update') {
                const updates = {
                    ...this.mutationData,
                    updated_at: new Date().toISOString()
                };

                await this.model.updateMany(this.filter, { $set: updates });
                const updated = await this.model.find(this.filter);
                const cleanedList = updated.map(u => cleanDoc(u));

                cleanedList.forEach(rec => broadcastChange(this.tableName, 'UPDATE', rec));

                return {
                    data: (this.isSingle || this.isMaybeSingle) ? (cleanedList[0] || null) : cleanedList,
                    error: null
                };
            }

            if (this.operation === 'delete') {
                const existing = await this.model.find(this.filter);
                await this.model.deleteMany(this.filter);
                const cleanedList = existing.map(e => cleanDoc(e));

                cleanedList.forEach(rec => broadcastChange(this.tableName, 'DELETE', rec));

                return {
                    data: cleanedList,
                    error: null
                };
            }

            // SELECT
            if (this.selectOptions && this.selectOptions.count === 'exact') {
                const count = await this.model.countDocuments(this.filter);
                if (this.selectOptions.head) {
                    return { data: null, count, error: null };
                }
            }

            let query = this.model.find(this.filter);

            if (this.sort) query = query.sort(this.sort);
            if (this.limitCount) query = query.limit(this.limitCount);

            const docs = await query.exec();
            const enriched = await Promise.all(docs.map(doc => this.enrichDoc(doc)));

            if (this.isSingle) {
                const singleDoc = enriched[0] || null;
                if (!singleDoc) {
                    return {
                        data: null,
                        error: { code: 'PGRST116', message: 'The result contains 0 rows' }
                    };
                }
                return { data: singleDoc, error: null };
            }

            if (this.isMaybeSingle) {
                return { data: enriched[0] || null, error: null };
            }

            return { data: enriched, count: enriched.length, error: null };
        } catch (err) {
            logger.error(`MongoDB operation error on ${this.tableName}:`, err.message);
            return { data: null, error: { message: err.message } };
        }
    }

    then(resolve, reject) {
        return this.execute().then(resolve, reject);
    }
}

const db = {
    from(tableName) {
        return new MongoQueryBuilder(tableName);
    },
    raw(sql) {
        return sql;
    }
};

connectMongoDB().catch(err => {
    logger.warn('Initial MongoDB connection deferred:', err.message);
});

module.exports = {
    db,
    testConnection,
    getConnectionStatus,
    setSocketIO
};
