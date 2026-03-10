
const QRCode = require('qrcode');
const env = require('../config/env');
const logger = require('../utils/logger');

function generateUPIString(options) {
    const {
        upiId = env.UPI_ID,
        merchantName = env.MERCHANT_NAME,
        amount,
        transactionNote = 'Order Payment'
    } = options;

    const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&tn=${encodeURIComponent(transactionNote)}`;

    return upiString;
}

async function generateQRDataURL(data, options = {}) {
    const defaultOptions = {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        width: 256,
        ...options
    };

    try {
        const qrDataURL = await QRCode.toDataURL(data, defaultOptions);
        return qrDataURL;
    } catch (err) {
        logger.error('QR code generation failed:', err);
        throw err;
    }
}


async function generateQRBuffer(data, options = {}) {
    const defaultOptions = {
        errorCorrectionLevel: 'M',
        type: 'png',
        margin: 2,
        width: 256,
        ...options
    };

    try {
        const buffer = await QRCode.toBuffer(data, defaultOptions);
        return buffer;
    } catch (err) {
        logger.error('QR code buffer generation failed:', err);
        throw err;
    }
}

async function generatePaymentQR(paymentDetails) {
    const { amount, orderNumber } = paymentDetails;

    const upiString = generateUPIString({
        amount,
        transactionNote: `Order ${orderNumber}`
    });

    const qrCode = await generateQRDataURL(upiString);

    return {
        qrCode,
        upiString
    };
}

module.exports = {
    generateUPIString,
    generateQRDataURL,
    generateQRBuffer,
    generatePaymentQR
};
