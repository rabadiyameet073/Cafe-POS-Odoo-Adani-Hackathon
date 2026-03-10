/**
 * Transaction Helper
 *
 * Provides pseudo-atomic transaction helpers for Supabase operations.
 * Since the Supabase JS client does not expose native PostgreSQL transactions,
 * these helpers perform sequential operations with manual rollback on failure.
 *
 * Functions:
 *   - createOrderTransaction: Atomically creates an order + its line items
 *   - approvePaymentTransaction: Atomically approves a payment + updates the order
 */

const { supabase } = require('../config/supabase');
const logger = require('./logger');

/**
 * Create an order and its items in a pseudo-atomic operation.
 * If item insertion fails, the order row is deleted (rollback).
 *
 * @param {Object} orderData  - Row data for the `orders` table
 * @param {Array}  itemsData  - Array of row data for the `order_items` table
 * @returns {Promise<{success: boolean, result?: {order: Object}, error?: string}>}
 */
async function createOrderTransaction(orderData, itemsData) {
    let insertedOrder = null;

    try {
        // Step 1 – Insert the order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

        if (orderError || !order) {
            logger.error('Transaction: failed to insert order', orderError);
            return {
                success: false,
                error: orderError?.message || 'Failed to create order'
            };
        }

        insertedOrder = order;

        // Step 2 – Attach order_id to every item and insert them
        const itemsWithOrderId = itemsData.map(item => ({
            ...item,
            order_id: order.id
        }));

        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsWithOrderId)
            .select();

        if (itemsError) {
            logger.error('Transaction: failed to insert order items – rolling back order', itemsError);

            // Rollback: delete the order we just created
            await supabase.from('orders').delete().eq('id', order.id);

            return {
                success: false,
                error: itemsError.message || 'Failed to create order items'
            };
        }

        logger.info(`Transaction: order ${order.order_number} created with ${items.length} items`);

        return {
            success: true,
            result: {
                order: { ...order, order_items: items }
            }
        };
    } catch (err) {
        logger.error('Transaction: unexpected error in createOrderTransaction', err);

        // Best-effort rollback
        if (insertedOrder) {
            try {
                await supabase.from('orders').delete().eq('id', insertedOrder.id);
            } catch (rollbackErr) {
                logger.error('Transaction: rollback also failed', rollbackErr);
            }
        }

        return {
            success: false,
            error: err.message
        };
    }
}

/**
 * Approve a cash payment and update the related order in a pseudo-atomic operation.
 * If the order update fails, the payment is reverted to its previous state (rollback).
 *
 * @param {string} paymentId    - UUID of the payment to approve
 * @param {Object} approvalData - { cashier_id, cashier_name, approved_at }
 * @returns {Promise<{success: boolean, result?: Object, error?: string}>}
 */
async function approvePaymentTransaction(paymentId, approvalData) {
    let previousPaymentStatus = null;

    try {
        // Step 1 – Fetch current payment
        const { data: payment, error: fetchError } = await supabase
            .from('payments')
            .select('id, order_id, status, amount, table_number, payment_method')
            .eq('id', paymentId)
            .single();

        if (fetchError || !payment) {
            return {
                success: false,
                error: 'Payment not found'
            };
        }

        if (payment.payment_method !== 'cash') {
            return {
                success: false,
                error: 'Payment is not a cash payment'
            };
        }

        if (payment.status !== 'pending_approval') {
            return {
                success: false,
                error: 'Payment already processed'
            };
        }

        previousPaymentStatus = payment.status;
        const now = approvalData.approved_at || new Date().toISOString();

        // Step 2 – Update payment to approved / completed
        const { error: paymentUpdateError } = await supabase
            .from('payments')
            .update({
                status: 'completed',
                cashier_id: approvalData.cashier_id,
                cashier_name: approvalData.cashier_name,
                payment_confirmed_at: now,
                updated_at: now
            })
            .eq('id', paymentId);

        if (paymentUpdateError) {
            logger.error('Transaction: failed to update payment', paymentUpdateError);
            return {
                success: false,
                error: 'Failed to approve payment'
            };
        }

        // Step 3 – Update order status to paid
        const { error: orderUpdateError } = await supabase
            .from('orders')
            .update({
                payment_status: 'paid',
                status: 'paid',
                payment_confirmed_at: now,
                updated_at: now
            })
            .eq('id', payment.order_id);

        if (orderUpdateError) {
            logger.error('Transaction: failed to update order – rolling back payment', orderUpdateError);

            // Rollback: revert payment to previous state
            await supabase
                .from('payments')
                .update({
                    status: previousPaymentStatus,
                    cashier_id: null,
                    cashier_name: null,
                    payment_confirmed_at: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', paymentId);

            return {
                success: false,
                error: 'Failed to update order after payment approval'
            };
        }

        logger.info(`Transaction: payment ${paymentId} approved for order ${payment.order_id}`);

        return {
            success: true,
            result: {
                paymentId: payment.id,
                orderId: payment.order_id,
                amount: payment.amount,
                tableNumber: payment.table_number
            }
        };
    } catch (err) {
        logger.error('Transaction: unexpected error in approvePaymentTransaction', err);

        // Best-effort rollback
        if (previousPaymentStatus) {
            try {
                await supabase
                    .from('payments')
                    .update({ status: previousPaymentStatus, updated_at: new Date().toISOString() })
                    .eq('id', paymentId);
            } catch (rollbackErr) {
                logger.error('Transaction: rollback also failed', rollbackErr);
            }
        }

        return {
            success: false,
            error: err.message
        };
    }
}

module.exports = {
    createOrderTransaction,
    approvePaymentTransaction
};
