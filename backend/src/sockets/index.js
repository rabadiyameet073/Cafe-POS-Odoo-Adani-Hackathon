/**
 * Socket.IO Setup
 * 
 * Initializes Socket.IO server with room management and event handlers.
 */

const { Server } = require('socket.io');
const logger = require('../utils/logger');
const env = require('../config/env');

let io = null;

/**
 * Initialize Socket.IO server
 * 
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
function initializeSocketIO(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: env.CLIENT_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Connection handling
    io.on('connection', (socket) => {
        logger.info(`Socket connected: ${socket.id}`);

        // Join user-specific room based on role
        socket.on('join_role', (data) => {
            const { role, user_id } = data;

            if (role === 'kitchen') {
                socket.join('kitchen');
                logger.debug(`Socket ${socket.id} joined kitchen room`);
            } else if (role === 'cashier') {
                socket.join('cashier');
                logger.debug(`Socket ${socket.id} joined cashier room`);
            } else if (role === 'admin') {
                socket.join('admin');
                socket.join('kitchen');
                socket.join('cashier');
                logger.debug(`Socket ${socket.id} joined admin rooms`);
            }

            if (user_id) {
                socket.join(`user_${user_id}`);
                socket.join(`customer_${user_id}`);
            }
        });

        // Join specific order room for tracking
        socket.on('join_order', (orderId) => {
            socket.join(`order_${orderId}`);
            logger.debug(`Socket ${socket.id} joined order room: ${orderId}`);
        });

        // Leave order room
        socket.on('leave_order', (orderId) => {
            socket.leave(`order_${orderId}`);
        });

        // Kitchen room join
        socket.on('join_kitchen', () => {
            socket.join('kitchen');
            logger.debug(`Socket ${socket.id} joined kitchen room`);
        });

        // Cashier room join
        socket.on('join_cashier', () => {
            socket.join('cashier');
            logger.debug(`Socket ${socket.id} joined cashier room`);
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
        });

        // Error handling
        socket.on('error', (error) => {
            logger.error(`Socket error: ${socket.id}`, error);
        });
    });

    logger.info('✅ Socket.IO initialized');

    return io;
}

/**
 * Get the Socket.IO server instance
 * 
 * @returns {Server|null} Socket.IO server instance
 */
function getIO() {
    return io;
}

/**
 * Emit an event to all connected clients
 * 
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
function emitToAll(event, data) {
    if (io) {
        io.emit(event, data);
    }
}

/**
 * Emit an event to a specific room
 * 
 * @param {string} room - Room name
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
function emitToRoom(room, event, data) {
    if (io) {
        io.to(room).emit(event, data);
    }
}

/**
 * Emit order status update
 * 
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @param {any} additionalData - Additional data
 */
function emitOrderUpdate(orderId, status, additionalData = {}) {
    if (io) {
        const data = { order_id: orderId, status, ...additionalData };
        io.emit('order_status_changed', data);
        io.to(`order_${orderId}`).emit('order_updated', data);
    }
}

/**
 * Emit kitchen update
 * 
 * @param {string} event - Event type
 * @param {any} data - Event data
 */
function emitKitchenUpdate(event, data) {
    if (io) {
        io.to('kitchen').emit(event, data);
    }
}

/**
 * Emit table status update
 * 
 * @param {string} tableId - Table ID
 * @param {string} status - New status
 */
function emitTableUpdate(tableId, status) {
    if (io) {
        io.emit('table_status_changed', { table_id: tableId, status });
    }
}

module.exports = {
    initializeSocketIO,
    getIO,
    emitToAll,
    emitToRoom,
    emitOrderUpdate,
    emitKitchenUpdate,
    emitTableUpdate
};
