const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Session = require('../models/Session');
const Table = require('../models/Table');
const PaymentService = require('../services/PaymentService');
const TimerService = require('../services/TimerService');
const KitchenService = require('../services/KitchenService');
const { generatePaymentQR } = require('../services/qrService');
const { formatResponse } = require('../utils/helpers');
const { catchAsync, NotFoundError, ValidationError, ConflictError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const getAllPaymentMethods = catchAsync(async (req, res) => {
    const methods = await Payment.getAllMethods();

    res.status(200).json(formatResponse(true, 'Payment methods retrieved successfully', {
        methods,
        count: methods.length
    }));
});

const getEnabledMethods = catchAsync(async (req, res) => {
    const methods = await Payment.getEnabledMethods();

    res.status(200).json(formatResponse(true, 'Enabled payment methods retrieved', {
        methods,
        count: methods.length
    }));
});

const createPaymentMethod = catchAsync(async (req, res) => {
    const { name, display_name, is_enabled = true, upi_id, config } = req.body;

    if (!name || !display_name) {
        throw new ValidationError('Name and display_name are required');
    }

    const method = await Payment.createMethod({
        name,
        display_name,
        is_enabled,
        upi_id,
        config
    });

    logger.info(`Payment method created: ${display_name}`);

    res.status(201).json(formatResponse(true, 'Payment method created', {
        method
    }));
});

const updatePaymentMethod = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, display_name, is_enabled, upi_id, config } = req.body;

    const existingMethod = await Payment.getMethodById(id);
    if (!existingMethod) {
        throw new NotFoundError('Payment method');
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (display_name !== undefined) updates.display_name = display_name;
    if (is_enabled !== undefined) updates.is_enabled = is_enabled;
    if (upi_id !== undefined) updates.upi_id = upi_id;
    if (config !== undefined) updates.config = config;

    const method = await Payment.updateMethod(id, updates);

    logger.info(`Payment method updated: ${method.display_name}`);

    res.status(200).json(formatResponse(true, 'Payment method updated', {
        method
    }));
});

const togglePaymentMethod = catchAsync(async (req, res) => {
    const { id } = req.params;

    const method = await Payment.toggleMethod(id);

    if (!method) {
        throw new NotFoundError('Payment method');
    }

    logger.info(`Payment method toggled: ${method.display_name} -> ${method.is_enabled}`);

    res.status(200).json(formatResponse(true, 'Payment method toggled', {
        method
    }));
});

const processPayment = catchAsync(async (req, res) => {
    const { order_id, payment_method_id, amount } = req.body;

    const order = await Order.findById(order_id);
    if (!order) {
        throw new NotFoundError('Order');
    }

    if (parseFloat(amount) !== parseFloat(order.total_amount)) {
        throw new ValidationError(`Amount mismatch. Expected: ${order.total_amount}`);
    }

    const paymentMethod = await Payment.getMethodById(payment_method_id);
    if (!paymentMethod) {
        throw new NotFoundError('Payment method');
    }

    if (!paymentMethod.is_enabled) {
        throw new ConflictError('This payment method is not currently available');
    }

    const session = await Session.findAnyActive();

    const payment = await Payment.create({
        order_id,
        session_id: session?.id,
        payment_method_id,
        amount: parseFloat(amount),
        status: 'pending'
    });

    let responseData = { payment };

    if (paymentMethod.name === 'cash') {
        const completedPayment = await Payment.complete(payment.id);
        await Order.updateStatus(order_id, 'completed');

        if (order.table_id) {
            await Table.updateStatus(order.table_id, 'available');
        }

        responseData.payment = completedPayment;
        responseData.status = 'completed';

        logger.info(`Cash payment completed for order ${order.order_number}`);

    } else if (paymentMethod.name === 'upi_qr') {
        const qrResult = await generatePaymentQR({
            amount: parseFloat(amount),
            orderNumber: order.order_number
        });

        responseData.qr_code = qrResult.qrCode;
        responseData.upi_string = qrResult.upiString;
        responseData.status = 'pending';

    } else {
        responseData.payment_url = `/mock-payment?ref=${payment.id}&amount=${amount}`;
        responseData.status = 'pending';
    }

    const io = req.app.get('io');
    if (io) {
        io.emit('payment_initiated', {
            payment_id: payment.id,
            order_id,
            amount,
            method: paymentMethod.display_name
        });
    }

    res.status(201).json(formatResponse(true, 'Payment initiated', responseData));
});

