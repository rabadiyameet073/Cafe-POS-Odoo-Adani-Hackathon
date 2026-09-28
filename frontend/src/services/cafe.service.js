import { db } from './db.service'

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
    const { data, error } = await db
        .from('floors')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
    if (error) throw error
    return data || []
}

export async function getTablesByFloor(floorId) {
    const { data, error } = await db
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
    const { data: session, error: sessionErr } = await db
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
    const { error: tableErr } = await db
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
    const { data, error } = await db
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
    if (error) throw error
    return data || []
}

export async function getProducts() {
    const { data, error } = await db
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
    // 1. Look up table info from active session
    let session = null
    try {
        const { data, error } = await db
            .from('table_sessions')
            .select('*')
            .eq('table_token', tableToken)
            .eq('status', 'active')
            .maybeSingle()
        if (!error && data) session = data
    } catch (e) {
        console.warn('Session lookup warning:', e)
    }

    // Safe fallbacks from sessionStorage
    const storedTableId = sessionStorage.getItem('table_id') || 't1'
    const storedTableNumber = sessionStorage.getItem('table_number') || 'G-1'
    const storedSessionId = sessionStorage.getItem('session_id') || ('sess_' + Date.now())

    const tableId = session?.table_id || storedTableId
    const tableNumber = session?.table_number || storedTableNumber
    const sessionId = session?.id || storedSessionId

    // Ensure session document exists in DB (crucial across serverless cold starts)
    if (!session && tableToken) {
        try {
            const { data: newSess } = await db
                .from('table_sessions')
                .insert({
                    id: sessionId,
                    table_id: tableId,
                    table_number: tableNumber,
                    table_token: tableToken,
                    status: 'active',
                    session_start: new Date().toISOString()
                })
                .select()
                .maybeSingle()
            if (newSess) session = newSess
        } catch (e) {
            console.warn('Ensure session note:', e)
        }
    }

    const orderNumber = generateOrderNumber()

    // 2. Create order
    const { data: order, error: orderErr } = await db
        .from('orders')
        .insert({
            order_number: orderNumber,
            table_id: tableId,
            table_number: tableNumber,
            table_token: tableToken,
            session_id: sessionId,
            subtotal: subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            status: 'pending_payment',
            payment_status: 'pending',
            order_type: 'dine_in',
            is_deleted: false
        })
        .select()
        .single()

    if (orderErr) throw orderErr

    // 3. Create order items
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

    const { error: itemsErr } = await db
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

    const { data: payment, error } = await db
        .from('payments')
        .insert(paymentData)
        .select()
        .single()

    if (error) throw error

    // Update order status
    await db
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

    // 1. Update order → paid / received
    try {
        await db.from('orders')
            .update({
                status: 'received',
                payment_status: 'paid',
                payment_confirmed_at: now.toISOString(),
                updated_at: now.toISOString()
            })
            .eq('id', orderId)
    } catch (e) {
        console.warn('Order status update warning:', e)
    }

    // 2. Get order details for kitchen
    let order = null
    try {
        const { data } = await db
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderId)
            .maybeSingle()
        order = data
    } catch (e) {}

    // Fallback: direct query for order_items if not populated
    let orderItems = order?.order_items || []
    if (orderItems.length === 0) {
        try {
            const { data: items } = await db.from('order_items').select('*').eq('order_id', orderId)
            if (items && items.length > 0) orderItems = items
        } catch (e) {}
    }

    const tableNumber = order?.table_number || sessionStorage.getItem('table_number') || 'G-1'
    const orderNumber = order?.order_number || generateOrderNumber()
    const resolvedToken = tableToken || order?.table_token || sessionStorage.getItem('table_token')

    // 3. Create kitchen order if not already existing
    try {
        const { data: existingKO } = await db
            .from('kitchen_orders')
            .select('id')
            .eq('order_id', orderId)
            .maybeSingle()

        if (!existingKO) {
            const items = orderItems.map(i => ({
                product_name: i.product_name,
                quantity: i.quantity,
                unit_price: i.unit_price,
                variant_name: i.variant_name || null,
                notes: i.notes || ''
            }))

            await db.from('kitchen_orders').insert({
                order_id: orderId,
                order_number: orderNumber,
                table_number: tableNumber,
                table_token: resolvedToken,
                items: items,
                status: 'received',
                stage: 'to_cook',
                payment_method: order?.payment_method || 'upi',
                received_at: now.toISOString()
            })
        }
    } catch (e) {
        console.warn('Kitchen order creation warning:', e)
    }

    // 4. Start 39-min timer on the session & table
    const tableId = order?.table_id || sessionStorage.getItem('table_id')

    try {
        if (resolvedToken) {
            await db.from('table_sessions')
                .update({
                    timer_started_at: now.toISOString(),
                    timer_ends_at: timerEnd.toISOString(),
                    timer_status: 'running',
                    updated_at: now.toISOString()
                })
                .eq('table_token', resolvedToken)
        }

        if (tableId) {
            await db.from('tables')
                .update({
                    status: 'occupied',
                    occupied_since: now.toISOString(),
                    occupied_until: timerEnd.toISOString(),
                    updated_at: now.toISOString()
                })
                .eq('id', tableId)
        }

        if (tableId && resolvedToken) {
            await db.from('table_timer_logs').insert({
                table_id: tableId,
                table_token: resolvedToken,
                duration_minutes: TIMER_MINUTES,
                timer_started_at: now.toISOString(),
                timer_ends_at: timerEnd.toISOString(),
                status: 'running'
            })
        }
    } catch (e) {
        console.warn('Timer start warning:', e)
    }
}

