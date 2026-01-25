
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const floorRoutes = require('./floor.routes');
const tableRoutes = require('./table.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const orderRoutes = require('./order.routes');
const paymentRoutes = require('./payment.routes');
const sessionRoutes = require('./session.routes');
const kitchenRoutes = require('./kitchen.routes');
const feedbackRoutes = require('./feedback.routes');
const reportRoutes = require('./report.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/floors', floorRoutes);
router.use('/tables', tableRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/sessions', sessionRoutes);
router.use('/kitchen', kitchenRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/reports', reportRoutes);

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
            orders: '/api/orders',
            payments: '/api/payments',
            sessions: '/api/sessions',
            kitchen: '/api/kitchen',
            feedback: '/api/feedback',
            reports: '/api/reports'
        }
    });
});

module.exports = router;