const getPaymentById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const payment = await Payment.findById(id);

    if (!payment) {
        throw new NotFoundError('Payment');
    }

    res.status(200).json(formatResponse(true, 'Payment retrieved', {
        payment
    }));
});

const getOrderPayments = catchAsync(async (req, res) => {
    const { orderId } = req.params;

    const payments = await Payment.findByOrderId(orderId);

    res.status(200).json(formatResponse(true, 'Order payments retrieved', {
        payments,
        count: payments.length
    }));
});

const verifyPayment = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { transaction_id } = req.body;

    const payment = await Payment.findById(id);

    if (!payment) {
        throw new NotFoundError('Payment');
    }

    if (payment.status === 'completed') {
        return res.status(200).json(formatResponse(true, 'Payment already verified', {
            verified: true,
            payment
        }));
    }

    const completedPayment = await Payment.complete(id, transaction_id);

    await Order.updateStatus(payment.order_id, 'completed');

    const order = await Order.findById(payment.order_id);
    if (order?.table_id) {
        await Table.updateStatus(order.table_id, 'available');
    }

    logger.info(`Payment verified for order ${order?.order_number || payment.order_id}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('payment_completed', {
            payment_id: id,
            order_id: payment.order_id
        });

        if (order?.customer_id) {
            io.to(`customer_${order.customer_id}`).emit('payment_success', {
                order_id: payment.order_id
            });
        }
    }

    res.status(200).json(formatResponse(true, 'Payment verified successfully', {
        verified: true,
        payment: completedPayment
    }));
});

const generateQRCode = catchAsync(async (req, res) => {
    const { amount, order_number } = req.body;

    if (!amount) {
        throw new ValidationError('Amount is required');
    }

    const qrResult = await generatePaymentQR({
        amount: parseFloat(amount),
        orderNumber: order_number || 'Payment'
    });

    res.status(200).json(formatResponse(true, 'QR code generated', {
        qr_code: qrResult.qrCode,
        upi_string: qrResult.upiString
    }));
});

/**
 * Get pending cash payment requests
 * GET /api/payments/cash/requests
 * Requirements: 4.2, 4.3
 */
const getPendingCashRequests = catchAsync(async (req, res) => {
    const { status = 'pending' } = req.query;

    const { data: requests, error } = await require('../config/supabase').supabase
        .from('cashier_payment_requests')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: true });

    if (error) {
        throw new ConflictError('Failed to fetch payment requests');
    }

    logger.info(`Fetched ${requests.length} ${status} cash payment requests`);

    res.status(200).json(formatResponse(true, 'Payment requests retrieved', {
        requests,
        count: requests.length
    }));
});

/**
 * Create cash payment request
 * POST /api/payments/cash/request
 * Requirements: 4.1, 5.1
 */
const createCashRequest = catchAsync(async (req, res) => {
    const { order_id, table_token, amount } = req.body;

    if (!order_id || !table_token || !amount) {
        throw new ValidationError('order_id, table_token, and amount are required');
    }

    const result = await PaymentService.createCashPaymentRequest(
        order_id,
        parseFloat(amount),
        table_token
    );

    if (!result.success) {
        throw new ConflictError(result.error);
    }

    logger.info(`Cash payment request created: ${result.paymentId}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('cash_payment_request', {
            payment_id: result.paymentId,
            order_number: result.orderNumber,
            amount: amount
        });
    }

    res.status(201).json(formatResponse(true, 'Cash payment request created', {
        payment_id: result.paymentId,
        status: result.status
    }));
});

/**
 * Approve cash payment
 * POST /api/payments/cash/approve
 * Requirements: 5.1, 5.2, 11.1
 */
