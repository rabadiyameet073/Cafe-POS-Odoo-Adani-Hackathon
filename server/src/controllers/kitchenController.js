const KitchenOrder = require('../models/KitchenOrder');
const OrderItem = require('../models/OrderItem');
const Order = require('../models/Order');
const { formatResponse } = require('../utils/helpers');
const { catchAsync, NotFoundError, ValidationError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const getKitchenOrders = catchAsync(async (req, res) => {
    const { grouped } = req.query;

    let orders;
    if (grouped === 'true') {
        orders = await KitchenOrder.getGroupedByStage();
    } else {
        orders = await KitchenOrder.findActive();
    }

    res.status(200).json(formatResponse(true, 'Kitchen orders retrieved', {
        orders
    }));
});

const getKitchenOrderById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const order = await KitchenOrder.findById(id);

    if (!order) {
        throw new NotFoundError('Kitchen order');
    }

    res.status(200).json(formatResponse(true, 'Kitchen order retrieved', {
        order
    }));
});

const updateOrderStage = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { stage } = req.body;

    const validStages = ['to_cook', 'preparing', 'completed'];
    if (!validStages.includes(stage)) {
        throw new ValidationError(`Invalid stage. Must be one of: ${validStages.join(', ')}`);
    }

    const kitchenOrder = await KitchenOrder.findById(id);
    if (!kitchenOrder) {
        throw new NotFoundError('Kitchen order');
    }

    const updatedOrder = await KitchenOrder.updateStage(id, stage);

    if (kitchenOrder.order_id) {
        await Order.updateStatus(kitchenOrder.order_id, stage === 'completed' ? 'ready' : stage);
    }

    logger.info(`Kitchen order stage updated: ${kitchenOrder.ticket_number} -> ${stage}`);

    const io = req.app.get('io');
    if (io) {
        io.to('kitchen').emit('order_stage_updated', {
            id,
            order_id: kitchenOrder.order_id,
            stage
        });

        const order = await Order.findById(kitchenOrder.order_id);
        if (order?.customer_id) {
            io.to(`customer_${order.customer_id}`).emit('order_status_updated', {
                order_id: kitchenOrder.order_id,
                status: stage === 'completed' ? 'ready' : stage
            });
        }
    }

    res.status(200).json(formatResponse(true, 'Kitchen order stage updated', {
        order: updatedOrder
    }));
});

const markItemPrepared = catchAsync(async (req, res) => {
    const { id, itemId } = req.params;
    const { status = 'completed' } = req.body;

    const kitchenOrder = await KitchenOrder.findById(id);
    if (!kitchenOrder) {
        throw new NotFoundError('Kitchen order');
    }

    const updatedOrder = await KitchenOrder.updateItemStatus(id, itemId, status);

    await OrderItem.updateKitchenStatus(itemId, status);

    logger.info(`Kitchen item marked as ${status}: ${itemId}`);

    const io = req.app.get('io');
    if (io) {
        io.to('kitchen').emit('item_prepared', {
            kitchen_order_id: id,
            item_id: itemId,
            status
        });
    }

    res.status(200).json(formatResponse(true, 'Item marked as prepared', {
        order: updatedOrder
    }));
});

const deleteKitchenOrder = catchAsync(async (req, res) => {
    const { id } = req.params;

    const kitchenOrder = await KitchenOrder.findById(id);
    if (!kitchenOrder) {
        throw new NotFoundError('Kitchen order');
    }

    // Update the main order status to completed
    if (kitchenOrder.order_id) {
        await Order.updateStatus(kitchenOrder.order_id, 'completed');
    }

    // Delete the kitchen order (marks as picked up)
    await KitchenOrder.delete(id);

    logger.info(`Kitchen order picked up and removed: ${kitchenOrder.ticket_number}`);

    const io = req.app.get('io');
    if (io) {
        io.to('kitchen').emit('order_picked_up', {
            id,
            order_id: kitchenOrder.order_id
        });
    }

    res.status(200).json(formatResponse(true, 'Order picked up successfully'));
});

module.exports = {
    getKitchenOrders,
    getKitchenOrderById,
    updateOrderStage,
    markItemPrepared,
    deleteKitchenOrder
};
