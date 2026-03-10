/**
 * KitchenService
 * 
 * Manages kitchen orders display and status updates.
 * Status transitions: received → preparing → ready → served
 * 
 * Requirements: 8.1, 9.1, 9.3
 */

const { supabase } = require('../config/supabase');
const OrderService = require('./OrderService');
const logger = require('../utils/logger');

class KitchenService {
    /**
     * Send order to kitchen (create kitchen_order record)
     * @param {string} orderId - UUID of the order
     * @returns {Promise<Object>} Result with kitchen order ID
     */
    async sendToKitchen(orderId) {
        try {
            const now = new Date().toISOString();

            // Get order details with items
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items(*)
                `)
                .eq('id', orderId)
                .single();

            if (orderError || !order) {
                return {
                    success: false,
                    error: 'Order not found'
                };
            }

            // Verify order is paid
            if (order.payment_status !== 'paid') {
                return {
                    success: false,
                    error: 'Order must be paid before sending to kitchen'
                };
            }

            // Create snapshot of order items
            const itemsSnapshot = order.order_items.map(item => ({
                product_name: item.product_name,
                variant_name: item.variant_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                notes: item.notes
            }));

            // Create kitchen order
            const { data: kitchenOrder, error: kitchenError } = await supabase
                .from('kitchen_orders')
                .insert({
                    order_id: orderId,
                    table_number: order.table_number,
                    table_token: order.table_token,
                    order_number: order.order_number,
                    items: itemsSnapshot,
                    status: 'received',
                    priority: 0,
                    payment_method: order.payment_method,
                    received_at: now,
                    notes: order.special_instructions,
                    created_at: now,
                    updated_at: now
                })
                .select()
                .single();

            if (kitchenError) {
                logger.error('Error creating kitchen order:', kitchenError);
                return {
                    success: false,
                    error: 'Failed to send order to kitchen'
                };
            }

            // Update order status
            await supabase
                .from('orders')
                .update({
                    status: 'received',
                    kitchen_sent_at: now,
                    updated_at: now
                })
                .eq('id', orderId);

            logger.info(`Order ${order.order_number} sent to kitchen`);

            return {
                success: true,
                kitchenOrderId: kitchenOrder.id,
                orderNumber: order.order_number,
                tableNumber: order.table_number
            };
        } catch (err) {
            logger.error('Error in sendToKitchen:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Update kitchen order status
     * @param {string} kitchenOrderId - UUID of the kitchen order
     * @param {string} newStatus - New status (preparing, ready, served)
     * @param {string} staffId - UUID of kitchen staff (optional)
     * @returns {Promise<Object>} Result object
     */
    async updateKitchenStatus(kitchenOrderId, newStatus, staffId = null) {
        try {
            const now = new Date().toISOString();

            // Validate status
            const validStatuses = ['received', 'preparing', 'ready', 'served'];
            if (!validStatuses.includes(newStatus)) {
                return {
                    success: false,
                    error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                };
            }

            // Get current kitchen order
            const { data: kitchenOrder, error: fetchError } = await supabase
                .from('kitchen_orders')
                .select('order_id, status, table_number')
                .eq('id', kitchenOrderId)
                .single();

            if (fetchError || !kitchenOrder) {
                return {
                    success: false,
                    error: 'Kitchen order not found'
                };
            }

            // Determine timestamp field to update
            const timestampField = {
                'preparing': 'started_preparing_at',
                'ready': 'ready_at',
                'served': 'served_at'
            }[newStatus];

            const updateData = {
                status: newStatus,
                updated_at: now
            };

            if (timestampField) {
                updateData[timestampField] = now;
            }

            // Update kitchen order
            const { error: updateError } = await supabase
                .from('kitchen_orders')
                .update(updateData)
                .eq('id', kitchenOrderId);

            if (updateError) {
                logger.error('Error updating kitchen order status:', updateError);
                return {
                    success: false,
                    error: 'Failed to update kitchen order status'
                };
            }

            // Update main order status
            const orderStatusMap = {
                'received': 'received',
                'preparing': 'preparing',
                'ready': 'ready',
                'served': 'served'
            };

            await OrderService.updateOrderStatus(
                kitchenOrder.order_id,
                orderStatusMap[newStatus],
                staffId,
                `Kitchen status changed to ${newStatus}`
            );

            logger.info(`Kitchen order ${kitchenOrderId} status updated to ${newStatus}`);

            return {
                success: true,
                kitchenOrderId: kitchenOrderId,
                newStatus: newStatus,
                timestamp: now
            };
        } catch (err) {
            logger.error('Error in updateKitchenStatus:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Get kitchen orders with optional status filter
     * @param {string} statusFilter - Optional status to filter by
     * @returns {Promise<Object>} Result with kitchen orders
     */
    async getKitchenOrders(statusFilter = null) {
        try {
            let query = supabase
                .from('kitchen_orders')
                .select('*')
                .order('received_at', { ascending: true }); // Oldest first

            if (statusFilter) {
                query = query.eq('status', statusFilter);
            } else {
                // By default, exclude served orders
                query = query.in('status', ['received', 'preparing', 'ready']);
            }

            const { data: orders, error } = await query;

            if (error) {
                logger.error('Error fetching kitchen orders:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            // Calculate age for each order
            const now = new Date();
            const ordersWithAge = (orders || []).map(order => {
                const receivedAt = new Date(order.received_at);
                const ageMinutes = Math.floor((now - receivedAt) / 60000);
                const isOld = ageMinutes > 15;

                return {
                    ...order,
                    ageMinutes: ageMinutes,
                    isOld: isOld
                };
            });

            return {
                success: true,
                orders: ordersWithAge,
                count: ordersWithAge.length
            };
        } catch (err) {
            logger.error('Error in getKitchenOrders:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Get kitchen order by ID
     * @param {string} kitchenOrderId - UUID of the kitchen order
     * @returns {Promise<Object>} Result with kitchen order details
     */
    async getKitchenOrderById(kitchenOrderId) {
        try {
            const { data: order, error } = await supabase
                .from('kitchen_orders')
                .select('*')
                .eq('id', kitchenOrderId)
                .single();

            if (error || !order) {
                return {
                    success: false,
                    error: 'Kitchen order not found'
                };
            }

            return {
                success: true,
                order: order
            };
        } catch (err) {
            logger.error('Error in getKitchenOrderById:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Get kitchen orders by table
     * @param {string} tableNumber - Table number
     * @returns {Promise<Object>} Result with kitchen orders
     */
    async getKitchenOrdersByTable(tableNumber) {
        try {
            const { data: orders, error } = await supabase
                .from('kitchen_orders')
                .select('*')
                .eq('table_number', tableNumber)
                .order('received_at', { ascending: false });

            if (error) {
                logger.error('Error fetching kitchen orders by table:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            return {
                success: true,
                orders: orders || [],
                count: orders?.length || 0
            };
        } catch (err) {
            logger.error('Error in getKitchenOrdersByTable:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Get kitchen statistics
     * @returns {Promise<Object>} Result with statistics
     */
    async getKitchenStats() {
        try {
            const { data: orders, error } = await supabase
                .from('kitchen_orders')
                .select('status, received_at')
                .in('status', ['received', 'preparing', 'ready']);

            if (error) {
                logger.error('Error fetching kitchen stats:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            const now = new Date();
            const stats = {
                received: 0,
                preparing: 0,
                ready: 0,
                total: orders?.length || 0,
                oldOrders: 0 // Orders older than 15 minutes
            };

            (orders || []).forEach(order => {
                stats[order.status]++;

                const receivedAt = new Date(order.received_at);
                const ageMinutes = Math.floor((now - receivedAt) / 60000);
                if (ageMinutes > 15) {
                    stats.oldOrders++;
                }
            });

            return {
                success: true,
                stats: stats
            };
        } catch (err) {
            logger.error('Error in getKitchenStats:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }
}

module.exports = new KitchenService();