const approveCashPayment = catchAsync(async (req, res) => {
    const { payment_id, cashier_id } = req.body;

    if (!payment_id) {
        throw new ValidationError('payment_id is required');
    }

    const cashierId = cashier_id || req.user.id;
    const cashierName = req.user.full_name || req.user.email;

    const result = await PaymentService.approveCashPayment(
        payment_id,
        cashierId,
        cashierName
    );

    if (!result.success) {
        throw new ConflictError(result.error);
    }

    // Start timer
    const { data: order } = await require('../config/supabase').supabase
        .from('orders')
        .select('table_id, session_id')
        .eq('id', result.orderId)
        .single();

    if (order && order.session_id) {
        const timerResult = await TimerService.startTimer(order.table_id, order.session_id);
        if (timerResult.success) {
            logger.info(`Timer started for table after cash payment approval`);
        }
    }

    // Send to kitchen
    const kitchenResult = await KitchenService.sendToKitchen(result.orderId);
    if (kitchenResult.success) {
        logger.info(`Order sent to kitchen after cash payment approval`);
    }

    logger.info(`Cash payment approved by ${cashierName}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('payment_approved', {
            payment_id: payment_id,
            order_id: result.orderId
        });
    }

    res.status(200).json(formatResponse(true, 'Payment approved successfully', {
        success: true,
        order_id: result.orderId,
        timer_ends_at: order?.timer_ends_at
    }));
});

/**
 * Reject cash payment
 * POST /api/payments/cash/reject
 * Requirements: 5.3
 */
const rejectCashPayment = catchAsync(async (req, res) => {
    const { payment_id, cashier_id, rejection_reason } = req.body;

    if (!payment_id) {
        throw new ValidationError('payment_id is required');
    }

    if (!rejection_reason) {
        throw new ValidationError('rejection_reason is required');
    }

    const cashierId = cashier_id || req.user.id;
    const cashierName = req.user.full_name || req.user.email;

    const result = await PaymentService.rejectCashPayment(
        payment_id,
        cashierId,
        cashierName,
        rejection_reason
    );

    if (!result.success) {
        throw new ConflictError(result.error);
    }

    logger.info(`Cash payment rejected by ${cashierName}: ${rejection_reason}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('payment_rejected', {
            payment_id: payment_id,
            order_id: result.orderId,
            reason: rejection_reason
        });
    }

    res.status(200).json(formatResponse(true, 'Payment rejected', {
        success: true,
        message: rejection_reason
    }));
});

/**
 * Generate UPI QR code
 * POST /api/payments/upi/generate-qr
 * Requirements: 6.1, 6.2, 6.3
 */
const generateUPIQR = catchAsync(async (req, res) => {
    const { order_id, table_token, amount } = req.body;

    if (!order_id || !table_token || !amount) {
        throw new ValidationError('order_id, table_token, and amount are required');
    }

    const result = await PaymentService.generateUPIQRCode(
        order_id,
        parseFloat(amount),
        table_token
    );

    if (!result.success) {
        throw new ConflictError(result.error);
    }

    logger.info(`UPI QR code generated for order ${result.orderNumber}`);

    res.status(200).json(formatResponse(true, 'UPI QR code generated', {
        payment_id: result.paymentId,
        qr_code_data: result.qrCodeData,
        transaction_ref: result.transactionRef,
        expires_at: result.expiresAt
    }));
});

/**
 * Verify UPI payment
 * POST /api/payments/upi/verify
 * Requirements: 7.1, 7.2, 11.1, Security NFR 2
 */
