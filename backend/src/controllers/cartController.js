const { supabase } = require('../config/supabase');
const TableTokenService = require('../services/TableTokenService');
const { formatResponse } = require('../utils/helpers');
const { catchAsync, NotFoundError, ValidationError, AuthorizationError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Add item to cart
 * POST /api/cart/add
 * Requirements: 3.1, 3.2
 */
const addToCart = catchAsync(async (req, res) => {
    const { table_token, product_id, variant_id, quantity = 1, notes } = req.body;

    if (!table_token) {
        throw new ValidationError('table_token is required');
    }

    if (!product_id) {
        throw new ValidationError('product_id is required');
    }

    // Validate table token
    const tokenValidation = await TableTokenService.validateToken(table_token);
    if (!tokenValidation.valid) {
        throw new AuthorizationError(`Invalid table token: ${tokenValidation.reason}`);
    }

    // Get product details
    const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, price, tax_percentage, is_available')
        .eq('id', product_id)
        .single();

    if (productError || !product) {
        throw new NotFoundError('Product');
    }

    if (!product.is_available) {
        throw new ValidationError('Product is not available');
    }

    let variantPrice = 0;
    let variantName = null;
    if (variant_id) {
        const { data: variant, error: variantError } = await supabase
            .from('product_variants')
            .select('id, name, extra_price')
            .eq('id', variant_id)
            .single();

        if (variantError || !variant) {
            throw new NotFoundError('Product variant');
        }

        variantPrice = variant.extra_price || 0;
        variantName = variant.name;
    }

    const unitPrice = parseFloat(product.price) + parseFloat(variantPrice);

    // Check if item already exists in cart
    const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('table_token', table_token)
        .eq('product_id', product_id)
        .eq('variant_id', variant_id || null)
        .single();

    let cartItem;
    if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        const { data, error } = await supabase
            .from('cart_items')
            .update({
                quantity: newQuantity,
                updated_at: new Date().toISOString()
            })
            .eq('id', existingItem.id)
            .select()
            .single();

        if (error) {
            throw new Error('Failed to update cart item');
        }
        cartItem = data;
    } else {
        // Create new cart item
        const { data, error } = await supabase
            .from('cart_items')
            .insert({
                table_token,
                product_id,
                variant_id: variant_id || null,
                quantity,
                unit_price: unitPrice,
                notes,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            throw new Error('Failed to add item to cart');
        }
        cartItem = data;
    }

    logger.info(`Item added to cart for token ${table_token}: ${product.name}`);

    res.status(200).json(formatResponse(true, 'Item added to cart', {
        cart_item_id: cartItem.id,
        quantity: cartItem.quantity,
        unit_price: unitPrice
    }));
});

/**
 * Get cart items by table token
 * GET /api/cart/:tableToken
 * Requirements: 3.1
 */
const getCart = catchAsync(async (req, res) => {
    const { tableToken } = req.params;

    if (!tableToken) {
        throw new ValidationError('tableToken is required');
    }

    // Validate table token
    const tokenValidation = await TableTokenService.validateToken(tableToken);
    if (!tokenValidation.valid) {
        throw new AuthorizationError(`Invalid table token: ${tokenValidation.reason}`);
    }

    // Get cart items with product details
    const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select(`
            id,
            product_id,
            variant_id,
            quantity,
            unit_price,
            notes,
            products (
                id,
                name,
                description,
                image_url,
                tax_percentage
            ),
            product_variants (
                id,
                name
            )
        `)
        .eq('table_token', tableToken)
        .order('created_at', { ascending: true });

    if (error) {
        throw new Error('Failed to retrieve cart items');
    }

    // Calculate line totals
    const items = (cartItems || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products?.name,
        product_description: item.products?.description,
        product_image: item.products?.image_url,
        variant_id: item.variant_id,
        variant_name: item.product_variants?.name,
        quantity: item.quantity,
        unit_price: parseFloat(item.unit_price),
        line_total: parseFloat(item.unit_price) * item.quantity,
        tax_percentage: item.products?.tax_percentage || 0,
        notes: item.notes
    }));

    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
    const taxAmount = items.reduce((sum, item) => {
        const itemTax = (item.line_total * item.tax_percentage) / 100;
        return sum + itemTax;
    }, 0);
    const total = subtotal + taxAmount;

    res.status(200).json(formatResponse(true, 'Cart retrieved successfully', {
        items,
        count: items.length,
        subtotal: subtotal.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total: total.toFixed(2)
    }));
});

/**
 * Remove item from cart
 * DELETE /api/cart/:tableToken/item/:itemId
 * Requirements: 3.2
 */
const removeCartItem = catchAsync(async (req, res) => {
    const { tableToken, itemId } = req.params;

    if (!tableToken || !itemId) {
        throw new ValidationError('tableToken and itemId are required');
    }

    // Validate table token
    const tokenValidation = await TableTokenService.validateToken(tableToken);
    if (!tokenValidation.valid) {
        throw new AuthorizationError(`Invalid table token: ${tokenValidation.reason}`);
    }

    // Verify item belongs to this cart
    const { data: item, error: fetchError } = await supabase
        .from('cart_items')
        .select('id')
        .eq('id', itemId)
        .eq('table_token', tableToken)
        .single();

    if (fetchError || !item) {
        throw new NotFoundError('Cart item');
    }

    // Delete the item
    const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

    if (deleteError) {
        throw new Error('Failed to remove cart item');
    }

    logger.info(`Item removed from cart for token ${tableToken}`);

    res.status(200).json(formatResponse(true, 'Item removed from cart'));
});

/**
 * Clear entire cart
 * DELETE /api/cart/:tableToken
 * Requirements: 3.2
 */
const clearCart = catchAsync(async (req, res) => {
    const { tableToken } = req.params;

    if (!tableToken) {
        throw new ValidationError('tableToken is required');
    }

    // Validate table token
    const tokenValidation = await TableTokenService.validateToken(tableToken);
    if (!tokenValidation.valid) {
        throw new AuthorizationError(`Invalid table token: ${tokenValidation.reason}`);
    }

    // Delete all items for this token
    const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('table_token', tableToken);

    if (error) {
        throw new Error('Failed to clear cart');
    }

    logger.info(`Cart cleared for token ${tableToken}`);

    res.status(200).json(formatResponse(true, 'Cart cleared successfully'));
});

module.exports = {
    addToCart,
    getCart,
    removeCartItem,
    clearCart
};
