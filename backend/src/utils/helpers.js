/**
 * Helper Utilities
 * 
 * Common utility functions used throughout the application.
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique order number
 * Format: ORD-YYYYMMDD-XXXXX (random 5 chars)
 * 
 * @returns {string} Order number
 */
function generateOrderNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `ORD-${dateStr}-${random}`;
}

/**
 * Generate a unique session number
 * Format: SES-YYYYMMDD-XXXXX (random 5 chars)
 * 
 * @returns {string} Session number
 */
function generateSessionNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `SES-${dateStr}-${random}`;
}

/**
 * Generate a unique ticket number for kitchen
 * Format: TKT-XXXXX (random 5 chars)
 * 
 * @returns {string} Ticket number
 */
function generateTicketNumber() {
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `TKT-${random}`;
}

/**
 * Generate a QR code token for self-ordering
 * 
 * @returns {string} Token string
 */
function generateQRToken() {
    return uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();
}

/**
 * Format a standard API response
 * 
 * @param {boolean} success - Whether the operation was successful
 * @param {string} message - Response message
 * @param {any} data - Response data (optional)
 * @returns {object} Formatted response object
 */
function formatResponse(success, message, data = null) {
    const response = {
        success,
        message
    };

    if (data !== null) {
        response.data = data;
    }

    return response;
}

/**
 * Format pagination metadata
 * 
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {object} Pagination metadata
 */
function formatPagination(page, limit, total) {
    return {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
    };
}

/**
 * Calculate order totals
 * 
 * @param {Array} items - Array of order items
 * @returns {object} Calculated totals { subtotal, taxAmount, total }
 */
function calculateOrderTotals(items) {
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach(item => {
        const itemSubtotal = (parseFloat(item.unit_price) + parseFloat(item.variant_price || 0)) * item.quantity;
        const itemTax = itemSubtotal * (parseFloat(item.tax_percentage) / 100);

        subtotal += itemSubtotal;
        taxAmount += itemTax;
    });

    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        total: parseFloat((subtotal + taxAmount).toFixed(2))
    };
}

/**
 * Parse date range from filter values
 * 
 * @param {string} period - Period type (today, week, month, custom)
 * @param {string} startDate - Custom start date
 * @param {string} endDate - Custom end date
 * @returns {object} { start, end } date objects
 */
function parseDateRange(period, startDate = null, endDate = null) {
    const now = new Date();
    let start, end;

    switch (period) {
        case 'today':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
        case 'week':
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            end = now;
            break;
        case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = now;
            break;
        case 'custom':
            start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            end = endDate ? new Date(endDate) : now;
            break;
        default:
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            end = now;
    }

    return { start, end };
}

/**
 * Sanitize object by removing undefined and null values
 * 
 * @param {object} obj - Object to sanitize
 * @returns {object} Sanitized object
 */
function sanitizeObject(obj) {
    const sanitized = {};

    Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined && obj[key] !== null) {
            sanitized[key] = obj[key];
        }
    });

    return sanitized;
}

/**
 * Sleep utility for async operations
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    generateOrderNumber,
    generateSessionNumber,
    generateTicketNumber,
    generateQRToken,
    formatResponse,
    formatPagination,
    calculateOrderTotals,
    parseDateRange,
    sanitizeObject,
    sleep
};
