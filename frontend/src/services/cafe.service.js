import { supabase } from './supabase.service'

// ─── UPI Configuration ───
const UPI_ID = 'rabadiyameet09@okaxis'
const MERCHANT_NAME = 'Meet Rabadiya'
const TIMER_MINUTES = 39

// ─── Generate unique token ───
function generateToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let token = 'TBL'
    for (let i = 0; i < 8; i++) token += chars[Math.floor(Math.random() * chars.length)]
    return token
}

// ─── Generate order number ───
function generateOrderNumber() {
    const now = new Date()
    const d = String(now.getDate()).padStart(2, '0')
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const rand = Math.floor(1000 + Math.random() * 9000)
    return `ORD-${d}${m}-${rand}`
}

// ═══════════════════════════════════════
// FLOORS & TABLES
// ═══════════════════════════════════════

export async function getFloors() {
    const { data, error } = await supabase
        .from('floors')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
    if (error) throw error
    return data || []
}

export async function getTablesByFloor(floorId) {
    const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('floor_id', floorId)
        .eq('is_active', true)
        .order('table_number', { ascending: true })
    if (error) throw error
    return data || []
}

// ═══════════════════════════════════════
// TABLE SESSION (Select Table)
// ═══════════════════════════════════════

export async function createTableSession(tableId, floorId, tableNumber) {
    const tableToken = generateToken()

    // 1. Create session
    const { data: session, error: sessionErr } = await supabase
        .from('table_sessions')
        .insert({
            table_id: tableId,
            floor_id: floorId,
            table_number: tableNumber,
            table_token: tableToken,
            status: 'active',
            session_start: new Date().toISOString()
        })
        .select()
        .single()

    if (sessionErr) throw sessionErr

    // 2. Mark table as occupied
    const { error: tableErr } = await supabase
        .from('tables')
        .update({
            status: 'occupied',
            qr_code_token: tableToken,
            current_session_id: session.id,
            occupied_since: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', tableId)

    if (tableErr) throw tableErr

    return { session, tableToken }
}

// ═══════════════════════════════════════
// MENU — Categories & Products
// ═══════════════════════════════════════

export async function getCategories() {
    const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
    if (error) throw error
    return data || []
}

export async function getProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*, product_categories(name, icon_emoji)')
        .eq('is_available', true)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
    if (error) throw error
    return data || []
}

// ═══════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════

export async function createOrder(tableToken, cartItems, subtotal, taxAmount, totalAmount) {
    // Look up table info from active session
    const { data: session, error: sessErr } = await supabase
        .from('table_sessions')
        .select('*, tables!table_sessions_table_id_fkey(id, table_number)')
        .eq('table_token', tableToken)
        .eq('status', 'active')
        .single()

    if (sessErr || !session) throw new Error('Invalid or expired table session')

    const orderNumber = generateOrderNumber()
    const tableId = session.table_id
    const tableNumber = session.table_number

    // Create order
    const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
            order_number: orderNumber,
            table_id: tableId,
            table_number: tableNumber,
            table_token: tableToken,
            session_id: session.id,
            subtotal: subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            status: 'pending_payment',
            payment_status: 'pending',
            order_type: 'dine_in'
        })
        .select()
        .single()

    if (orderErr) throw orderErr

    // Create order items
    const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        tax_percentage: 5,
        line_total: item.price * item.quantity,
        kitchen_status: 'pending'
    }))

    const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(orderItems)

    if (itemsErr) throw itemsErr

    return order
}

// ═══════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════

