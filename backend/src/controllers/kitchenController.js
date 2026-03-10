const KitchenOrder = require('../models/KitchenOrder');
const OrderItem = require('../models/OrderItem');
const Order = require('../models/Order');
const KitchenService = require('../services/KitchenService');
const NotificationService = require('../services/NotificationService');
const { formatResponse } = require('../utils/helpers');
const { catchAsync, NotFoundError, ValidationError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const getKitchenOrders = catchAsync(async (req, res) => {
    const { status } = req.query;

    const result = await KitchenService.getKitchenOrders(status);

    if (!result.success) {
        throw new Error(result.error);
    }

    res.status(200).json(formatResponse(true, 'Kitchen orders retrieved', {
        orders: result.orders,
        count: result.count
    }));
});

const getKitchenOrderById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await KitchenService.getKitchenOrderById(id);

    if (!result.success) {
        throw new NotFoundError('Kitchen order');
    }

    res.status(200).json(formatResponse(true, 'Kitchen order retrieved', {
        order: result.order
    }));
});

const updateOrderStage = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { stage } = req.body;

    const validStages = ['received', 'preparing', 'ready', 'served'];
    if (!validStages.includes(stage)) {
        throw new ValidationError(`Invalid stage. Must be one of: ${validStages.join(', ')}`);
    }

    const result = await KitchenService.updateKitchenStatus(
        id,
        stage,
        req.user?.id
    );

    if (!result.success) {
        throw new Error(result.error);
    }

    // Notify customer of status change
    const kitchenOrder = await KitchenService.getKitchenOrderById(id);
    if (kitchenOrder.success && kitchenOrder.order.order_id) {
        await NotificationService.notifyCustomer(
            kitchenOrder.order.order_id,
            `order_${stage}`
        );
    }

    logger.info(`Kitchen order stage updated: ${id} -> ${stage}`);

    const io = req.app.get('io');
    if (io) {
        io.to('kitchen').emit('order_stage_updated', {
            id,
            order_id: kitchenOrder.order?.order_id,
            stage
        });

        // Notify customer
        io.emit('order_status_updated', {
            order_id: kitchenOrder.order?.order_id,
            status: stage
        });
    }

    res.status(200).json(formatResponse(true, 'Kitchen order stage updated', {
        kitchen_order_id: result.kitchenOrderId,
        new_status: result.newStatus,
        timestamp: result.timestamp
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
