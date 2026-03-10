const Category = require('../models/Category');
const { formatResponse } = require('../utils/helpers');
const { catchAsync, NotFoundError, ConflictError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const getAllCategories = catchAsync(async (req, res) => {
    const { include_counts } = req.query;

    let categories;
    if (include_counts === 'true') {
        categories = await Category.findAllWithProductCounts();
    } else {
        categories = await Category.findAll({ is_active: true });
    }

    res.status(200).json(formatResponse(true, 'Categories retrieved successfully', {
        categories,
        count: categories.length
    }));
});

const getCategoryById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
        throw new NotFoundError('Category');
    }

    res.status(200).json(formatResponse(true, 'Category retrieved successfully', {
        category
    }));
});

const createCategory = catchAsync(async (req, res) => {
    const { name, description, send_to_kitchen = true, display_order } = req.body;

    const existing = await Category.findByName(name);
    if (existing) {
        throw new ConflictError('A category with this name already exists');
    }

    const order = display_order !== undefined ? display_order : await Category.getNextDisplayOrder();

    const category = await Category.create({
        name,
        description,
        send_to_kitchen,
        display_order: order,
        is_active: true
    });

    logger.info(`Category created: ${name}`);

    res.status(201).json(formatResponse(true, 'Category created successfully', {
        category
    }));
});

const updateCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, description, send_to_kitchen, display_order, is_active } = req.body;

    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
        throw new NotFoundError('Category');
    }

    if (name && name !== existingCategory.name) {
        const duplicate = await Category.findByName(name);
        if (duplicate) {
            throw new ConflictError('A category with this name already exists');
        }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (send_to_kitchen !== undefined) updates.send_to_kitchen = send_to_kitchen;
    if (display_order !== undefined) updates.display_order = display_order;
    if (is_active !== undefined) updates.is_active = is_active;

    const category = await Category.update(id, updates);

    logger.info(`Category updated: ${category.name}`);

    res.status(200).json(formatResponse(true, 'Category updated successfully', {
        category
    }));
});

const deleteCategory = catchAsync(async (req, res) => {
    const { id } = req.params;

    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
        throw new NotFoundError('Category');
    }

    await Category.delete(id);

    logger.info(`Category deleted: ${existingCategory.name}`);

    res.status(200).json(formatResponse(true, 'Category deleted successfully'));
});

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
