const Table = require('../models/Table');
const { formatResponse } = require('../utils/helpers');
const { catchAsync, NotFoundError, ConflictError, ValidationError, AuthorizationError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const getAllTables = catchAsync(async (req, res) => {
    const { floor_id, status, is_active } = req.query;

    const filters = {};
    if (floor_id) filters.floor_id = floor_id;
    if (status) filters.status = status;
    if (is_active !== undefined) filters.is_active = is_active === 'true';

    const tables = await Table.findAll(filters);

    res.status(200).json(formatResponse(true, 'Tables retrieved successfully', {
        tables,
        count: tables.length
    }));
});

const getTablesByFloor = catchAsync(async (req, res) => {
    const { floorId } = req.params;

    const tables = await Table.findByFloorId(floorId);

    for (const table of tables) {
        const hasOrders = await Table.hasActiveOrders(table.id);
        if (hasOrders && table.status === 'available') {
            table.status = 'occupied';
        }
    }

    res.status(200).json(formatResponse(true, 'Tables retrieved successfully', {
        tables,
        count: tables.length
    }));
});

const getAvailableTables = catchAsync(async (req, res) => {
    const tables = await Table.findAvailable();

    res.status(200).json(formatResponse(true, 'Available tables retrieved successfully', {
        tables,
        count: tables.length
    }));
});

const getTableById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const table = await Table.findById(id);

    if (!table) {
        throw new NotFoundError('Table');
    }

    res.status(200).json(formatResponse(true, 'Table retrieved successfully', {
        table
    }));
});

const createTable = catchAsync(async (req, res) => {
    const { floor_id, table_number, seats, status = 'available' } = req.body;

    const table = await Table.create({
        floor_id,
        table_number,
        seats,
        status,
        is_active: true
    });

    logger.info(`Table created: ${table_number} on floor ${floor_id}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('table_created', table);
    }

    res.status(201).json(formatResponse(true, 'Table created successfully', {
        table
    }));
});

const updateTable = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { floor_id, table_number, seats, is_active } = req.body;

    const existingTable = await Table.findById(id);
    if (!existingTable) {
        throw new NotFoundError('Table');
    }

    const updates = {};
    if (floor_id !== undefined) updates.floor_id = floor_id;
    if (table_number !== undefined) updates.table_number = table_number;
    if (seats !== undefined) updates.seats = seats;
    if (is_active !== undefined) updates.is_active = is_active;

    const table = await Table.update(id, updates);

    logger.info(`Table updated: ${table.table_number}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('table_updated', table);
    }

    res.status(200).json(formatResponse(true, 'Table updated successfully', {
        table
    }));
});

const updateTableStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['available', 'occupied', 'reserved'];
    if (!validStatuses.includes(status)) {
        throw new ConflictError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const existingTable = await Table.findById(id);
    if (!existingTable) {
        throw new NotFoundError('Table');
    }

    const table = await Table.updateStatus(id, status);

    logger.info(`Table status updated: ${table.table_number} -> ${status}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('table_status_changed', { table_id: id, status });
    }

    res.status(200).json(formatResponse(true, 'Table status updated successfully', {
        table
    }));
});

const selectTable = catchAsync(async (req, res) => {
    const { table_id, customer_name } = req.body;

    if (!table_id) {
        throw new ValidationError('table_id is required');
    }

    // Get IP address for rate limiting
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    const TableService = require('../services/TableService');
    const result = await TableService.selectTable(
        table_id,
        req.user?.id,
        customer_name,
        ipAddress
    );

    if (!result.success) {
        if (result.retryAfter) {
            // Rate limit exceeded
            res.set('Retry-After', result.retryAfter);
            return res.status(429).json(formatResponse(false, result.error, {
                retry_after: result.retryAfter
            }));
        }
        throw new ConflictError(result.error);
    }

    logger.info(`Table selected: ${result.tableNumber} by ${req.user?.email || 'guest'}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('table_status_changed', {
            table_id: result.tableId,
            status: 'occupied'
        });
    }

    res.status(200).json(formatResponse(true, 'Table selected successfully', {
        table_token: result.tableToken,
        session_id: result.sessionId,
        table_number: result.tableNumber,
        table_id: result.tableId,
        floor_id: result.floorId,
        floor_name: result.floorName,
        rate_limit_remaining: result.rateLimitRemaining
    }));
});

const releaseTable = catchAsync(async (req, res) => {
    const { table_id, reason } = req.body;

    if (!table_id) {
        throw new ValidationError('table_id is required');
    }

    if (!req.user || !['admin', 'cashier'].includes(req.user.role)) {
        throw new AuthorizationError('Only admin or cashier can manually release tables');
    }

    const TableService = require('../services/TableService');
    const result = await TableService.releaseTable(
        table_id,
        reason || 'force_freed',
        req.user.id
    );

    if (!result.success) {
        throw new ConflictError(result.error);
    }

    logger.info(`Table released by ${req.user.email}. Reason: ${reason || 'force_freed'}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('table_status_changed', {
            table_id: result.tableId,
            status: 'available'
        });
    }

    res.status(200).json(formatResponse(true, 'Table released successfully', {
        table_id: result.tableId,
        session_id: result.sessionId
    }));
});

const deleteTable = catchAsync(async (req, res) => {
    const { id } = req.params;

    const existingTable = await Table.findById(id);
    if (!existingTable) {
        throw new NotFoundError('Table');
    }

    const hasOrders = await Table.hasActiveOrders(id);
    if (hasOrders) {
        throw new ConflictError('Cannot delete table with active orders');
    }

    await Table.delete(id);

    logger.info(`Table deleted: ${existingTable.table_number}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('table_deleted', { id });
    }

    res.status(200).json(formatResponse(true, 'Table deleted successfully'));
});

module.exports = {
    getAllTables,
    getTablesByFloor,
    getAvailableTables,
    getTableById,
    createTable,
    updateTable,
    updateTableStatus,
    selectTable,
    releaseTable,
    deleteTable
};