// Mark UPI payment as completed (user clicked "I've Paid")
export async function completeUPIPayment(paymentId, orderId, optionalTableToken) {
    const now = new Date().toISOString()

    const { error } = await db
        .from('payments')
        .update({
            status: 'completed',
            payment_confirmed_at: now,
            cashier_name: 'UPI Gateway',
            updated_at: now
        })
        .eq('id', paymentId)

    if (error) {
        console.warn('Payment update warning:', error)
    }

    // Resolve table token
    let token = optionalTableToken || sessionStorage.getItem('table_token')
    if (!token) {
        try {
            const { data: order } = await db.from('orders').select('table_token').eq('id', orderId).maybeSingle()
            if (order) token = order.table_token
        } catch (e) {}
    }

    await startTimerAndKitchen(orderId, token)
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

    const { data, error } = await db
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
    const { data, error } = await db
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
    const { data: req, error: reqErr } = await db
        .from('cashier_payment_requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (reqErr || !req) throw new Error('Request not found')

    // 2. Approve the request
    const { error: updateErr } = await db
        .from('cashier_payment_requests')
        .update({
            status: 'approved',
            cashier_name: cashierName,
            responded_at: now
        })
        .eq('id', requestId)

    if (updateErr) throw updateErr

    // 3. Update payment
    const { error: payErr } = await db
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
    const { data: expired } = await db
        .from('table_sessions')
        .select('id, table_id, table_token')
        .eq('status', 'active')
        .eq('timer_status', 'running')
        .lte('timer_ends_at', now)

    if (!expired || expired.length === 0) return []

    for (const session of expired) {
        // End the session
        await db.from('table_sessions')
            .update({
                status: 'expired',
                session_end: now,
                timer_status: 'expired',
                updated_at: now
            })
            .eq('id', session.id)

        // Free the table
        await db.from('tables')
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

    const { data: req, error: reqErr } = await db
        .from('cashier_payment_requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (reqErr || !req) throw new Error('Request not found')

    await db
        .from('cashier_payment_requests')
        .update({ status: 'rejected', responded_at: now })
        .eq('id', requestId)

    await db
        .from('payments')
        .update({
            status: 'rejected',
            rejected_at: now,
            rejection_reason: reason,
            updated_at: now
        })
        .eq('id', req.payment_id)

    await db
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
    const { data, error } = await db
        .from('orders')
        .select('*, order_items(*)')
        .eq('table_token', tableToken)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
}

export async function getKitchenOrderByOrderId(orderId) {
    const { data, error } = await db
        .from('kitchen_orders')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle()
    if (error) throw error
    return data
}

export async function getSessionByToken(tableToken) {
    const { data, error } = await db
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
    const { data, error } = await db
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

    const { error } = await db
        .from('kitchen_orders')
        .update(updates)
        .eq('id', kitchenOrderId)

    if (error) throw error

    // Also update the parent order status
    const { data: ko } = await db
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
            await db
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
    let data = []
    try {
        const res = await db
            .from('tables')
            .select('*, floors(name), table_sessions(id, table_token, timer_started_at, timer_ends_at, timer_status, session_start, status)')
            .eq('is_active', true)
            .order('table_number', { ascending: true })
        if (res.data) data = res.data
    } catch {
        const res = await db.from('tables').select('*, floors(name)').eq('is_active', true).order('table_number', { ascending: true })
        data = res.data || []
    }

    // Post-process: extract the active session cleanly
    return (data || []).map(table => {
        let currentSession = null
        if (Array.isArray(table.table_sessions)) {
            if (table.current_session_id) {
                currentSession = table.table_sessions.find(s => s.id === table.current_session_id) || null
            }
            if (!currentSession) {
                currentSession = table.table_sessions.find(s => s.status === 'active' || s.timer_status === 'running') || table.table_sessions[0] || null
            }
        } else if (table.table_sessions) {
            currentSession = table.table_sessions
        }
        return { ...table, table_sessions: currentSession }
    })
}

export async function forceFreeTaTable(tableId, sessionId) {
    const now = new Date().toISOString()

    if (!sessionId) {
        const { data: activeSess } = await db
            .from('table_sessions')
            .select('id')
            .eq('table_id', tableId)
            .eq('status', 'active')
            .maybeSingle()
        if (activeSess?.id) sessionId = activeSess.id
    }

    if (sessionId) {
        await db
            .from('table_sessions')
            .update({
                status: 'force_freed',
                session_end: now,
                timer_status: 'stopped',
                updated_at: now
            })
            .eq('id', sessionId)
    }

    await db
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

export async function extendTableTimer(sessionIdOrTableId, extraMinutes = 15) {
    let session = null
    let sessId = sessionIdOrTableId

    // Try fetching by session id
    const { data: s1 } = await db.from('table_sessions').select('*').eq('id', sessId).maybeSingle()
    if (s1) {
        session = s1
    } else {
        // Try fetching active session by table_id
        const { data: s2 } = await db.from('table_sessions').select('*').eq('table_id', sessId).eq('status', 'active').maybeSingle()
        if (s2) {
            session = s2
            sessId = s2.id
        }
    }

    const currentEnd = session?.timer_ends_at ? new Date(session.timer_ends_at) : new Date()
    const baseTime = currentEnd.getTime() > Date.now() ? currentEnd.getTime() : Date.now()
    const newEnd = new Date(baseTime + extraMinutes * 60 * 1000)
    const now = new Date().toISOString()

    if (sessId) {
        await db
            .from('table_sessions')
            .update({
                timer_ends_at: newEnd.toISOString(),
                timer_status: 'extended',
                updated_at: now
            })
            .eq('id', sessId)
    }

    const tId = session?.table_id || (sessionIdOrTableId.startsWith('tbl-') ? sessionIdOrTableId : null)
    if (tId) {
        await db
            .from('tables')
            .update({
                occupied_until: newEnd.toISOString(),
                updated_at: now
            })
            .eq('id', tId)
    }
}

// ═══════════════════════════════════════
// ADMIN — Payments Overview
// ═══════════════════════════════════════

export async function getAllPayments() {
    const { data, error } = await db
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
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
    const [tables, orders, payments, sessions] = await Promise.all([
        db.from('tables').select('status', { count: 'exact' }).eq('is_active', true),
        db.from('orders').select('status, total_amount, created_at').eq('is_deleted', false),
        db.from('payments').select('status, amount, payment_method, created_at'),
        db.from('table_sessions').select('status').eq('status', 'active')
    ])

    const tablesData = tables.data || []
    const allOrders = orders.data || []
    const allPayments = payments.data || []

    const todayOrders = allOrders.filter(o => o.created_at >= todayStart)
    const activeOrders = todayOrders.length > 0 ? todayOrders : allOrders

    const approvedPayments = allPayments.filter(p => ['completed', 'approved'].includes(p.status))
    const todayPayments = approvedPayments.filter(p => p.created_at >= todayStart)
    const activePayments = todayPayments.length > 0 ? todayPayments : approvedPayments

    return {
        totalTables: tablesData.length,
        occupiedTables: tablesData.filter(t => t.status === 'occupied').length,
        availableTables: tablesData.filter(t => t.status === 'available').length,
        todayOrders: activeOrders.length,
        todayRevenue: activePayments.reduce((s, p) => s + Number(p.amount || 0), 0),
        pendingPayments: allPayments.filter(p => ['pending', 'pending_approval'].includes(p.status)).length,
        activeSessions: sessions.data?.length || 0,
        cashPayments: activePayments.filter(p => p.payment_method === 'cash').length,
        upiPayments: activePayments.filter(p => p.payment_method === 'upi').length
    }
}

// ═══════════════════════════════════════
// CUSTOMER FEEDBACK
// ═══════════════════════════════════════

export async function submitFeedback(feedbackData) {
    const { data, error } = await db
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
    const { data, error } = await db
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
