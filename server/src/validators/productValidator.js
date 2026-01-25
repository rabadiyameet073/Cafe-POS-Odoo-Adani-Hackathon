/**
 * Product Validator
 * 
 * Input validation rules for product endpoints.
 */

const { body } = require('express-validator');

/**
 * Validation rules for creating a product
 */
const createProductValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Product name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),

    body('category_id')
        .notEmpty().withMessage('Category is required')
        .isUUID().withMessage('Invalid category ID format'),

    body('price')
        .notEmpty().withMessage('Price is required')
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

    body('unit')
        .optional()
        .isIn(['piece', 'kg', 'liter', 'plate']).withMessage('Invalid unit'),

    body('tax_percentage')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('Tax percentage must be between 0 and 100'),

    body('description')
        .optional()
        .trim(),

    body('image_url')
        .optional()
        .trim()
        .isURL().withMessage('Invalid image URL'),

    body('is_available')
        .optional()
        .isBoolean().withMessage('is_available must be a boolean')
];

/**
 * Validation rules for updating a product
 */
const updateProductValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),

    body('category_id')
        .optional()
        .isUUID().withMessage('Invalid category ID format'),

    body('price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

    body('unit')
        .optional()
        .isIn(['piece', 'kg', 'liter', 'plate']).withMessage('Invalid unit'),

    body('tax_percentage')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('Tax percentage must be between 0 and 100'),

    body('description')
        .optional()
        .trim(),

    body('image_url')
        .optional()
        .trim(),

    body('is_available')
        .optional()
        .isBoolean().withMessage('is_available must be a boolean'),

    body('is_active')
        .optional()
        .isBoolean().withMessage('is_active must be a boolean')
];

/**
 * Validation rules for creating a variant
 */
const createVariantValidation = [
    body('attribute_name')
        .trim()
        .notEmpty().withMessage('Attribute name is required')
        .isLength({ max: 100 }).withMessage('Attribute name must be less than 100 characters'),

    body('attribute_value')
        .trim()
        .notEmpty().withMessage('Attribute value is required')
        .isLength({ max: 100 }).withMessage('Attribute value must be less than 100 characters'),

    body('extra_price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Extra price must be a positive number')
];

/**
 * Validation rules for updating a variant
 */
const updateVariantValidation = [
    body('attribute_name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Attribute name must be less than 100 characters'),

    body('attribute_value')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Attribute value must be less than 100 characters'),

    body('extra_price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Extra price must be a positive number'),

    body('is_active')
        .optional()
        .isBoolean().withMessage('is_active must be a boolean')
];

module.exports = {
    createProductValidation,
    updateProductValidation,
    createVariantValidation,
    updateVariantValidation
};
