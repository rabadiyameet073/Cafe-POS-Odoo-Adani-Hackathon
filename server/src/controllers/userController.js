const User = require('../models/User');
const { formatResponse } = require('../utils/helpers');
const { catchAsync, NotFoundError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const getAllUsers = catchAsync(async (req, res) => {
    const { role, is_active } = req.query;

    const filters = {};
    if (role) filters.role = role;
    if (is_active !== undefined) filters.is_active = is_active === 'true';

    const users = await User.findAll(filters);

    res.status(200).json(formatResponse(true, 'Users retrieved successfully', {
        users,
        count: users.length
    }));
});

const getUserById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
        throw new NotFoundError('User');
    }

    res.status(200).json(formatResponse(true, 'User retrieved successfully', {
        user
    }));
});

const updateUser = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { full_name, phone, role, is_active } = req.body;

    const existingUser = await User.findById(id);
    if (!existingUser) {
        throw new NotFoundError('User');
    }

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (role !== undefined) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;

    const user = await User.update(id, updates);

    logger.info(`User updated: ${user.email}`);

    res.status(200).json(formatResponse(true, 'User updated successfully', {
        user
    }));
});

const deactivateUser = catchAsync(async (req, res) => {
    const { id } = req.params;

    const existingUser = await User.findById(id);
    if (!existingUser) {
        throw new NotFoundError('User');
    }

    await User.deactivate(id);

    logger.info(`User deactivated: ${existingUser.email}`);

    res.status(200).json(formatResponse(true, 'User deactivated successfully'));
});

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deactivateUser
};
