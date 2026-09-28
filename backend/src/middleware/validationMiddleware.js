const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errorHandler');

function validate(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg
        }));

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errorMessages
        });
    }

    next();
}

function isValidUUID(value) {
    if (!value || typeof value !== 'string') return false;
    const str = value.trim();
    // Allow standard UUID, MongoDB ObjectId (24 hex), or custom slug/code IDs (e.g., tbl-g1, fl-ground, ORD-1001, c1, p1)
    return /^[a-zA-Z0-9_\-:]{1,64}$/.test(str);
}

function validateUUIDParam(paramName) {
    return (req, res, next) => {
        const value = req.params[paramName];

        if (!value) {
            return res.status(400).json({
                success: false,
                message: `${paramName} is required`
            });
        }

        if (!isValidUUID(value)) {
            return res.status(400).json({
                success: false,
                message: `Invalid ${paramName} format`
            });
        }

        next();
    };
}

module.exports = {
    validate,
    isValidUUID,
    validateUUIDParam
};
