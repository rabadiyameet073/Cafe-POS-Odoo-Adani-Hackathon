/**
 * API Routes Index
 * 
 * All API routes are mounted under /api (see app.js).
 * Each route file handles its own middleware (auth, validation, etc.).
 * 
 * Route Map:
 *   /api/auth        → Login, signup, token refresh
 *   /api/users       → User management (admin)
 *   /api/floors      → Floor CRUD
 *   /api/tables      → Table CRUD & status
 *   /api/categories  → Menu categories
 *   /api/products    → Menu items CRUD
 *   /api/cart        → Customer cart operations
 *   /api/orders      → Order lifecycle (create → prepare → serve)
 *   /api/payments    → UPI/QR payment processing
 *   /api/sessions    → Cashier shift sessions
 *   /api/kitchen     → Kitchen display orders
 *   /api/timers      → Table session timers
 *   /api/admin       → Admin analytics & operations
 *   /api/feedback    → Customer feedback
 *   /api/reports     → Sales & performance reports
 *   /api/monitoring  → System health & metrics
 *   /api/system      → System info & status
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const floorRoutes = require('./floor.routes');
const tableRoutes = require('./table.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');
const paymentRoutes = require('./payment.routes');
const sessionRoutes = require('./session.routes');
const kitchenRoutes = require('./kitchen.routes');
const timerRoutes = require('./timer.routes');
const adminRoutes = require('./admin.routes');
const feedbackRoutes = require('./feedback.routes');
const reportRoutes = require('./report.routes');
const monitoringRoutes = require('./monitoring.routes');
const systemRoutes = require('./system.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/floors', floorRoutes);
router.use('/tables', tableRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/sessions', sessionRoutes);
router.use('/kitchen', kitchenRoutes);
router.use('/timers', timerRoutes);
router.use('/admin', adminRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/reports', reportRoutes);
router.use('/monitoring', monitoringRoutes);
router.use('/system', systemRoutes);

router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Cafe POS API v1.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            floors: '/api/floors',
            tables: '/api/tables',
            categories: '/api/categories',
            products: '/api/products',
            cart: '/api/cart',
            orders: '/api/orders',
            payments: '/api/payments',
            sessions: '/api/sessions',
            kitchen: '/api/kitchen',
            timers: '/api/timers',
            admin: '/api/admin',
            feedback: '/api/feedback',
            reports: '/api/reports',
            monitoring: '/api/monitoring',
            system: '/api/system'
        }
    });
});

module.exports = router;
