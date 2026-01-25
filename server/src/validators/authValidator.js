/**
 * Authentication Validator
 * 
 * Input validation rules for authentication endpoints using express-validator.
 */

const { body } = require('express-validator');

/**
 * Validation rules for user signup
 */
const signupValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),

    body('full_name')
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Full name must be between 2 and 255 characters'),

    body('phone')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 10, max: 20 }).withMessage('Phone number must be between 10 and 20 characters'),

    body('role')
        .optional()
        .isIn(['customer', 'cashier', 'kitchen', 'admin']).withMessage('Invalid role')
];

/**
 * Validation rules for user login
 */
const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
];

/**
 * Validation rules for password change
 */
const changePasswordValidation = [
    body('current_password')
        .notEmpty().withMessage('Current password is required'),

    body('new_password')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
        .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .custom((value, { req }) => {
            if (value === req.body.current_password) {
                throw new Error('New password must be different from current password');
            }
            return true;
        }),

    body('confirm_password')
        .notEmpty().withMessage('Password confirmation is required')
        .custom((value, { req }) => {
            if (value !== req.body.new_password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
];

/**
 * Validation rules for profile update
 */
const updateProfileValidation = [
    body('full_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 }).withMessage('Full name must be between 2 and 255 characters'),

    body('phone')
        .optional({ nullable: true })
        .trim()
        .isLength({ min: 10, max: 20 }).withMessage('Phone number must be between 10 and 20 characters'),

    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
];

module.exports = {
    signupValidation,
    loginValidation,
    changePasswordValidation,
    updateProfileValidation
};
