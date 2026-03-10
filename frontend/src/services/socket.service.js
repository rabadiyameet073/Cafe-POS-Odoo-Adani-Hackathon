import { io } from 'socket.io-client'
import { SOCKET_URL } from '../utils/constants'

class SocketService {
  constructor() {
    this.socket = null
    this.connected = false
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id)
      this.connected = true
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      this.connected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }

  joinRole(role, userId) {
    if (this.socket?.connected) {
      this.socket.emit('join_role', { role, user_id: userId })
    }
  }

  joinOrder(orderId) {
    if (this.socket?.connected) {
      this.socket.emit('join_order', orderId)
    }
  }

  leaveOrder(orderId) {
    if (this.socket?.connected) {
      this.socket.emit('leave_order', orderId)
    }
  }

  joinKitchen() {
    if (this.socket?.connected) {
      this.socket.emit('join_kitchen')
    }
  }

  joinCashier() {
    if (this.socket?.connected) {
      this.socket.emit('join_cashier')
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    }
  }

  isConnected() {
    return this.connected && this.socket?.connected
  }
}

export const socketService = new SocketService()
