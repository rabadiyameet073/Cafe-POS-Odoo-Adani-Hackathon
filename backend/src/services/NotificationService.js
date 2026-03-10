/**
 * NotificationService
 * 
 * Manages real-time notifications to different user roles.
 * Notifications are stored in the database and broadcast via Supabase real-time.
 * 
 * Requirements: 4.2, 9.5
 */

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

class NotificationService {
    /**
     * Notify cashier about a new payment request
     * @param {string} paymentRequestId - UUID of the cashier payment request
     * @returns {Promise<Object>} Result object
     */
    async notifyCashier(paymentRequestId) {
        try {
            // Get payment request details
            const { data: request, error: requestError } = await supabase
                .from('cashier_payment_requests')
                .select('table_number, total_amount, order_summary')
                .eq('id', paymentRequestId)
                .single();

            if (requestError || !request) {
                return {
                    success: false,
                    error: 'Payment request not found'
                };
            }

            const now = new Date().toISOString();

            // Create notification
            const { data: notification, error: notificationError } = await supabase
                .from('notifications')
                .insert({
                    type: 'payment_request',
                    recipient_role: 'cashier',
                    recipient_id: null, // Broadcast to all cashiers
                    title: `New Payment Request - Table ${request.table_number}`,
                    body: `Cash payment of ₹${request.total_amount} requested`,
                    data: {
                        payment_request_id: paymentRequestId,
                        table_number: request.table_number,
                        amount: request.total_amount,
                        order_summary: request.order_summary
                    },
                    is_read: false,
                    created_at: now
                })
                .select()
                .single();

            if (notificationError) {
                logger.error('Error creating cashier notification:', notificationError);
                return {
                    success: false,
                    error: 'Failed to create notification'
                };
            }

            logger.info(`Cashier notified about payment request ${paymentRequestId}`);

            return {
                success: true,
                notificationId: notification.id
            };
        } catch (err) {
            logger.error('Error in notifyCashier:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Notify customer about order status update
     * @param {string} orderId - UUID of the order
     * @param {string} type - Notification type (order_preparing, order_ready, payment_approved, payment_rejected)
     * @param {Object} additionalData - Additional data to include
     * @returns {Promise<Object>} Result object
     */
    async notifyCustomer(orderId, type, additionalData = {}) {
        try {
            // Get order details
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select('order_number, table_number, status')
                .eq('id', orderId)
                .single();

            if (orderError || !order) {
                return {
                    success: false,
                    error: 'Order not found'
                };
            }

            const now = new Date().toISOString();

            // Determine notification content based on type
            let title, body;
            switch (type) {
                case 'order_preparing':
                    title = `Order ${order.order_number} - Preparing`;
                    body = 'Your order is being prepared in the kitchen';
                    break;
                case 'order_ready':
                    title = `Order ${order.order_number} - Ready!`;
                    body = 'Your order is ready for pickup';
                    break;
                case 'payment_approved':
                    title = 'Payment Approved';
                    body = `Your payment for order ${order.order_number} has been approved`;
                    break;
                case 'payment_rejected':
                    title = 'Payment Rejected';
                    body = `Your payment for order ${order.order_number} was rejected. ${additionalData.reason || ''}`;
                    break;
                case 'payment_expired':
                    title = 'Payment Expired';
                    body = additionalData.message || `Your UPI QR code for order ${order.order_number} has expired. Please generate a new QR code.`;
                    break;
                default:
                    title = `Order ${order.order_number} Update`;
                    body = `Status: ${order.status}`;
            }

            // Create notification
            const { data: notification, error: notificationError } = await supabase
                .from('notifications')
                .insert({
                    type: type,
                    recipient_role: 'customer',
                    recipient_id: null, // Could be linked to customer if we track customer IDs
                    title: title,
                    body: body,
                    data: {
                        order_id: orderId,
                        order_number: order.order_number,
                        table_number: order.table_number,
                        status: order.status,
                        ...additionalData
                    },
                    is_read: false,
                    created_at: now
                })
                .select()
                .single();

            if (notificationError) {
                logger.error('Error creating customer notification:', notificationError);
                return {
                    success: false,
                    error: 'Failed to create notification'
                };
            }

            logger.info(`Customer notified about ${type} for order ${order.order_number}`);

            return {
                success: true,
                notificationId: notification.id
            };
        } catch (err) {
            logger.error('Error in notifyCustomer:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Notify kitchen about a new order
     * @param {string} orderId - UUID of the order
     * @returns {Promise<Object>} Result object
     */
    async notifyKitchen(orderId) {
        try {
            // Get order details
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select('order_number, table_number, total_amount')
                .eq('id', orderId)
                .single();

            if (orderError || !order) {
                return {
                    success: false,
                    error: 'Order not found'
                };
            }

            const now = new Date().toISOString();

            // Create notification
            const { data: notification, error: notificationError } = await supabase
                .from('notifications')
                .insert({
                    type: 'payment_approved',
                    recipient_role: 'kitchen',
                    recipient_id: null, // Broadcast to all kitchen staff
                    title: `New Order - Table ${order.table_number}`,
                    body: `Order ${order.order_number} - ₹${order.total_amount}`,
                    data: {
                        order_id: orderId,
                        order_number: order.order_number,
                        table_number: order.table_number,
                        amount: order.total_amount
                    },
                    is_read: false,
                    created_at: now
                })
                .select()
                .single();

            if (notificationError) {
                logger.error('Error creating kitchen notification:', notificationError);
                return {
                    success: false,
                    error: 'Failed to create notification'
                };
            }

            logger.info(`Kitchen notified about new order ${order.order_number}`);

            return {
                success: true,
                notificationId: notification.id
            };
        } catch (err) {
            logger.error('Error in notifyKitchen:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Notify admin about system events
     * @param {string} type - Notification type (table_expiring, table_freed, etc.)
     * @param {Object} data - Event data
     * @returns {Promise<Object>} Result object
     */
    async notifyAdmin(type, data) {
        try {
            const now = new Date().toISOString();

            // Determine notification content based on type
            let title, body;
            switch (type) {
                case 'table_expiring':
                    title = `Table ${data.table_number} - Timer Expiring`;
                    body = `Less than 5 minutes remaining`;
                    break;
                case 'table_freed':
                    title = `Table ${data.table_number} - Freed`;
                    body = `Table automatically freed (timer expired)`;
                    break;
                case 'upi_qr_generated':
                    title = `UPI Payment - Table ${data.table_number}`;
                    body = `QR code generated for order ${data.order_number}`;
                    break;
                default:
                    title = 'System Notification';
                    body = type;
            }

            // Create notification
            const { data: notification, error: notificationError } = await supabase
                .from('notifications')
                .insert({
                    type: type,
                    recipient_role: 'admin',
                    recipient_id: null, // Broadcast to all admins
                    title: title,
                    body: body,
                    data: data,
                    is_read: false,
                    created_at: now
                })
                .select()
                .single();

            if (notificationError) {
                logger.error('Error creating admin notification:', notificationError);
                return {
                    success: false,
                    error: 'Failed to create notification'
                };
            }

            logger.info(`Admin notified about ${type}`);

            return {
                success: true,
                notificationId: notification.id
            };
        } catch (err) {
            logger.error('Error in notifyAdmin:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Get notifications for a specific role
     * @param {string} role - User role (cashier, kitchen, admin, customer)
     * @param {boolean} unreadOnly - Only return unread notifications
     * @param {number} limit - Maximum number of notifications to return
     * @returns {Promise<Object>} Result with notifications
     */
    async getNotificationsByRole(role, unreadOnly = false, limit = 50) {
        try {
            let query = supabase
                .from('notifications')
                .select('*')
                .eq('recipient_role', role)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (unreadOnly) {
                query = query.eq('is_read', false);
            }

            const { data: notifications, error } = await query;

            if (error) {
                logger.error('Error fetching notifications:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            return {
                success: true,
                notifications: notifications || [],
                count: notifications?.length || 0
            };
        } catch (err) {
            logger.error('Error in getNotificationsByRole:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Mark notification as read
     * @param {string} notificationId - UUID of the notification
     * @returns {Promise<Object>} Result object
     */
    async markAsRead(notificationId) {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) {
                logger.error('Error marking notification as read:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            return {
                success: true,
                notificationId: notificationId
            };
        } catch (err) {
            logger.error('Error in markAsRead:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Mark all notifications as read for a role
     * @param {string} role - User role
     * @returns {Promise<Object>} Result object
     */
    async markAllAsRead(role) {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('recipient_role', role)
                .eq('is_read', false);

            if (error) {
                logger.error('Error marking all notifications as read:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            return {
                success: true
            };
        } catch (err) {
            logger.error('Error in markAllAsRead:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    /**
     * Delete old notifications (older than specified days)
     * @param {number} daysOld - Delete notifications older than this many days
     * @returns {Promise<Object>} Result object
     */
    async deleteOldNotifications(daysOld = 7) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const { error } = await supabase
                .from('notifications')
                .delete()
                .lt('created_at', cutoffDate.toISOString());

            if (error) {
                logger.error('Error deleting old notifications:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            logger.info(`Deleted notifications older than ${daysOld} days`);

            return {
                success: true
            };
        } catch (err) {
            logger.error('Error in deleteOldNotifications:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }
}

module.exports = new NotificationService();
