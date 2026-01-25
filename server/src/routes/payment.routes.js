
const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleCheckMiddleware');
const { validate, validateUUIDParam } = require('../middleware/validationMiddleware');
const { processPaymentValidation, createMethodValidation, generateQRValidation } = require('../validators/paymentValidator');

router.get('/methods', verifyToken, requireRoles('admin'), paymentController.getAllPaymentMethods);

router.get('/methods/enabled', verifyToken, paymentController.getEnabledMethods);

router.post('/methods', verifyToken, requireRoles('admin'), createMethodValidation, validate, paymentController.createPaymentMethod);

router.put('/methods/:id', verifyToken, validateUUIDParam('id'), requireRoles('admin'), paymentController.updatePaymentMethod);

router.patch('/methods/:id/toggle', verifyToken, validateUUIDParam('id'), requireRoles('admin'), paymentController.togglePaymentMethod);

router.post('/', verifyToken, processPaymentValidation, validate, paymentController.processPayment);

router.get('/:id', verifyToken, validateUUIDParam('id'), paymentController.getPaymentById);

router.get('/order/:orderId', verifyToken, validateUUIDParam('orderId'), paymentController.getOrderPayments);

router.post('/:id/verify', verifyToken, validateUUIDParam('id'), paymentController.verifyPayment);

router.post('/qr/generate', verifyToken, generateQRValidation, validate, paymentController.generateQRCode);

module.exports = router;
