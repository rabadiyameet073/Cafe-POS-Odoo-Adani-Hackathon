/**
 * Payment Validator
 * 
 * Input validation rules for payment endpoints.
 */

const { body } = require('express-validator');

/**
 * Validation rules for processing a payment
 */
const processPaymentValidation = [
    body('order_id')
        .notEmpty().withMessage('Order ID is required')
        .isUUID().withMessage('Invalid order ID format'),

    body('payment_method_id')
        .notEmpty().withMessage('Payment method ID is required')
        .isUUID().withMessage('Invalid payment method ID format'),

    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number')
];

/**
 * Validation rules for creating a payment method
 */
const createMethodValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 50 }).withMessage('Name must be less than 50 characters'),

    body('display_name')
        .trim()
        .notEmpty().withMessage('Display name is required')
        .isLength({ max: 100 }).withMessage('Display name must be less than 100 characters'),

    body('is_enabled')
        .optional()
        .isBoolean().withMessage('is_enabled must be a boolean'),

    body('upi_id')
        .optional()
        .trim()
];

/**
 * Validation rules for QR generation
 */
const generateQRValidation = [
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),

    body('order_number')
        .optional()
        .trim()
];

module.exports = {
    processPaymentValidation,
    createMethodValidation,
    generateQRValidation
};
