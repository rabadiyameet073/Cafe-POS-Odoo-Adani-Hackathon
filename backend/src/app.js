const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const { requestLogger, paymentLogger } = require('./middleware/requestLogger');
const MonitoringService = require('./services/MonitoringService');
const logger = require('./utils/logger');

const app = express();

// Helmet with relaxed CSP for Vercel
app.use(helmet({
    contentSecurityPolicy: false, // Disable for Vercel compatibility
    crossOriginEmbedderPolicy: false
}));

// CORS - Allow all origins in production (Vercel same-origin)
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);
app.use(paymentLogger);

// Track requests in monitoring service
app.use((req, res, next) => {
    const originalSend = res.send.bind(res);
    res.send = function (data) {
        MonitoringService.recordRequest(res.statusCode < 400);
        return originalSend(data);
    };
    next();
});

// Logging
if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.http(message.trim())
        }
    }));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        data: {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: env.NODE_ENV,
            platform: 'Vercel Serverless'
        }
    });
});

// Supabase connectivity diagnostic endpoint
app.get('/api/db-status', async (req, res) => {
    const { testConnection, getConnectionStatus } = require('./config/supabase');
    const supabaseUrl = env.SUPABASE_URL || 'not set';
    const hasAnonKey = !!(env.SUPABASE_ANON_KEY && env.SUPABASE_ANON_KEY.length > 20);
    const hasServiceKey = !!(env.SUPABASE_SERVICE_KEY && env.SUPABASE_SERVICE_KEY.length > 20);

    const connected = await testConnection();

    res.status(connected ? 200 : 503).json({
        supabase_url: supabaseUrl,
        has_anon_key: hasAnonKey,
        has_service_key: hasServiceKey,
        connected,
        hint: connected ? '✅ Supabase is reachable' : '❌ Cannot reach Supabase – go to https://supabase.com/dashboard and make sure the project is ACTIVE (not paused)'
    });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app;
