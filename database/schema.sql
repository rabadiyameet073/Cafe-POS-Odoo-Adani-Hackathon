CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'cashier', 'kitchen', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_floors_is_active ON floors(is_active);
CREATE INDEX idx_floors_display_order ON floors(display_order);

CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    send_to_kitchen BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_categories_is_active ON product_categories(is_active);
CREATE INDEX idx_product_categories_send_to_kitchen ON product_categories(send_to_kitchen);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES product_categories(id),
    price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'piece',
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    description TEXT,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_available ON products(is_available);
CREATE INDEX idx_products_is_active ON products(is_active);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value VARCHAR(100) NOT NULL,
    extra_price DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_is_active ON product_variants(is_active);

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    upi_id VARCHAR(100),
    config JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_is_enabled ON payment_methods(is_enabled);

CREATE TABLE pos_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    opening_balance DECIMAL(10,2) DEFAULT 0,
    closing_balance DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    opened_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pos_sessions_user_id ON pos_sessions(user_id);
CREATE INDEX idx_pos_sessions_status ON pos_sessions(status);
CREATE INDEX idx_pos_sessions_opened_at ON pos_sessions(opened_at);

CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID REFERENCES floors(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    seats INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
    is_active BOOLEAN DEFAULT true,
    qr_code_token VARCHAR(100) UNIQUE,
    appointment_resource VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(floor_id, table_number)
);

CREATE INDEX idx_tables_floor_id ON tables(floor_id);
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_tables_qr_code_token ON tables(qr_code_token);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    session_id UUID REFERENCES pos_sessions(id),
    table_id UUID REFERENCES tables(id),
    customer_id UUID REFERENCES users(id),
    cashier_id UUID REFERENCES users(id),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'sent_to_kitchen', 'preparing', 'ready', 'completed', 'cancelled')),
    order_type VARCHAR(50) DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeaway', 'self_order')),
    self_order_token VARCHAR(100),
    special_instructions TEXT,
    sent_to_kitchen_at TIMESTAMP,
    ready_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_session_id ON orders(session_id);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    variant_price DECIMAL(10,2) DEFAULT 0,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    line_total DECIMAL(10,2) NOT NULL,
    kitchen_status VARCHAR(50) DEFAULT 'pending' CHECK (kitchen_status IN ('pending', 'preparing', 'completed')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_kitchen_status ON order_items(kitchen_status);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    session_id UUID REFERENCES pos_sessions(id),
    payment_method_id UUID REFERENCES payment_methods(id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(100),
    reference_number VARCHAR(100),
    notes TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_session_id ON payments(session_id);
CREATE INDEX idx_payments_payment_method_id ON payments(payment_method_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE TABLE kitchen_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    ticket_number VARCHAR(50) NOT NULL,
    table_number VARCHAR(50),
    stage VARCHAR(50) DEFAULT 'to_cook' CHECK (stage IN ('to_cook', 'preparing', 'completed')),
    items JSONB NOT NULL,
    priority INTEGER DEFAULT 0,
    received_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_kitchen_orders_stage ON kitchen_orders(stage);
CREATE INDEX idx_kitchen_orders_received_at ON kitchen_orders(received_at);
CREATE INDEX idx_kitchen_orders_order_id ON kitchen_orders(order_id);

CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    customer_id UUID REFERENCES users(id),
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    food_quality_rating INTEGER CHECK (food_quality_rating >= 1 AND food_quality_rating <= 5),
    service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
    payment_experience_rating INTEGER CHECK (payment_experience_rating >= 1 AND payment_experience_rating <= 5),
    payment_method_used VARCHAR(50),
    payment_seamless BOOLEAN,
    ambience_rating INTEGER CHECK (ambience_rating >= 1 AND ambience_rating <= 5),
    cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
    liked_items TEXT[],
    disliked_items TEXT[],
    favorite_dish VARCHAR(255),
    suggestions TEXT,
    would_recommend BOOLEAN,
    comments TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_order_id ON feedback(order_id);
CREATE INDEX idx_feedback_customer_id ON feedback(customer_id);
CREATE INDEX idx_feedback_overall_rating ON feedback(overall_rating);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);

CREATE TABLE self_order_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(100) UNIQUE NOT NULL,
    table_id UUID REFERENCES tables(id),
    session_id UUID REFERENCES pos_sessions(id),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_self_order_tokens_token ON self_order_tokens(token);
CREATE INDEX idx_self_order_tokens_table_id ON self_order_tokens(table_id);
CREATE INDEX idx_self_order_tokens_is_active ON self_order_tokens(is_active);

CREATE TABLE reports_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(50) NOT NULL,
    filters JSONB,
    data JSONB,
    generated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE INDEX idx_reports_cache_report_type ON reports_cache(report_type);
CREATE INDEX idx_reports_cache_generated_at ON reports_cache(generated_at);


CREATE TABLE pos_terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    terminal_name VARCHAR(100) UNIQUE NOT NULL,
    location VARCHAR(100),
    last_closing_amount DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pos_terminals_is_active ON pos_terminals(is_active);

ALTER TABLE pos_sessions
ADD COLUMN terminal_id UUID REFERENCES pos_terminals(id);

CREATE INDEX idx_pos_sessions_terminal_id ON pos_sessions(terminal_id);

ALTER TABLE orders
ADD COLUMN created_by_id UUID REFERENCES users(id);

CREATE INDEX idx_orders_created_by_id ON orders(created_by_id);

ALTER TABLE order_items
ADD COLUMN prepared_quantity INTEGER DEFAULT 0,
ADD COLUMN is_completed BOOLEAN DEFAULT false;

CREATE INDEX idx_order_items_is_completed ON order_items(is_completed);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_changed_by ON audit_logs(changed_by);

ALTER TABLE products
ADD COLUMN is_deleted BOOLEAN DEFAULT false;

ALTER TABLE product_categories
ADD COLUMN is_deleted BOOLEAN DEFAULT false;

ALTER TABLE orders
ADD COLUMN is_deleted BOOLEAN DEFAULT false;

CREATE INDEX idx_products_is_deleted ON products(is_deleted);
CREATE INDEX idx_product_categories_is_deleted ON product_categories(is_deleted);
CREATE INDEX idx_orders_is_deleted ON orders(is_deleted);

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    method_name VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
    amount DECIMAL(10,2) NOT NULL,
    reference_id VARCHAR(100),
    payment_status VARCHAR(30) DEFAULT 'completed',
    paid_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);

CREATE TABLE taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_name VARCHAR(50),
    cgst DECIMAL(5,2) DEFAULT 0,
    sgst DECIMAL(5,2) DEFAULT 0,
    igst DECIMAL(5,2) DEFAULT 0
);

ALTER TABLE products
ADD COLUMN tax_id UUID REFERENCES taxes(id);

ALTER TABLE orders
ADD COLUMN total_tax DECIMAL(10,2) DEFAULT 0;

CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    status VARCHAR(50),
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);

CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    payment_id UUID REFERENCES payments(id),
    refunded_amount DECIMAL(10,2),
    reason TEXT,
    refunded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cash_drawer_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    terminal_id UUID REFERENCES pos_terminals(id),
    opened_by UUID REFERENCES users(id),
    opening_balance DECIMAL(10,2) DEFAULT 0,
    closing_balance DECIMAL(10,2),
    opened_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP
);

CREATE TABLE discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_name VARCHAR(100),
    discount_type VARCHAR(20),
    discount_value DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE order_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    discount_id UUID REFERENCES discounts(id),
    discount_amount DECIMAL(10,2)
);

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    quantity INTEGER,
    movement_type VARCHAR(30),
    reference_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);
