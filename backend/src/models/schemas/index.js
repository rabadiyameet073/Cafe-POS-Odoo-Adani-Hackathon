/**
 * Mongoose Schemas for Cafe POS
 * 
 * Defines schemas and models for all entities in the database.
 * Every schema includes an indexed UUID string 'id' for seamless compatibility.
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const schemaOptions = {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    strict: false, // Allow flexible fields from various client operations
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            delete ret.__v;
            return ret;
        }
    },
    toObject: {
        virtuals: true,
        transform: (doc, ret) => {
            delete ret.__v;
            return ret;
        }
    }
};

// 1. Users
const UserSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, required: true },
    phone: { type: String, default: '' },
    role: { type: String, default: 'customer', index: true },
    is_active: { type: Boolean, default: true, index: true }
}, schemaOptions);

// 2. Floors
const FloorSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    display_order: { type: Number, default: 0, index: true },
    is_active: { type: Boolean, default: true, index: true },
    created_by: { type: String, default: null }
}, schemaOptions);

// 3. Tables
const TableSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    floor_id: { type: String, required: true, index: true },
    table_number: { type: String, required: true },
    seats: { type: Number, required: true, default: 4 },
    status: { type: String, default: 'available', index: true },
    is_active: { type: Boolean, default: true, index: true },
    qr_code_token: { type: String, default: null, index: true },
    current_session_id: { type: String, default: null },
    occupied_since: { type: Date, default: null },
    occupied_until: { type: Date, default: null }
}, schemaOptions);
TableSchema.index({ floor_id: 1, table_number: 1 });

// 4. Table Sessions
const TableSessionSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    table_id: { type: String, required: true, index: true },
    floor_id: { type: String, default: null },
    table_number: { type: String, default: '' },
    table_token: { type: String, required: true, index: true },
    customer_id: { type: String, default: null },
    customer_name: { type: String, default: null },
    status: { type: String, default: 'active', index: true },
    session_start: { type: Date, default: Date.now },
    session_end: { type: Date, default: null },
    duration_minutes: { type: Number, default: 39 },
    timer_status: { type: String, default: 'active' },
    timer_started_at: { type: Date, default: null },
    timer_ends_at: { type: Date, default: null },
    extension_minutes: { type: Number, default: 0 },
    notes: { type: String, default: '' }
}, schemaOptions);

// 5. Table Timer Logs
const TableTimerLogSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    session_id: { type: String, default: null, index: true },
    table_id: { type: String, default: null, index: true },
    table_token: { type: String, default: null },
    action: { type: String, default: 'running' },
    duration_minutes: { type: Number, default: 39 },
    minutes_added: { type: Number, default: 0 },
    timer_started_at: { type: Date, default: null },
    timer_ends_at: { type: Date, default: null },
    status: { type: String, default: 'running' },
    notes: { type: String, default: '' }
}, schemaOptions);

// 6. Product Categories
const ProductCategorySchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    icon_emoji: { type: String, default: '☕' },
    send_to_kitchen: { type: Boolean, default: true, index: true },
    display_order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true, index: true },
    is_deleted: { type: Boolean, default: false }
}, schemaOptions);

// 7. Products
const ProductSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    name: { type: String, required: true },
    category_id: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    unit: { type: String, default: 'piece' },
    tax_percentage: { type: Number, default: 5 },
    description: { type: String, default: '' },
    image_url: { type: String, default: '' },
    display_order: { type: Number, default: 0 },
    is_available: { type: Boolean, default: true, index: true },
    is_active: { type: Boolean, default: true, index: true },
    is_deleted: { type: Boolean, default: false, index: true }
}, schemaOptions);

// 8. Product Variants
const ProductVariantSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    product_id: { type: String, required: true, index: true },
    attribute_name: { type: String, required: true },
    attribute_value: { type: String, required: true },
    extra_price: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true, index: true }
}, schemaOptions);

// 9. Orders
const OrderSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    order_number: { type: String, required: true, unique: true, index: true },
    session_id: { type: String, default: null, index: true },
    table_id: { type: String, default: null, index: true },
    table_token: { type: String, default: null, index: true },
    table_number: { type: String, default: null },
    customer_id: { type: String, default: null, index: true },
    cashier_id: { type: String, default: null },
    created_by_id: { type: String, default: null },
    subtotal: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },
    discount_amount: { type: Number, default: 0 },
    total_amount: { type: Number, default: 0 },
    status: { type: String, default: 'draft', index: true },
    payment_status: { type: String, default: 'pending', index: true },
    payment_method: { type: String, default: 'cash' },
    order_type: { type: String, default: 'dine_in' },
    self_order_token: { type: String, default: null },
    special_instructions: { type: String, default: '' },
    sent_to_kitchen_at: { type: Date, default: null },
    payment_confirmed_at: { type: Date, default: null },
    ready_at: { type: Date, default: null },
    completed_at: { type: Date, default: null },
    cancelled_at: { type: Date, default: null },
    is_deleted: { type: Boolean, default: false, index: true }
}, schemaOptions);

// 10. Order Items
const OrderItemSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    order_id: { type: String, required: true, index: true },
    product_id: { type: String, required: true, index: true },
    product_name: { type: String, default: '' },
    variant_id: { type: String, default: null },
    variant_name: { type: String, default: null },
    quantity: { type: Number, required: true, default: 1 },
    unit_price: { type: Number, required: true },
    variant_price: { type: Number, default: 0 },
    tax_percentage: { type: Number, default: 0 },
    line_total: { type: Number, required: true },
    kitchen_status: { type: String, default: 'pending', index: true },
    notes: { type: String, default: '' },
    prepared_quantity: { type: Number, default: 0 },
    is_completed: { type: Boolean, default: false }
}, schemaOptions);

// 11. Payment Methods
const PaymentMethodSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    name: { type: String, required: true, unique: true },
    display_name: { type: String, required: true },
    is_enabled: { type: Boolean, default: true, index: true },
    upi_id: { type: String, default: null },
    config: { type: mongoose.Schema.Types.Mixed, default: {} }
}, schemaOptions);

// 12. Payments
const PaymentSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    order_id: { type: String, required: true, index: true },
    session_id: { type: String, default: null, index: true },
    payment_method_id: { type: String, default: null, index: true },
    payment_method: { type: String, default: 'cash' },
    table_token: { type: String, default: null, index: true },
    table_number: { type: String, default: null },
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending', index: true },
    transaction_id: { type: String, default: null },
    reference_number: { type: String, default: null },
    upi_transaction_id: { type: String, default: null },
    qr_code_data: { type: String, default: null },
    qr_generated_at: { type: Date, default: null },
    upi_expires_at: { type: Date, default: null },
    cashier_name: { type: String, default: null },
    approved_at: { type: Date, default: null },
    rejected_at: { type: Date, default: null },
    rejection_reason: { type: String, default: null },
    payment_confirmed_at: { type: Date, default: null },
    paid_at: { type: Date, default: null },
    notes: { type: String, default: '' }
}, schemaOptions);

// 13. Cashier Payment Requests
const CashierPaymentRequestSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    order_id: { type: String, default: null, index: true },
    payment_id: { type: String, default: null, index: true },
    table_token: { type: String, default: null, index: true },
    table_number: { type: String, default: null },
    total_amount: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    payment_method: { type: String, default: 'cash' },
    order_summary: { type: mongoose.Schema.Types.Mixed, default: [] },
    status: { type: String, default: 'pending', index: true },
    cashier_name: { type: String, default: null },
    responded_at: { type: Date, default: null },
    rejection_reason: { type: String, default: null }
}, schemaOptions);

// 14. Kitchen Orders
const KitchenOrderSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    order_id: { type: String, required: true, index: true },
    order_number: { type: String, default: '' },
    ticket_number: { type: String, default: '' },
    table_number: { type: String, default: '' },
    table_token: { type: String, default: null, index: true },
    stage: { type: String, default: 'to_cook', index: true },
    status: { type: String, default: 'received', index: true },
    payment_method: { type: String, default: 'cash' },
    items: { type: mongoose.Schema.Types.Mixed, required: true },
    priority: { type: Number, default: 0 },
    received_at: { type: Date, default: Date.now, index: true },
    started_preparing_at: { type: Date, default: null },
    started_at: { type: Date, default: null },
    ready_at: { type: Date, default: null },
    served_at: { type: Date, default: null },
    completed_at: { type: Date, default: null }
}, schemaOptions);

// 15. Customer Feedback
const FeedbackSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    order_id: { type: String, default: null, index: true },
    session_id: { type: String, default: null, index: true },
    customer_id: { type: String, default: null, index: true },
    table_token: { type: String, default: null },
    table_number: { type: String, default: null },
    overall_rating: { type: Number, default: 5 },
    food_quality_rating: { type: Number, default: 5 },
    service_rating: { type: Number, default: 5 },
    service_speed_rating: { type: Number, default: 5 },
    waiting_time_rating: { type: Number, default: 5 },
    payment_experience_rating: { type: Number, default: 5 },
    ambience_rating: { type: Number, default: 5 },
    cleanliness_rating: { type: Number, default: 5 },
    payment_method_used: { type: String, default: '' },
    payment_seamless: { type: Boolean, default: true },
    comment: { type: String, default: '' },
    comments: { type: String, default: '' },
    suggestions: { type: String, default: '' },
    liked_items: { type: [String], default: [] },
    disliked_items: { type: [String], default: [] },
    favorite_dish: { type: String, default: '' },
    would_recommend: { type: Boolean, default: true },
    is_anonymous: { type: Boolean, default: false }
}, schemaOptions);

// 16. POS Sessions
const PosSessionSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    session_number: { type: String, required: true, unique: true },
    user_id: { type: String, required: true, index: true },
    terminal_id: { type: String, default: null },
    opening_balance: { type: Number, default: 0 },
    closing_balance: { type: Number, default: null },
    status: { type: String, default: 'open', index: true },
    opened_at: { type: Date, default: Date.now },
    closed_at: { type: Date, default: null },
    notes: { type: String, default: '' }
}, schemaOptions);

// 17. POS Terminals
const PosTerminalSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    terminal_name: { type: String, required: true, unique: true },
    location: { type: String, default: '' },
    last_closing_amount: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true }
}, schemaOptions);

// 18. Self Order Tokens
const SelfOrderTokenSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    table_id: { type: String, required: true },
    session_id: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    expires_at: { type: Date, default: null }
}, schemaOptions);

// 19. Audit Logs
const AuditLogSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    table_name: { type: String, required: true, index: true },
    record_id: { type: String, required: true, index: true },
    action: { type: String, required: true },
    old_data: { type: mongoose.Schema.Types.Mixed, default: null },
    new_data: { type: mongoose.Schema.Types.Mixed, default: null },
    changed_by: { type: String, default: null, index: true },
    changed_at: { type: Date, default: Date.now }
}, schemaOptions);

// 20. Reports Cache
const ReportCacheSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true, index: true },
    report_type: { type: String, required: true, index: true },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    generated_at: { type: Date, default: Date.now },
    expires_at: { type: Date, default: null }
}, schemaOptions);

// Helper to get or create model safely
function getOrCreateModel(name, schema) {
    try {
        return mongoose.model(name);
    } catch {
        return mongoose.model(name, schema);
    }
}

module.exports = {
    User: getOrCreateModel('User', UserSchema),
    Floor: getOrCreateModel('Floor', FloorSchema),
    Table: getOrCreateModel('Table', TableSchema),
    TableSession: getOrCreateModel('TableSession', TableSessionSchema),
    TableTimerLog: getOrCreateModel('TableTimerLog', TableTimerLogSchema),
    ProductCategory: getOrCreateModel('ProductCategory', ProductCategorySchema),
    Product: getOrCreateModel('Product', ProductSchema),
    ProductVariant: getOrCreateModel('ProductVariant', ProductVariantSchema),
    Order: getOrCreateModel('Order', OrderSchema),
    OrderItem: getOrCreateModel('OrderItem', OrderItemSchema),
    PaymentMethod: getOrCreateModel('PaymentMethod', PaymentMethodSchema),
    Payment: getOrCreateModel('Payment', PaymentSchema),
    CashierPaymentRequest: getOrCreateModel('CashierPaymentRequest', CashierPaymentRequestSchema),
    KitchenOrder: getOrCreateModel('KitchenOrder', KitchenOrderSchema),
    Feedback: getOrCreateModel('Feedback', FeedbackSchema),
    PosSession: getOrCreateModel('PosSession', PosSessionSchema),
    PosTerminal: getOrCreateModel('PosTerminal', PosTerminalSchema),
    SelfOrderToken: getOrCreateModel('SelfOrderToken', SelfOrderTokenSchema),
    AuditLog: getOrCreateModel('AuditLog', AuditLogSchema),
    ReportCache: getOrCreateModel('ReportCache', ReportCacheSchema)
};
