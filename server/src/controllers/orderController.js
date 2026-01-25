const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const Table = require('../models/Table');
const { formatResponse, calculateOrderTotals } = require('../utils/helpers');
const { catchAsync, NotFoundError, ValidationError, ConflictError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const getAllOrders = catchAsync(async (req, res) => {
    const { session_id, status, table_id, start_date, end_date, limit } = req.query;

    const filters = {};
    if (session_id) filters.session_id = session_id;
    if (status) filters.status = status;
    if (table_id) filters.table_id = table_id;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (limit) filters.limit = parseInt(limit);

    const orders = await Order.findAll(filters);

    res.status(200).json(formatResponse(true, 'Orders retrieved successfully', {
        orders,
        count: orders.length
    }));
});

const getCustomerOrders = catchAsync(async (req, res) => {
    const { customerId } = req.params;

    if (req.user.role === 'customer' && req.user.id !== customerId) {
        throw new ConflictError('You can only view your own orders');
    }

    const orders = await Order.findByCustomer(customerId);

    res.status(200).json(formatResponse(true, 'Customer orders retrieved successfully', {
        orders,
        count: orders.length
    }));
});

const getSessionOrders = catchAsync(async (req, res) => {
    const { sessionId } = req.params;

    const orders = await Order.findBySession(sessionId);

    res.status(200).json(formatResponse(true, 'Session orders retrieved successfully', {
        orders,
        count: orders.length
    }));
});

const getOrderById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
        throw new NotFoundError('Order');
    }

    res.status(200).json(formatResponse(true, 'Order retrieved successfully', {
        order
    }));
});

const createOrder = catchAsync(async (req, res) => {
    const {
        table_id,
        session_id,
        order_type = 'dine_in',
        special_instructions,
        items = []
    } = req.body;

    let customer_id = null;
    let cashier_id = null;

    if (req.user.role === 'customer') {
        customer_id = req.user.id;
    } else if (['cashier', 'admin'].includes(req.user.role)) {
        cashier_id = req.user.id;
        customer_id = req.body.customer_id || null;
    }

    const order = await Order.create({
        table_id,
        session_id,
        customer_id,
        cashier_id,
        order_type,
        special_instructions,
        status: 'draft',
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0
    });

    if (items.length > 0) {
        for (const item of items) {
            const product = await Product.findById(item.product_id);
            if (product) {
                let variantPrice = 0;
                if (item.variant_id) {
                    const variant = await Product.getVariantById(item.variant_id);
                    if (variant) {
                        variantPrice = variant.extra_price;
                    }
                }

                await OrderItem.create({
                    order_id: order.id,
                    product_id: item.product_id,
                    variant_id: item.variant_id || null,
                    quantity: item.quantity || 1,
                    unit_price: product.price,
                    variant_price: variantPrice,
                    tax_percentage: product.tax_percentage,
                    notes: item.notes
                });
            }
        }

        await Order.updateTotals(order.id);
    }

    if (table_id) {
        await Table.updateStatus(table_id, 'occupied');

        const io = req.app.get('io');
        if (io) {
            io.emit('table_status_changed', { table_id, status: 'occupied' });
        }
    }

    const completeOrder = await Order.findById(order.id);

    logger.info(`Order created: ${order.order_number}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('new_order_created', completeOrder);
    }

    res.status(201).json(formatResponse(true, 'Order created successfully', {
        order: completeOrder
    }));
});

const updateOrder = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { special_instructions, discount_amount } = req.body;

    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
        throw new NotFoundError('Order');
    }

    if (['completed', 'cancelled'].includes(existingOrder.status)) {
        throw new ConflictError('Cannot update completed or cancelled orders');
    }

    const updates = {};
    if (special_instructions !== undefined) updates.special_instructions = special_instructions;
    if (discount_amount !== undefined) {
        updates.discount_amount = parseFloat(discount_amount);
        updates.total_amount = existingOrder.subtotal + existingOrder.tax_amount - parseFloat(discount_amount);
    }

    const order = await Order.update(id, updates);

    logger.info(`Order updated: ${order.order_number}`);

    res.status(200).json(formatResponse(true, 'Order updated successfully', {
        order
    }));
});

const addOrderItem = catchAsync(async (req, res) => {
    const { id: order_id } = req.params;
    const { product_id, variant_id, quantity = 1, notes } = req.body;

    const order = await Order.findById(order_id);
    if (!order) {
        throw new NotFoundError('Order');
    }

    if (['completed', 'cancelled'].includes(order.status)) {
        throw new ConflictError('Cannot add items to completed or cancelled orders');
    }

    const product = await Product.findById(product_id);
    if (!product) {
        throw new NotFoundError('Product');
    }

    let variantPrice = 0;
    if (variant_id) {
        const variant = await Product.getVariantById(variant_id);
        if (variant) {
            variantPrice = variant.extra_price;
        }
    }

    const item = await OrderItem.create({
        order_id,
        product_id,
        variant_id: variant_id || null,
        quantity,
        unit_price: product.price,
        variant_price: variantPrice,
        tax_percentage: product.tax_percentage,
        notes,
        kitchen_status: 'pending'
    });

    await Order.updateTotals(order_id);

    logger.info(`Item added to order ${order.order_number}: ${product.name}`);

    res.status(201).json(formatResponse(true, 'Item added successfully', {
        item
    }));
});

const removeOrderItem = catchAsync(async (req, res) => {
    const { id: order_id, itemId } = req.params;

    const order = await Order.findById(order_id);
    if (!order) {
        throw new NotFoundError('Order');
    }

    if (['completed', 'cancelled'].includes(order.status)) {
        throw new ConflictError('Cannot remove items from completed or cancelled orders');
    }

    const item = await OrderItem.findById(itemId);
    if (!item || item.order_id !== order_id) {
        throw new NotFoundError('Order item');
    }

    await OrderItem.delete(itemId);

    await Order.updateTotals(order_id);

    logger.info(`Item removed from order ${order.order_number}`);

    res.status(200).json(formatResponse(true, 'Item removed successfully'));
});

const sendToKitchen = catchAsync(async (req, res) => {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
        throw new NotFoundError('Order');
    }

    if (order.status === 'sent_to_kitchen') {
        throw new ConflictError('Order already sent to kitchen');
    }

    if (['completed', 'cancelled'].includes(order.status)) {
        throw new ConflictError('Cannot send completed or cancelled orders to kitchen');
    }

    const updatedOrder = await Order.updateStatus(id, 'sent_to_kitchen');

    logger.info(`Order sent to kitchen: ${order.order_number}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('order_sent_to_kitchen', {
            order_id: id,
            order_number: order.order_number,
            table_number: order.tables?.table_number,
            items: order.items
        });

        io.to('kitchen').emit('new_kitchen_order', {
            order_id: id,
            order_number: order.order_number,
            table_number: order.tables?.table_number,
            items: order.items
        });
    }

    res.status(200).json(formatResponse(true, 'Order sent to kitchen', {
        order: updatedOrder
    }));
});

const updateOrderStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'confirmed', 'sent_to_kitchen', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const order = await Order.findById(id);
    if (!order) {
        throw new NotFoundError('Order');
    }

    const updatedOrder = await Order.updateStatus(id, status);

    logger.info(`Order status updated: ${order.order_number} -> ${status}`);

    if (status === 'completed' && order.table_id) {
        await Table.updateStatus(order.table_id, 'available');
    }

    const io = req.app.get('io');
    if (io) {
        io.emit('order_status_changed', { order_id: id, status });

        if (order.customer_id) {
            io.to(`customer_${order.customer_id}`).emit('order_status_updated', {
                order_id: id,
                order_number: order.order_number,
                status
            });
        }
    }

    res.status(200).json(formatResponse(true, 'Order status updated', {
        order: updatedOrder
    }));
});

const cancelOrder = catchAsync(async (req, res) => {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
        throw new NotFoundError('Order');
    }

    if (['completed', 'cancelled'].includes(order.status)) {
        throw new ConflictError('Order is already completed or cancelled');
    }

    await Order.cancel(id);

    if (order.table_id) {
        await Table.updateStatus(order.table_id, 'available');
    }

    logger.info(`Order cancelled: ${order.order_number}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('order_cancelled', { order_id: id, order_number: order.order_number });
    }

    res.status(200).json(formatResponse(true, 'Order cancelled successfully'));
});

module.exports = {
    getAllOrders,
    getCustomerOrders,
    getSessionOrders,
    getOrderById,
    createOrder,
    updateOrder,
    addOrderItem,
    removeOrderItem,
    sendToKitchen,
    updateOrderStatus,
    cancelOrder
};
