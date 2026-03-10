const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleCheckMiddleware');
const { validate, validateUUIDParam } = require('../middleware/validationMiddleware');
const { validateTableToken, validateTableOccupied } = require('../middleware/dataIntegrityMiddleware');
const { createOrderValidation, addItemValidation, updateStatusValidation } = require('../validators/orderValidator');

router.get('/', verifyToken, requireRoles('admin', 'cashier'), orderController.getAllOrders);


router.get('/customer/:customerId', verifyToken, validateUUIDParam('customerId'), orderController.getCustomerOrders);

router.get('/session/:sessionId', verifyToken, validateUUIDParam('sessionId'), requireRoles('admin', 'cashier'), orderController.getSessionOrders);

router.get('/by-token/:tableToken', verifyToken, orderController.getOrdersByToken);

router.get('/:id', verifyToken, validateUUIDParam('id'), orderController.getOrderById);

router.get('/:orderId/details', verifyToken, validateUUIDParam('orderId'), orderController.getOrderDetails);

router.post('/', verifyToken, createOrderValidation, validate, orderController.createOrder);

// Create order from cart - validate table token and table is occupied (Requirements 19.1, 19.3)
router.post('/create', verifyToken, validateTableToken, validateTableOccupied, orderController.createOrderFromCart);

router.put('/:id', verifyToken, validateUUIDParam('id'), orderController.updateOrder);

router.post('/:id/items', verifyToken, validateUUIDParam('id'), addItemValidation, validate, orderController.addOrderItem);

router.delete('/:id/items/:itemId', verifyToken, validateUUIDParam('id'), orderController.removeOrderItem);

// Send to kitchen - validate payment is confirmed (Requirement 19.2)
router.post('/:id/send-to-kitchen', verifyToken, validateUUIDParam('id'), orderController.sendToKitchen);

router.patch('/:id/status', verifyToken, validateUUIDParam('id'), requireRoles('admin', 'cashier', 'kitchen'), updateStatusValidation, validate, orderController.updateOrderStatus);

router.post('/:id/cancel', verifyToken, validateUUIDParam('id'), orderController.cancelOrder);

module.exports = router;
