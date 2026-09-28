const Product = require('../models/Product');
const { formatResponse } = require('../utils/helpers');
const { catchAsync, NotFoundError, ValidationError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

function sanitizeProduct(p) {
    if (!p) return p;
    const item = typeof p.toObject === 'function' ? p.toObject() : { ...p };
    const name = (item.name || '').toLowerCase();
    const img = item.image_url || '';
    if (img.includes('photo-1573140247632') || name.includes('garlic bread')) {
        item.image_url = 'https://images.unsplash.com/photo-1556008531-57e6eefc7be4?w=500&auto=format&fit=crop&q=80';
    } else if (img.includes('photo-1513558161293') || name.includes('lemon soda') || name.includes('lime soda') || name === 'lemon soda') {
        item.image_url = 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=500&auto=format&fit=crop&q=80';
    }
    return item;
}

const getAllProducts = catchAsync(async (req, res) => {
    const { category_id, is_available, include_variants } = req.query;

    const filters = { is_active: true };
    if (category_id) filters.category_id = category_id;
    if (is_available !== undefined) filters.is_available = is_available === 'true';

    let products;
    if (include_variants === 'true') {
        products = await Product.findAllWithVariants(filters);
    } else {
        products = await Product.findAll(filters);
    }

    products = (products || []).map(sanitizeProduct);

    res.status(200).json(formatResponse(true, 'Products retrieved successfully', {
        products,
        count: products.length
    }));
});

const getProductsByCategory = catchAsync(async (req, res) => {
    const { categoryId } = req.params;

    let products = await Product.findByCategory(categoryId);
    products = (products || []).map(sanitizeProduct);

    res.status(200).json(formatResponse(true, 'Products retrieved successfully', {
        products,
        count: products.length
    }));
});

const getProductById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
        throw new NotFoundError('Product');
    }

    res.status(200).json(formatResponse(true, 'Product retrieved successfully', {
        product: sanitizeProduct(product)
    }));
});

const createProduct = catchAsync(async (req, res) => {
    const {
        name,
        category_id,
        price,
        unit = 'piece',
        tax_percentage = 0,
        description,
        image_url,
        is_available = true
    } = req.body;

    if (!name || !category_id || price === undefined) {
        throw new ValidationError('Name, category_id, and price are required');
    }

    const product = await Product.create({
        name,
        category_id,
        price: parseFloat(price),
        unit,
        tax_percentage: parseFloat(tax_percentage),
        description,
        image_url,
        is_available,
        is_active: true
    });

    logger.info(`Product created: ${name}`);

    res.status(201).json(formatResponse(true, 'Product created successfully', {
        product
    }));
});

const updateProduct = catchAsync(async (req, res) => {
    const { id } = req.params;
    const {
        name,
        category_id,
        price,
        unit,
        tax_percentage,
        description,
        image_url,
        is_available,
        is_active
    } = req.body;

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
        throw new NotFoundError('Product');
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (category_id !== undefined) updates.category_id = category_id;
    if (price !== undefined) updates.price = parseFloat(price);
    if (unit !== undefined) updates.unit = unit;
    if (tax_percentage !== undefined) updates.tax_percentage = parseFloat(tax_percentage);
    if (description !== undefined) updates.description = description;
    if (image_url !== undefined) updates.image_url = image_url;
    if (is_available !== undefined) updates.is_available = is_available;
    if (is_active !== undefined) updates.is_active = is_active;

    const product = await Product.update(id, updates);

    logger.info(`Product updated: ${product.name}`);

    res.status(200).json(formatResponse(true, 'Product updated successfully', {
        product
    }));
});

const deleteProduct = catchAsync(async (req, res) => {
    const { id } = req.params;

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
        throw new NotFoundError('Product');
    }

    await Product.delete(id);

    logger.info(`Product deleted: ${existingProduct.name}`);

    res.status(200).json(formatResponse(true, 'Product deleted successfully'));
});

const toggleAvailability = catchAsync(async (req, res) => {
    const { id } = req.params;

    const product = await Product.toggleAvailability(id);

    if (!product) {
        throw new NotFoundError('Product');
    }

    logger.info(`Product availability toggled: ${product.name} -> ${product.is_available}`);

    res.status(200).json(formatResponse(true, 'Product availability updated', {
        product
    }));
});

const getProductVariants = catchAsync(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
        throw new NotFoundError('Product');
    }

    const variants = await Product.getVariants(id);

    res.status(200).json(formatResponse(true, 'Variants retrieved successfully', {
        variants,
        count: variants.length
    }));
});

const createVariant = catchAsync(async (req, res) => {
    const { id: product_id } = req.params;
    const { attribute_name, attribute_value, extra_price = 0 } = req.body;

    const product = await Product.findById(product_id);
    if (!product) {
        throw new NotFoundError('Product');
    }

    if (!attribute_name || !attribute_value) {
        throw new ValidationError('attribute_name and attribute_value are required');
    }

    const variant = await Product.createVariant({
        product_id,
        attribute_name,
        attribute_value,
        extra_price: parseFloat(extra_price),
        is_active: true
    });

    logger.info(`Variant created for product ${product.name}: ${attribute_name} = ${attribute_value}`);

    res.status(201).json(formatResponse(true, 'Variant created successfully', {
        variant
    }));
});

const updateVariant = catchAsync(async (req, res) => {
    const { variantId } = req.params;
    const { attribute_name, attribute_value, extra_price, is_active } = req.body;

    const existingVariant = await Product.getVariantById(variantId);
    if (!existingVariant) {
        throw new NotFoundError('Variant');
    }

    const updates = {};
    if (attribute_name !== undefined) updates.attribute_name = attribute_name;
    if (attribute_value !== undefined) updates.attribute_value = attribute_value;
    if (extra_price !== undefined) updates.extra_price = parseFloat(extra_price);
    if (is_active !== undefined) updates.is_active = is_active;

    const variant = await Product.updateVariant(variantId, updates);

    logger.info(`Variant updated: ${variant.attribute_name} = ${variant.attribute_value}`);

    res.status(200).json(formatResponse(true, 'Variant updated successfully', {
        variant
    }));
});

const deleteVariant = catchAsync(async (req, res) => {
    const { variantId } = req.params;

    const existingVariant = await Product.getVariantById(variantId);
    if (!existingVariant) {
        throw new NotFoundError('Variant');
    }

    await Product.deleteVariant(variantId);

    logger.info(`Variant deleted: ${existingVariant.attribute_name}`);

    res.status(200).json(formatResponse(true, 'Variant deleted successfully'));
});

module.exports = {
    getAllProducts,
    getProductsByCategory,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleAvailability,
    getProductVariants,
    createVariant,
    updateVariant,
    deleteVariant
};