const verifyUPIPayment = catchAsync(async (req, res) => {
    const { transaction_id, order_id, upi_reference, amount, signature } = req.body;

    if (!transaction_id || !order_id || !upi_reference || !amount) {
        throw new ValidationError('transaction_id, order_id, upi_reference, and amount are required');
    }

    const result = await PaymentService.verifyUPIPayment(
        transaction_id,
        order_id,
        upi_reference,
        parseFloat(amount),
        signature,
        req // Pass request object for HTTPS enforcement
    );

    if (!result.success) {
        throw new ConflictError(result.error);
    }

    // Start timer
    const { data: order } = await require('../config/supabase').supabase
        .from('orders')
        .select('table_id, session_id')
        .eq('id', order_id)
        .single();

    if (order && order.session_id) {
        const timerResult = await TimerService.startTimer(order.table_id, order.session_id);
        if (timerResult.success) {
            logger.info(`Timer started for table after UPI payment verification`);
        }
    }

    // Send to kitchen
    const kitchenResult = await KitchenService.sendToKitchen(order_id);
    if (kitchenResult.success) {
        logger.info(`Order sent to kitchen after UPI payment verification`);
    }

    logger.info(`UPI payment verified: ${transaction_id}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('payment_completed', {
            payment_id: result.paymentId,
            order_id: order_id
        });
    }

    res.status(200).json(formatResponse(true, 'Payment verified successfully', {
        success: true,
        order_id: order_id,
        payment_id: result.paymentId,
        timer_ends_at: order?.timer_ends_at
    }));
});

/**
 * Create Razorpay order
 * POST /api/payments/create-razorpay-order
 */
const createRazorpayOrder = catchAsync(async (req, res) => {
    const { order_id, amount } = req.body;

    if (!order_id || !amount) {
        throw new ValidationError('order_id and amount are required');
    }

    const env = require('../config/env');
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
        throw new ConflictError('Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file.');
    }

    const Razorpay = require('razorpay');
    const rzp = new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET
    });

    const razorpayOrder = await rzp.orders.create({
        amount: Math.round(parseFloat(amount) * 100), // Razorpay expects paise
        currency: 'INR',
        receipt: `order_${order_id.slice(0, 20)}`,
        notes: { order_id }
    });

    logger.info(`Razorpay order created: ${razorpayOrder.id} for order ${order_id}`);

    res.status(201).json(formatResponse(true, 'Razorpay order created', {
        razorpay_order_id: razorpayOrder.id,
        razorpay_key_id: env.RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
    }));
});

/**
 * Verify Razorpay payment
 * POST /api/payments/verify-razorpay
 */
const verifyRazorpayPayment = catchAsync(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
        throw new ValidationError('razorpay_order_id, razorpay_payment_id, razorpay_signature, and order_id are required');
    }

    const env = require('../config/env');
    const crypto = require('crypto');

    // Verify signature
    const generatedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (generatedSignature !== razorpay_signature) {
        logger.warn(`Invalid Razorpay signature for order ${order_id}`);
        throw new ValidationError('Invalid payment signature. Payment verification failed.');
    }

    // Record payment in database
    const session = await Session.findAnyActive();
    const payment = await Payment.create({
        order_id,
        session_id: session?.id,
        amount: parseFloat(amount),
        status: 'completed',
        transaction_id: razorpay_payment_id,
        paid_at: new Date().toISOString()
    });

    // Update order status
    await Order.updateStatus(order_id, 'confirmed');

    // Send to kitchen
    const kitchenResult = await KitchenService.sendToKitchen(order_id);
    if (kitchenResult.success) {
        logger.info(`Order sent to kitchen after Razorpay payment`);
    }

    // Start timer
    const order = await Order.findById(order_id);
    if (order?.table_id && order?.session_id) {
        await TimerService.startTimer(order.table_id, order.session_id);
    }

    logger.info(`Razorpay payment verified: ${razorpay_payment_id} for order ${order_id}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('payment_completed', {
            payment_id: payment.id,
            order_id
        });
    }

    res.status(200).json(formatResponse(true, 'Payment verified successfully', {
        success: true,
        payment_id: payment.id,
        order_id
    }));
});

module.exports = {
    getAllPaymentMethods,
    getEnabledMethods,
    createPaymentMethod,
    updatePaymentMethod,
    togglePaymentMethod,
    processPayment,
    getPaymentById,
    getOrderPayments,
    verifyPayment,
    generateQRCode,
    getPendingCashRequests,
    createCashRequest,
    approveCashPayment,
    rejectCashPayment,
    generateUPIQR,
    verifyUPIPayment,
    createRazorpayOrder,
    verifyRazorpayPayment
};
