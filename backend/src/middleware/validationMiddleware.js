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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
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
