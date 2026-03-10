const Floor = require('../models/Floor');
const { formatResponse } = require('../utils/helpers');
const { catchAsync, NotFoundError, ConflictError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const getAllFloors = catchAsync(async (req, res) => {
    const { include_tables } = req.query;

    let floors;
    if (include_tables === 'true') {
        floors = await Floor.findAllWithTableCounts();
    } else {
        floors = await Floor.findAll({ is_active: true });
    }

    res.status(200).json(formatResponse(true, 'Floors retrieved successfully', {
        floors,
        count: floors.length
    }));
});

const getFloorById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const floor = await Floor.findById(id);

    if (!floor) {
        throw new NotFoundError('Floor');
    }

    res.status(200).json(formatResponse(true, 'Floor retrieved successfully', {
        floor
    }));
});

const createFloor = catchAsync(async (req, res) => {
    const { name, description, display_order } = req.body;

    const order = display_order !== undefined ? display_order : await Floor.getNextDisplayOrder();

    const floor = await Floor.create({
        name,
        description,
        display_order: order,
        is_active: true,
        created_by: req.user.id
    });

    logger.info(`Floor created: ${name} by ${req.user.email}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('floor_created', floor);
    }

    res.status(201).json(formatResponse(true, 'Floor created successfully', {
        floor
    }));
});

const updateFloor = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, description, display_order, is_active } = req.body;

    const existingFloor = await Floor.findById(id);
    if (!existingFloor) {
        throw new NotFoundError('Floor');
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (display_order !== undefined) updates.display_order = display_order;
    if (is_active !== undefined) updates.is_active = is_active;

    const floor = await Floor.update(id, updates);

    logger.info(`Floor updated: ${floor.name}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('floor_updated', floor);
    }

    res.status(200).json(formatResponse(true, 'Floor updated successfully', {
        floor
    }));
});

const deleteFloor = catchAsync(async (req, res) => {
    const { id } = req.params;

    const existingFloor = await Floor.findById(id);
    if (!existingFloor) {
        throw new NotFoundError('Floor');
    }

    if (existingFloor.tables_count > 0) {
        throw new ConflictError('Cannot delete floor with existing tables. Please remove tables first.');
    }

    await Floor.delete(id);

    logger.info(`Floor deleted: ${existingFloor.name}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('floor_deleted', { id });
    }

    res.status(200).json(formatResponse(true, 'Floor deleted successfully'));
});

module.exports = {
    getAllFloors,
    getFloorById,
    createFloor,
    updateFloor,
    deleteFloor
};
