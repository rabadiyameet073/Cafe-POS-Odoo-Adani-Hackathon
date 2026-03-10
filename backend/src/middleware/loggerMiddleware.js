const logger = require('../utils/logger');

function requestLogger(req, res, next) {
    const start = Date.now();

    logger.debug(`--> ${req.method} ${req.originalUrl}`);

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? 'warn' : 'debug';

        logger[logLevel](`<-- ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });

    next();
}

function bodyLogger(req, res, next) {
    if (process.env.NODE_ENV === 'development' && req.body && Object.keys(req.body).length > 0) {
        const sanitized = { ...req.body };
        if (sanitized.password) sanitized.password = '***';
        if (sanitized.password_hash) sanitized.password_hash = '***';
        if (sanitized.token) sanitized.token = '***';

        logger.debug('Request Body:', JSON.stringify(sanitized));
    }

    next();
}

module.exports = {
    requestLogger,
    bodyLogger
};
