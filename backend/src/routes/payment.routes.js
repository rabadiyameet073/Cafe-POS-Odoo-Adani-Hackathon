
const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/paymentController');
const { verifyToken, requireAdmin, requireCashier } = require('../middleware/authMiddleware');
const { auditAdminAction } = require('../middleware/auditMiddleware');
const { enforceHTTPS } = require('../middleware/securityMiddleware');
const { validate, validateUUIDParam } = require('../middleware/validationMiddleware');
const { processPaymentValidation, createMethodValidation, generateQRValidation } = require('../validators/paymentValidator');

router.get('/methods', verifyToken, requireAdmin, paymentController.getAllPaymentMethods);

router.get('/methods/enabled', verifyToken, paymentController.getEnabledMethods);

router.post('/methods', verifyToken, requireAdmin, auditAdminAction('create_payment_method'), createMethodValidation, validate, paymentController.createPaymentMethod);

router.put('/methods/:id', verifyToken, validateUUIDParam('id'), requireAdmin, auditAdminAction('update_payment_method'), paymentController.updatePaymentMethod);

router.patch('/methods/:id/toggle', verifyToken, validateUUIDParam('id'), requireAdmin, auditAdminAction('toggle_payment_method'), paymentController.togglePaymentMethod);

router.post('/', verifyToken, processPaymentValidation, validate, paymentController.processPayment);

router.get('/:id', verifyToken, validateUUIDParam('id'), paymentController.getPaymentById);

router.get('/order/:orderId', verifyToken, validateUUIDParam('orderId'), paymentController.getOrderPayments);

router.post('/:id/verify', verifyToken, validateUUIDParam('id'), paymentController.verifyPayment);

router.post('/qr/generate', verifyToken, generateQRValidation, validate, paymentController.generateQRCode);

router.get('/cash/requests', verifyToken, requireCashier, paymentController.getPendingCashRequests);

router.post('/cash/request', verifyToken, paymentController.createCashRequest);

router.post('/cash/approve', verifyToken, requireCashier, auditAdminAction('approve_cash_payment'), paymentController.approveCashPayment);

router.post('/cash/reject', verifyToken, requireCashier, auditAdminAction('reject_cash_payment'), paymentController.rejectCashPayment);

// UPI endpoints with HTTPS enforcement
router.post('/upi/generate-qr', verifyToken, enforceHTTPS, paymentController.generateUPIQR);

router.post('/upi/verify', enforceHTTPS, paymentController.verifyUPIPayment);

module.exports = router;
