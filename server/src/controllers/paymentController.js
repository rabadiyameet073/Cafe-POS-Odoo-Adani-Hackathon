const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Session = require('../models/Session');
const Table = require('../models/Table');
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
    generateQRCode
};
