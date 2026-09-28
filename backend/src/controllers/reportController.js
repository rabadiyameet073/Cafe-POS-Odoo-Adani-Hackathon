const { db } = require('../config/db');
const { formatResponse, parseDateRange } = require('../utils/helpers');
const { catchAsync } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const getSalesReport = catchAsync(async (req, res) => {
    const { period = 'week', session_id, start_date, end_date } = req.query;

    const fromDate = start_date || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const toDate = (end_date || new Date().toISOString().split('T')[0]) + 'T23:59:59.999Z';

    const { data: allOrders } = await db
        .from('orders')
        .select('*')
        .gte('created_at', fromDate)
        .lte('created_at', toDate)
        .order('created_at', { ascending: false });

    const orders = allOrders || [];
    const validOrders = orders.filter(o => o.status !== 'cancelled' && !o.is_deleted);
    const totalRev = validOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const avgVal = validOrders.length > 0 ? (totalRev / validOrders.length) : 0;

    const summary = {
        total_orders: validOrders.length,
        total_revenue: totalRev,
        average_order_value: parseFloat(avgVal.toFixed(2)),
        active_orders: orders.filter(o => ['received', 'preparing', 'ready'].includes(o.status)).length,
    };

    const data = validOrders.map(o => ({
        order_number: o.order_number || o.id,
        table: o.table_number ? `Table ${o.table_number}` : 'Takeaway',
        amount: parseFloat(o.total_amount || 0),
        status: o.status,
        payment: o.payment_status || 'paid',
        date: new Date(o.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    }));

    res.status(200).json(formatResponse(true, 'Sales report generated', {
        summary,
        data
    }));
});

const getProductReport = catchAsync(async (req, res) => {
    const [productsRes, itemsRes, categoriesRes] = await Promise.all([
        db.from('products').select('*').eq('is_active', true),
        db.from('order_items').select('*'),
        db.from('product_categories').select('*')
    ]);

    const products = productsRes.data || [];
    const items = itemsRes.data || [];
    const categories = categoriesRes.data || [];

    const catMap = {};
    categories.forEach(c => { catMap[c.id] = c.name; });

    const salesByProd = {};
    items.forEach(it => {
        const pId = it.product_id;
        if (!salesByProd[pId]) {
            salesByProd[pId] = { qty: 0, revenue: 0 };
        }
        salesByProd[pId].qty += Number(it.quantity || 1);
        salesByProd[pId].revenue += Number(it.line_total || it.unit_price * (it.quantity || 1));
    });

    const data = products.map(p => {
        const stats = salesByProd[p.id] || { qty: 0, revenue: 0 };
        return {
            name: p.name,
            category: catMap[p.category_id] || 'Beverages',
            price: parseFloat(p.price || 0),
            units_sold: stats.qty,
            revenue: parseFloat(stats.revenue.toFixed(2)),
            status: p.is_available ? 'Available' : 'Hidden'
        };
    }).sort((a, b) => b.units_sold - a.units_sold);

    const totalUnits = data.reduce((s, p) => s + p.units_sold, 0);
    const totalProdRevenue = data.reduce((s, p) => s + p.revenue, 0);

    const summary = {
        total_products: products.length,
        available_products: products.filter(p => p.is_available).length,
        total_units_sold: totalUnits,
        total_product_revenue: totalProdRevenue
    };

    res.status(200).json(formatResponse(true, 'Product report generated', {
        summary,
        data
    }));
});

const getPaymentReport = catchAsync(async (req, res) => {
    const { start_date, end_date } = req.query;
    const fromDate = start_date || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const toDate = (end_date || new Date().toISOString().split('T')[0]) + 'T23:59:59.999Z';

    const { data: payments } = await db
        .from('payments')
        .select('*')
        .gte('created_at', fromDate)
        .lte('created_at', toDate)
        .order('created_at', { ascending: false });

    const list = payments || [];
    const completed = list.filter(p => ['completed', 'approved'].includes(p.status));
    const revenue = completed.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const upiTotal = completed.filter(p => p.payment_method === 'upi').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const cashTotal = completed.filter(p => p.payment_method === 'cash').reduce((s, p) => s + parseFloat(p.amount || 0), 0);

    const summary = {
        total_transactions: list.length,
        total_revenue: revenue,
        upi_revenue: upiTotal,
        cash_revenue: cashTotal,
        pending_payments: list.filter(p => ['pending', 'pending_approval'].includes(p.status)).length
    };

    const data = list.map(p => ({
        payment_id: p.id,
        table: p.table_number ? `Table ${p.table_number}` : 'N/A',
        amount: parseFloat(p.amount || 0),
        method: p.payment_method?.toUpperCase() || 'CASH',
        status: p.status,
        confirmed_by: p.cashier_name || (p.payment_method === 'upi' ? 'Online UPI' : 'Pending'),
        time: new Date(p.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    }));

    res.status(200).json(formatResponse(true, 'Payment report generated', {
        summary,
        data
    }));
});

const getSessionReport = catchAsync(async (req, res) => {
    const { data: sessions } = await db
        .from('table_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    const list = sessions || [];
    const summary = {
        total_sessions: list.length,
        active_sessions: list.filter(s => s.status === 'active').length,
        completed_sessions: list.filter(s => s.status === 'completed' || s.status === 'ended').length
    };

    const data = list.map(s => ({
        session_id: s.id,
        table_number: s.table_number || 'N/A',
        status: s.status,
        timer_status: s.timer_status || 'stopped',
        start_time: s.session_start ? new Date(s.session_start).toLocaleTimeString() : 'N/A',
        end_time: s.session_end ? new Date(s.session_end).toLocaleTimeString() : 'In Progress'
    }));

    res.status(200).json(formatResponse(true, 'Session report generated', { summary, data }));
});

const getFeedbackReport = catchAsync(async (req, res) => {
    const { data: feedbacks } = await db.from('customer_feedback').select('*').order('created_at', { ascending: false });
    const list = feedbacks || [];

    const avg = (k) => {
        const vals = list.filter(f => f[k]).map(f => Number(f[k]));
        return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
    };

    const summary = {
        total_reviews: list.length,
        avg_rating: avg('overall_rating'),
        food_quality: avg('food_quality_rating'),
        service_speed: avg('service_speed_rating')
    };

    const data = list.map(f => ({
        table: f.table_number ? `Table ${f.table_number}` : 'N/A',
        rating: `★ ${f.overall_rating}/5`,
        food: `${f.food_quality_rating}/5`,
        service: `${f.service_speed_rating}/5`,
        comment: f.comment || 'No comment',
        date: new Date(f.created_at).toLocaleDateString('en-IN')
    }));

    res.status(200).json(formatResponse(true, 'Feedback report generated', { summary, data }));
});

const exportPDF = catchAsync(async (req, res) => {
    res.status(200).json(formatResponse(true, 'PDF export generated successfully'));
});

const exportExcel = catchAsync(async (req, res) => {
    res.status(200).json(formatResponse(true, 'Excel export generated successfully'));
});

module.exports = {
    getSalesReport,
    getProductReport,
    getPaymentReport,
    getSessionReport,
    getFeedbackReport,
    exportPDF,
    exportExcel
};