export async function createPayment(orderId, method, amount, tableToken, tableNumber) {
    const paymentData = {
        order_id: orderId,
        table_token: tableToken,
        table_number: tableNumber,
        amount: amount,
        payment_method: method,
        status: method === 'upi' ? 'pending' : 'pending_approval'
    }

    // For UPI, generate QR data
    if (method === 'upi') {
        const qrString = buildUPIString(amount, tableToken)
        paymentData.qr_code_data = qrString
        paymentData.qr_generated_at = new Date().toISOString()
        paymentData.upi_expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min
    }

    const { data: payment, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single()

    if (error) throw error

    // Update order status
    await supabase
        .from('orders')
        .update({
            status: 'payment_requested',
            payment_method: method,
            payment_status: method === 'cash' ? 'pending_cash' : 'pending_upi',
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

    return payment
}

export function buildUPIString(amount, tableToken) {
    const params = new URLSearchParams({
        pa: UPI_ID,
        pn: MERCHANT_NAME,
        am: amount.toFixed(2),
        cu: 'INR',
        tn: `Table ${tableToken}`
    })
    return `upi://pay?${params.toString()}`
}

export function getQRCodeURL(upiString, size = 300) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiString)}`
}

// ─── Start 39-min timer + create kitchen order after payment confirmed ───
async function startTimerAndKitchen(orderId, tableToken) {
    const now = new Date()
    const timerEnd = new Date(now.getTime() + TIMER_MINUTES * 60 * 1000)

    // Update order → paid / received
    await supabase.from('orders')
        .update({
            status: 'received',
            payment_status: 'paid',
            payment_confirmed_at: now.toISOString(),
            updated_at: now.toISOString()
        })
        .eq('id', orderId)

    // Get order details for kitchen
    const { data: order } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single()

    if (order) {
        // Check if kitchen order already exists (DB trigger may have created it)
        const { data: existingKO } = await supabase
            .from('kitchen_orders')
            .select('id')
            .eq('order_id', order.id)
            .maybeSingle()

        if (!existingKO) {
            const items = (order.order_items || []).map(i => ({
                product_name: i.product_name,
                quantity: i.quantity,
                unit_price: i.unit_price,
                variant_name: i.variant_name || null,
                notes: i.notes || ''
            }))

            // Create kitchen order
            await supabase.from('kitchen_orders').insert({
                order_id: order.id,
                order_number: order.order_number,
                table_number: order.table_number,
                table_token: order.table_token,
                items: items,
                status: 'received',
                payment_method: order.payment_method,
                received_at: now.toISOString()
            })
        }
    }

    // Start 39-min timer on the session
    const { data: session } = await supabase
        .from('table_sessions')
        .select('id, table_id')
        .eq('table_token', tableToken)
        .eq('status', 'active')
        .maybeSingle()

    if (session) {
        // Update session timer
        await supabase.from('table_sessions')
            .update({
                timer_started_at: now.toISOString(),
                timer_ends_at: timerEnd.toISOString(),
                timer_status: 'running',
                updated_at: now.toISOString()
            })
            .eq('id', session.id)

        // Update table with occupied_until + occupied_since
        await supabase.from('tables')
            .update({
                occupied_since: now.toISOString(),
                occupied_until: timerEnd.toISOString(),
                updated_at: now.toISOString()
            })
            .eq('id', session.table_id)

        // Add timer log entry
        await supabase.from('table_timer_logs').insert({
            table_id: session.table_id,
            session_id: session.id,
            table_token: tableToken,
            duration_minutes: TIMER_MINUTES,
            timer_started_at: now.toISOString(),
            timer_ends_at: timerEnd.toISOString(),
            status: 'running'
        })
    }
}

// Mark UPI payment as completed (user clicked "I've Paid")
export async function completeUPIPayment(paymentId, orderId) {
    const { error } = await supabase
        .from('payments')
        .update({
            status: 'completed',
            payment_confirmed_at: new Date().toISOString(),
            cashier_name: 'UPI',
            updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)

    if (error) throw error

    // Get table token from order
    const { data: order } = await supabase.from('orders').select('table_token').eq('id', orderId).single()
    if (order) await startTimerAndKitchen(orderId, order.table_token)
}

// ═══════════════════════════════════════
// CASHIER PAYMENT REQUESTS
// ═══════════════════════════════════════

export async function createCashierRequest(paymentId, orderId, tableToken, tableNumber, amount, cartItems) {
    const orderSummary = cartItems.map(item => ({
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        line_total: item.price * item.quantity
    }))

    const { data, error } = await supabase
        .from('cashier_payment_requests')
        .insert({
            payment_id: paymentId,
            order_id: orderId,
            table_number: tableNumber,
            table_token: tableToken,
            total_amount: amount,
            order_summary: orderSummary,
            status: 'pending'
        })
        .select()
        .single()

    if (error) throw error
    return data
}

export async function getPendingCashierRequests() {
    const { data, error } = await supabase
        .from('cashier_payment_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
}

export async function approveCashierRequest(requestId, cashierName) {
    const now = new Date().toISOString()

    // 1. Get the request
    const { data: req, error: reqErr } = await supabase
        .from('cashier_payment_requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (reqErr || !req) throw new Error('Request not found')

    // 2. Approve the request
    const { error: updateErr } = await supabase
        .from('cashier_payment_requests')
        .update({
            status: 'approved',
            cashier_name: cashierName,
            responded_at: now
        })
        .eq('id', requestId)

    if (updateErr) throw updateErr

    // 3. Update payment
    const { error: payErr } = await supabase
        .from('payments')
        .update({
            status: 'approved',
            cashier_name: cashierName,
            approved_at: now,
            payment_confirmed_at: now,
            updated_at: now
        })
        .eq('id', req.payment_id)

    if (payErr) throw payErr

    // 4. Start timer + create kitchen order
    await startTimerAndKitchen(req.order_id, req.table_token)
}

// ═══════════════════════════════════════
// AUTO-FREE EXPIRED TABLES (39-min timer)
// ═══════════════════════════════════════

export async function autoFreeExpiredTables() {
    const now = new Date().toISOString()

    // Find sessions where timer has expired
    const { data: expired } = await supabase
        .from('table_sessions')
        .select('id, table_id, table_token')
        .eq('status', 'active')
        .eq('timer_status', 'running')
        .lte('timer_ends_at', now)

    if (!expired || expired.length === 0) return []

    for (const session of expired) {
        // End the session
        await supabase.from('table_sessions')
            .update({
                status: 'expired',
                session_end: now,
                timer_status: 'expired',
                updated_at: now
            })
            .eq('id', session.id)

        // Free the table
        await supabase.from('tables')
            .update({
                status: 'available',
                qr_code_token: null,
                current_session_id: null,
                occupied_since: null,
                occupied_until: null,
                updated_at: now
            })
            .eq('id', session.table_id)
    }

    return expired
}

export async function rejectCashierRequest(requestId, reason = '') {
    const now = new Date().toISOString()

    const { data: req, error: reqErr } = await supabase
        .from('cashier_payment_requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (reqErr || !req) throw new Error('Request not found')

    await supabase
        .from('cashier_payment_requests')
        .update({ status: 'rejected', responded_at: now })
        .eq('id', requestId)

    await supabase
        .from('payments')
        .update({
            status: 'rejected',
            rejected_at: now,
            rejection_reason: reason,
            updated_at: now
        })
        .eq('id', req.payment_id)

    await supabase
        .from('orders')
        .update({
            status: 'cancelled',
            payment_status: 'failed',
            cancelled_at: now,
            updated_at: now
        })
        .eq('id', req.order_id)
}

// ═══════════════════════════════════════
// ORDER TRACKING
// ═══════════════════════════════════════

export async function getOrdersByToken(tableToken) {
    const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('table_token', tableToken)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
}

export async function getKitchenOrderByOrderId(orderId) {
    const { data, error } = await supabase
        .from('kitchen_orders')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle()
    if (error) throw error
    return data
}

export async function getSessionByToken(tableToken) {
    const { data, error } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('table_token', tableToken)
        .eq('status', 'active')
        .maybeSingle()
    if (error) throw error
    return data
}

// ═══════════════════════════════════════
// KITCHEN PANEL
// ═══════════════════════════════════════

export async function getActiveKitchenOrders() {
    const { data, error } = await supabase
        .from('kitchen_orders')
        .select('*')
        .in('status', ['received', 'preparing', 'ready'])
        .order('received_at', { ascending: true })
    if (error) throw error
    return data || []
}

export async function updateKitchenOrderStatus(kitchenOrderId, newStatus) {
    const updates = { status: newStatus, updated_at: new Date().toISOString() }

    if (newStatus === 'preparing') {
        updates.started_preparing_at = new Date().toISOString()
    } else if (newStatus === 'ready') {
        updates.ready_at = new Date().toISOString()
    } else if (newStatus === 'served') {
        updates.served_at = new Date().toISOString()
    }

    const { error } = await supabase
        .from('kitchen_orders')
        .update(updates)
        .eq('id', kitchenOrderId)

    if (error) throw error

    // Also update the parent order status
    const { data: ko } = await supabase
        .from('kitchen_orders')
        .select('order_id')
        .eq('id', kitchenOrderId)
        .single()

    if (ko) {
        const orderStatus = newStatus === 'preparing' ? 'preparing'
            : newStatus === 'ready' ? 'ready'
                : newStatus === 'served' ? 'served'
                    : null

        if (orderStatus) {
            await supabase
                .from('orders')
                .update({ status: orderStatus, updated_at: new Date().toISOString() })
                .eq('id', ko.order_id)
        }
    }
}

// ═══════════════════════════════════════
// ADMIN — Table Timer Management
// ═══════════════════════════════════════

export async function getAllTablesWithTimers() {
    const { data, error } = await supabase
        .from('tables')
        .select('*, floors(name), table_sessions!table_sessions_table_id_fkey(id, table_token, timer_started_at, timer_ends_at, timer_status, session_start, status)')
        .eq('is_active', true)
        .order('table_number', { ascending: true })
    if (error) throw error

    // Post-process: extract the current session from the sessions array
    return (data || []).map(table => {
        const sessions = table.table_sessions || []
        // Match by current_session_id, or fall back to the latest active session
        let currentSession = null
        if (table.current_session_id) {
            currentSession = sessions.find(s => s.id === table.current_session_id) || null
        }
        if (!currentSession) {
            currentSession = sessions.find(s => s.status === 'active') || null
        }
        return { ...table, table_sessions: currentSession }
    })
}

export async function forceFreeTaTable(tableId, sessionId) {
    const now = new Date().toISOString()

    if (sessionId) {
        await supabase
            .from('table_sessions')
            .update({
                status: 'force_freed',
                session_end: now,
                timer_status: 'stopped',
                updated_at: now
            })
            .eq('id', sessionId)
    }

    await supabase
        .from('tables')
        .update({
            status: 'available',
            qr_code_token: null,
            current_session_id: null,
            occupied_since: null,
            occupied_until: null,
            updated_at: now
        })
        .eq('id', tableId)
}

export async function extendTableTimer(sessionId, extraMinutes = 15) {
    const { data: session, error: sessErr } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

    if (sessErr || !session) throw new Error('Session not found')

    const currentEnd = new Date(session.timer_ends_at)
    const newEnd = new Date(currentEnd.getTime() + extraMinutes * 60 * 1000)
    const now = new Date().toISOString()

    await supabase
        .from('table_sessions')
        .update({
            timer_ends_at: newEnd.toISOString(),
            timer_status: 'extended',
            updated_at: now
        })
        .eq('id', sessionId)

    await supabase
        .from('tables')
        .update({
            occupied_until: newEnd.toISOString(),
            updated_at: now
        })
        .eq('id', session.table_id)
}

// ═══════════════════════════════════════
// ADMIN — Payments Overview
// ═══════════════════════════════════════

export async function getAllPayments() {
    const { data, error } = await supabase
        .from('payments')
        .select('*, orders(order_number, table_number, table_token, total_amount, status)')
        .order('created_at', { ascending: false })
        .limit(100)
    if (error) throw error
    return data || []
}

// ═══════════════════════════════════════
// ADMIN — Dashboard Stats
// ═══════════════════════════════════════

export async function getDashboardStats() {
    const [tables, orders, payments, sessions] = await Promise.all([
        supabase.from('tables').select('status', { count: 'exact' }).eq('is_active', true),
        supabase.from('orders').select('status, total_amount').eq('is_deleted', false).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase.from('payments').select('status, amount, payment_method').gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase.from('table_sessions').select('status').eq('status', 'active')
    ])

    const tablesData = tables.data || []
    const ordersData = orders.data || []
    const paymentsData = payments.data || []

    return {
        totalTables: tablesData.length,
        occupiedTables: tablesData.filter(t => t.status === 'occupied').length,
        availableTables: tablesData.filter(t => t.status === 'available').length,
        todayOrders: ordersData.length,
        todayRevenue: paymentsData.filter(p => ['completed', 'approved'].includes(p.status)).reduce((s, p) => s + Number(p.amount), 0),
        pendingPayments: paymentsData.filter(p => ['pending', 'pending_approval'].includes(p.status)).length,
        activeSessions: sessions.data?.length || 0,
        cashPayments: paymentsData.filter(p => p.payment_method === 'cash' && ['completed', 'approved'].includes(p.status)).length,
        upiPayments: paymentsData.filter(p => p.payment_method === 'upi' && ['completed', 'approved'].includes(p.status)).length
    }
}

// ═══════════════════════════════════════
// CUSTOMER FEEDBACK
// ═══════════════════════════════════════

export async function submitFeedback(feedbackData) {
    const { data, error } = await supabase
        .from('customer_feedback')
        .insert({
            table_token: feedbackData.table_token,
            table_number: feedbackData.table_number,
            order_id: feedbackData.order_id || null,
            session_id: feedbackData.session_id || null,
            food_quality_rating: feedbackData.food_quality_rating,
            service_speed_rating: feedbackData.service_speed_rating,
            waiting_time_rating: feedbackData.waiting_time_rating,
            ambience_rating: feedbackData.ambience_rating,
            overall_rating: feedbackData.overall_rating,
            comment: feedbackData.comment || '',
            suggestions: feedbackData.suggestions || ''
        })
        .select()
        .single()

    if (error) throw error
    return data
}

// ═══════════════════════════════════════
// ADMIN — ALL FEEDBACK
// ═══════════════════════════════════════

export async function getAllFeedback() {
    const { data, error } = await supabase
        .from('customer_feedback')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
}

export async function getFeedbackStats() {
    const feedbacks = await getAllFeedback()
    if (!feedbacks.length) return { total: 0, avgOverall: 0, avgFood: 0, avgService: 0, avgWaiting: 0, avgAmbience: 0 }

    const avg = (key) => {
        const vals = feedbacks.filter(f => f[key]).map(f => f[key])
        return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0
    }

    return {
        total: feedbacks.length,
        avgOverall: avg('overall_rating'),
        avgFood: avg('food_quality_rating'),
        avgService: avg('service_speed_rating'),
        avgWaiting: avg('waiting_time_rating'),
        avgAmbience: avg('ambience_rating')
    }
}
