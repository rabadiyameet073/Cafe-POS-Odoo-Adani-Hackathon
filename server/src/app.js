const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');

const app = express();

app.use(helmet());

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.http(message.trim())
        }
    }));
}

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        data: {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: env.NODE_ENV
        }
    });
});

app.use('/api', routes);

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;
