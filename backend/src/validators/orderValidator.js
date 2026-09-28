/**
 * Order Validator
 * 
 * Input validation rules for order endpoints.
 */

const { body } = require('express-validator');

const isValidId = val => !val || /^[a-zA-Z0-9_\-:]{1,64}$/.test(String(val).trim());

/**
 * Validation rules for creating an order
 */
const createOrderValidation = [
    body('table_id')
        .optional({ nullable: true, checkFalsy: true })
        .custom(isValidId).withMessage('Invalid table ID format'),

    body('session_id')
        .optional()
        .custom(isValidId).withMessage('Invalid session ID format'),

    body('order_type')
        .optional()
        .isIn(['dine_in', 'takeaway', 'self_order']).withMessage('Invalid order type'),

    body('special_instructions')
        .optional()
        .trim(),

    body('items')
        .optional()
        .isArray().withMessage('Items must be an array'),

    body('items.*.product_id')
        .optional()
        .custom(isValidId).withMessage('Invalid product ID'),

    body('items.*.variant_id')
        .optional({ nullable: true, checkFalsy: true })
        .custom(isValidId).withMessage('Invalid variant ID'),

    body('items.*.quantity')
        .optional()
        .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

/**
 * Validation rules for adding an order item
 */
const addItemValidation = [
    body('product_id')
        .notEmpty().withMessage('Product ID is required')
        .custom(isValidId).withMessage('Invalid product ID format'),

    body('variant_id')
        .optional()
        .custom(isValidId).withMessage('Invalid variant ID format'),

    body('quantity')
        .optional()
        .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),

    body('notes')
        .optional()
        .trim()
];

/**
 * Validation rules for updating order status
 */
const updateStatusValidation = [
    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['draft', 'confirmed', 'sent_to_kitchen', 'preparing', 'ready', 'completed', 'cancelled'])
        .withMessage('Invalid order status')
];

module.exports = {
    createOrderValidation,
    addItemValidation,
    updateStatusValidation
};
