/**
 * OrderService
 * 
 * Manages order creation, status updates, and retrieval.
 * Order number format: ORD-YYYYMMDD-XXXX
 * 
 * Requirements: 3.3, 9.3, 19.1
 */

const { supabase } = require('../config/supabase');
const TableTokenService = require('./TableTokenService');
const logger = require('../utils/logger');
const { createOrderTransaction } = require('../utils/transactionHelper');

class OrderService {
    /**
     * Generate order number in format ORD-YYYYMMDD-XXXX
     * @returns {Promise<string>} Generated order number
     */
    async generateOrderNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;

        // Get count of orders today to generate sequence number
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDay.toISOString())
            .lt('created_at', endOfDay.toISOString());

        if (error) {
            logger.error('Error counting orders:', error);
        }

        const sequence = String((count || 0) + 1).padStart(4, '0');
        return `ORD-${dateStr}-${sequence}`;
    }

    /**
     * Create a new order from cart items
     * @param {string} tableToken - Valid table token
     * @param {Array} cartItems - Array of cart items
     * @param {string} specialInstructions - Optional special instructions
     * @returns {Promise<Object>} Result with order details
     */
    async createOrder(tableToken, cartItems, specialInstructions = null) {
        try {
            // Validate table token
            const tokenValidation = await TableTokenService.validateToken(tableToken);
            if (!tokenValidation.valid) {
                return {
                    success: false,
                    error: `Invalid token: ${tokenValidation.reason}`
                };
            }

            // Validate cart is not empty
            if (!cartItems || cartItems.length === 0) {
                return {
                    success: false,
                    error: 'Cart is empty'
                };
            }

            const { tableId, tableNumber, sessionId } = tokenValidation;
            const now = new Date().toISOString();

            // Generate order number
            const orderNumber = await this.generateOrderNumber();

            // Calculate totals
            let subtotal = 0;
            let taxAmount = 0;

            const orderItemsData = [];

            for (const item of cartItems) {
                const itemSubtotal = item.unit_price * item.quantity;
                const itemTax = (itemSubtotal * (item.tax_percentage || 0)) / 100;
                const lineTotal = itemSubtotal + itemTax;

                subtotal += itemSubtotal;
                taxAmount += itemTax;

                orderItemsData.push({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    variant_id: item.variant_id || null,
                    variant_name: item.variant_name || null,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    variant_price: item.variant_price || 0,
                    tax_percentage: item.tax_percentage || 0,
                    line_total: lineTotal,
                    notes: item.notes || null,
                    kitchen_status: 'pending'
                });
            }

            const totalAmount = subtotal + taxAmount;

            // Use transaction helper for atomic order creation
            const transactionResult = await createOrderTransaction(
                {
                    order_number: orderNumber,
                    table_id: tableId,
                    table_number: tableNumber,
                    table_token: tableToken,
                    session_id: sessionId,
                    subtotal: subtotal,
                    tax_amount: taxAmount,
                    discount_amount: 0,
                    total_amount: totalAmount,
                    status: 'pending_payment',
                    payment_status: 'pending',
                    special_instructions: specialInstructions,
                    order_type: 'dine_in',
                    created_at: now,
                    updated_at: now
                },
                orderItemsData.map(item => ({
                    ...item,
                    created_at: now,
                    updated_at: now
                }))
            );

            if (!transactionResult.success) {
                logger.error('Transaction failed:', transactionResult.error);
                return {
                    success: false,
                    error: transactionResult.error
                };
            }

            const { order } = transactionResult.result;

            // Clear cart
            await supabase
                .from('cart_items')
                .delete()
                .eq('table_token', tableToken);

            logger.info(`Order created: ${orderNumber} for table ${tableNumber}`);

            return {
                success: true,
                orderId: order.id,
                orderNumber: orderNumber,
                totalAmount: totalAmount,
                tableNumber: tableNumber,
                itemCount: cartItems.length
            };
        } catch (err) {
            logger.error('Error in createOrder:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Update order status with history logging
     * @param {string} orderId - UUID of the order
     * @param {string} newStatus - New status value
     * @param {string} changedBy - UUID of user making the change (optional)
     * @param {string} note - Optional note about the change
     * @returns {Promise<Object>} Result object
     */
    async updateOrderStatus(orderId, newStatus, changedBy = null, note = null) {
        try {
            const now = new Date().toISOString();

            // Get current order
            const { data: order, error: fetchError } = await supabase
                .from('orders')
                .select('status')
                .eq('id', orderId)
                .single();

            if (fetchError || !order) {
                return {
                    success: false,
                    error: 'Order not found'
                };
            }

            const oldStatus = order.status;

            // Update order status
            const updateData = {
                status: newStatus,
                updated_at: now
            };

            // Set timestamp fields based on status
            if (newStatus === 'paid' && !order.payment_confirmed_at) {
                updateData.payment_confirmed_at = now;
            } else if (newStatus === 'ready' && !order.ready_at) {
                updateData.ready_at = now;
            } else if (newStatus === 'completed' && !order.completed_at) {
                updateData.completed_at = now;
            } else if (newStatus === 'cancelled' && !order.cancelled_at) {
                updateData.cancelled_at = now;
            }

            const { error: updateError } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId);

            if (updateError) {
                logger.error('Error updating order status:', updateError);
                return {
                    success: false,
                    error: 'Failed to update order status'
                };
            }

            // Log status change to history
            const { error: historyError } = await supabase
                .from('order_status_history')
                .insert({
                    order_id: orderId,
                    old_status: oldStatus,
                    new_status: newStatus,
                    changed_by: changedBy,
                    note: note,
                    created_at: now
                });

            if (historyError) {
                logger.error('Error logging status history:', historyError);
                // Don't fail the operation if history logging fails
            }

            logger.info(`Order ${orderId} status updated: ${oldStatus} -> ${newStatus}`);

            return {
                success: true,
                orderId: orderId,
                oldStatus: oldStatus,
                newStatus: newStatus
            };
        } catch (err) {
            logger.error('Error in updateOrderStatus:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Get all orders for a table session
     * @param {string} tableToken - Table token
     * @returns {Promise<Object>} Result with orders
     */
    async getOrdersByTable(tableToken) {
        try {
            // Validate token
            const tokenValidation = await TableTokenService.validateToken(tableToken);
            if (!tokenValidation.valid) {
                return {
                    success: false,
                    error: `Invalid token: ${tokenValidation.reason}`
                };
            }

            const { data: orders, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items(*)
                `)
                .eq('table_token', tableToken)
                .order('created_at', { ascending: false });

            if (error) {
                logger.error('Error fetching orders by table:', error);
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
            logger.error('Error in getOrdersByTable:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Get order by ID with items
     * @param {string} orderId - UUID of the order
     * @returns {Promise<Object>} Result with order details
     */
    async getOrderById(orderId) {
        try {
            const { data: order, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items(*)
                `)
                .eq('id', orderId)
                .single();

            if (error || !order) {
                return {
                    success: false,
                    error: 'Order not found'
                };
            }

            return {
                success: true,
                order: order
            };
        } catch (err) {
            logger.error('Error in getOrderById:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Get order status history
     * @param {string} orderId - UUID of the order
     * @returns {Promise<Object>} Result with status history
     */
    async getOrderStatusHistory(orderId) {
        try {
            const { data: history, error } = await supabase
                .from('order_status_history')
                .select('*')
                .eq('order_id', orderId)
                .order('created_at', { ascending: true });

            if (error) {
                logger.error('Error fetching order status history:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            return {
                success: true,
                history: history || []
            };
        } catch (err) {
            logger.error('Error in getOrderStatusHistory:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }
}

module.exports = new OrderService();
