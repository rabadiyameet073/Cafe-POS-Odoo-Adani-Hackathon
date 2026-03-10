const Session = require('../models/Session');
const { formatResponse } = require('../utils/helpers');
const { catchAsync, NotFoundError, ConflictError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const getAllSessions = catchAsync(async (req, res) => {
    const { status, limit } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (limit) filters.limit = parseInt(limit);

    const sessions = await Session.findAll(filters);

    res.status(200).json(formatResponse(true, 'Sessions retrieved successfully', {
        sessions,
        count: sessions.length
    }));
});

const getActiveSession = catchAsync(async (req, res) => {
    let session;

    if (['admin', 'cashier'].includes(req.user.role)) {
        session = await Session.findActiveForUser(req.user.id);
        if (!session) {
            session = await Session.findAnyActive();
        }
    } else {
        session = await Session.findAnyActive();
    }

    if (!session) {
        return res.status(200).json(formatResponse(true, 'No active session', {
            session: null
        }));
    }

    res.status(200).json(formatResponse(true, 'Active session retrieved', {
        session
    }));
});

const getSessionById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const session = await Session.findById(id);

    if (!session) {
        throw new NotFoundError('Session');
    }

    const stats = await Session.getStats(id);

    res.status(200).json(formatResponse(true, 'Session retrieved successfully', {
        session,
        stats
    }));
});

const openSession = catchAsync(async (req, res) => {
    const { opening_balance = 0, notes } = req.body;

    const existingSession = await Session.findActiveForUser(req.user.id);
    if (existingSession) {
        throw new ConflictError('You already have an open session. Please close it first.');
    }

    const session = await Session.open({
        user_id: req.user.id,
        opening_balance: parseFloat(opening_balance),
        notes
    });

    logger.info(`Session opened: ${session.session_number} by ${req.user.email}`);

    res.status(201).json(formatResponse(true, 'Session opened successfully', {
        session
    }));
});

const closeSession = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { closing_balance, notes } = req.body;

    const session = await Session.findById(id);

    if (!session) {
        throw new NotFoundError('Session');
    }

    if (session.status === 'closed') {
        throw new ConflictError('Session is already closed');
    }

    if (session.user_id !== req.user.id && req.user.role !== 'admin') {
        throw new ConflictError('You can only close your own sessions');
    }

    const closedSession = await Session.close(id, {
        closing_balance: closing_balance ? parseFloat(closing_balance) : null,
        notes
    });

    const stats = await Session.getStats(id);

    logger.info(`Session closed: ${session.session_number}`);

    res.status(200).json(formatResponse(true, 'Session closed successfully', {
        session: closedSession,
        stats
    }));
});

module.exports = {
    getAllSessions,
    getActiveSession,
    getSessionById,
    openSession,
    closeSession
};
