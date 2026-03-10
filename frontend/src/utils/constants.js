// Use environment variables with fallback to localhost
export const API_URL = import.meta.env.VITE_API_URL || '/api'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''

export const USER_ROLES = {
  CUSTOMER: 'customer',
  CASHIER: 'cashier',
  KITCHEN: 'kitchen',
  ADMIN: 'admin'
}

export const ORDER_STATUS = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  SENT_TO_KITCHEN: 'sent_to_kitchen',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export const KITCHEN_STAGES = {
  TO_COOK: 'to_cook',
  PREPARING: 'preparing',
  COMPLETED: 'completed'
}

export const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved'
}

export const PAYMENT_METHODS = {
  CASH: 'cash',
  UPI_QR: 'upi_qr',
  NETBANKING: 'netbanking',
  CARD: 'card'
}

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
}

export const SESSION_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed'
}

export const ORDER_TYPES = {
  DINE_IN: 'dine_in',
  TAKEAWAY: 'takeaway',
  SELF_ORDER: 'self_order'
}

export const STATUS_COLORS = {
  [ORDER_STATUS.DRAFT]: 'badge-neutral',
  [ORDER_STATUS.CONFIRMED]: 'badge-info',
  [ORDER_STATUS.SENT_TO_KITCHEN]: 'badge-warning',
  [ORDER_STATUS.PREPARING]: 'badge-warning',
  [ORDER_STATUS.READY]: 'badge-success',
  [ORDER_STATUS.COMPLETED]: 'badge-success',
  [ORDER_STATUS.CANCELLED]: 'badge-danger'
}

export const TABLE_STATUS_COLORS = {
  [TABLE_STATUS.AVAILABLE]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [TABLE_STATUS.OCCUPIED]: 'bg-red-100 text-red-700 border-red-200',
  [TABLE_STATUS.RESERVED]: 'bg-amber-100 text-amber-700 border-amber-200'
}

export function getDefaultRoute(role) {
  switch (role) {
    case USER_ROLES.CUSTOMER:
      return '/customer/floors'
    case USER_ROLES.CASHIER:
      return '/cashier/dashboard'
    case USER_ROLES.KITCHEN:
      return '/kitchen/display'
    case USER_ROLES.ADMIN:
      return '/admin/dashboard'
    default:
      return '/login'
  }
}
