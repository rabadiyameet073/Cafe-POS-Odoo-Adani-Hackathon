const { supabase } = require('../config/supabase');
const { formatResponse, parseDateRange } = require('../utils/helpers');
const { catchAsync, ValidationError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const getSalesReport = catchAsync(async (req, res) => {
    const { period = 'today', session_id, start_date, end_date } = req.query;

    const { start, end } = parseDateRange(period, start_date, end_date);

    let query = supabase
        .from('orders')
        .select('id, total_amount, tax_amount, discount_amount, subtotal, created_at')
        .eq('status', 'completed')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

    if (session_id) {
        query = query.eq('session_id', session_id);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    const summary = {
        total_orders: orders.length,
        total_revenue: orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
        total_tax: orders.reduce((sum, o) => sum + parseFloat(o.tax_amount || 0), 0),
        total_discounts: orders.reduce((sum, o) => sum + parseFloat(o.discount_amount || 0), 0),
        average_order_value: orders.length > 0
            ? orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0) / orders.length
            : 0
    };

    const { data: payments } = await supabase
        .from('payments')
        .select('amount, payment_methods(display_name)')
        .eq('status', 'completed')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

    const paymentBreakdown = {};
    (payments || []).forEach(p => {
        const method = p.payment_methods?.display_name || 'Unknown';
        if (!paymentBreakdown[method]) {
            paymentBreakdown[method] = { count: 0, total: 0 };
        }
        paymentBreakdown[method].count++;
        paymentBreakdown[method].total += parseFloat(p.amount);
    });

    res.status(200).json(formatResponse(true, 'Sales report generated', {
        period: { start, end },
        summary,
        payment_breakdown: paymentBreakdown
    }));
});

const getProductReport = catchAsync(async (req, res) => {
    const { period = 'today', start_date, end_date } = req.query;

    const { start, end } = parseDateRange(period, start_date, end_date);

    const { data: items, error } = await supabase
        .from('order_items')
        .select(`
            quantity, line_total, unit_price,
            products(id, name, category_id, product_categories(name)),
            orders!inner(status, created_at)
        `)
        .eq('orders.status', 'completed')
        .gte('orders.created_at', start.toISOString())
        .lte('orders.created_at', end.toISOString());

    if (error) throw error;

    const productStats = {};
    (items || []).forEach(item => {
        const productId = item.products?.id;
        if (!productId) return;

        if (!productStats[productId]) {
            productStats[productId] = {
                product_id: productId,
                product_name: item.products.name,
                category: item.products.product_categories?.name || 'Uncategorized',
                units_sold: 0,
                revenue: 0,
                order_count: 0
            };
        }

        productStats[productId].units_sold += item.quantity;
        productStats[productId].revenue += parseFloat(item.line_total);
        productStats[productId].order_count++;
    });

    const products = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);

    res.status(200).json(formatResponse(true, 'Product report generated', {
        period: { start, end },
        products,
        count: products.length
    }));
});

const getSessionReport = catchAsync(async (req, res) => {
    const { limit = 10 } = req.query;

    const { data: sessions, error } = await supabase
        .from('pos_sessions')
        .select('*, users(full_name)')
        .order('opened_at', { ascending: false })
        .limit(parseInt(limit));

    if (error) throw error;

    const sessionsWithStats = [];
    for (const session of sessions || []) {
        const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, status')
            .eq('session_id', session.id);

        const completed = (orders || []).filter(o => o.status === 'completed');

        sessionsWithStats.push({
            ...session,
            stats: {
                total_orders: (orders || []).length,
                completed_orders: completed.length,
                total_revenue: completed.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
            }
        });
    }

    res.status(200).json(formatResponse(true, 'Session report generated', {
        sessions: sessionsWithStats,
        count: sessionsWithStats.length
    }));
});

const getFeedbackReport = catchAsync(async (req, res) => {
    const { period = 'month', start_date, end_date } = req.query;

    const { start, end } = parseDateRange(period, start_date, end_date);

    const { data: feedbacks, error } = await supabase
        .from('feedback')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

    if (error) throw error;

    const count = (feedbacks || []).length;
    if (count === 0) {
        return res.status(200).json(formatResponse(true, 'Feedback report generated', {
            period: { start, end },
            stats: null,
            message: 'No feedback in this period'
        }));
    }

    const avg = (field) => {
        const values = feedbacks.filter(f => f[field] != null).map(f => f[field]);
        return values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0;
    };

    const recommendations = feedbacks.filter(f => f.would_recommend === true).length;

    res.status(200).json(formatResponse(true, 'Feedback report generated', {
        period: { start, end },
        stats: {
            total_feedback: count,
            average_overall: parseFloat(avg('overall_rating')),
            average_food_quality: parseFloat(avg('food_quality_rating')),
            average_service: parseFloat(avg('service_rating')),
            recommendation_rate: parseFloat(((recommendations / count) * 100).toFixed(2))
        }
    }));
});

const exportPDF = catchAsync(async (req, res) => {
    res.status(501).json(formatResponse(false, 'PDF export not implemented yet'));
});

const exportExcel = catchAsync(async (req, res) => {
    res.status(501).json(formatResponse(false, 'Excel export not implemented yet'));
});

module.exports = {
    getSalesReport,
    getProductReport,
    getSessionReport,
    getFeedbackReport,
    exportPDF,
    exportExcel
};
