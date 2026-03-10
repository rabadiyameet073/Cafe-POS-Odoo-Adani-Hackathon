const API_URL = '/api'
const SOCKET_URL = ''

const USER_ROLES = {
    CUSTOMER: 'customer',
    CASHIER: 'cashier',
    KITCHEN: 'kitchen',
    ADMIN: 'admin'
}

const ORDER_STATUS = {
    DRAFT: 'draft',
    CONFIRMED: 'confirmed',
    SENT_TO_KITCHEN: 'sent_to_kitchen',
    PREPARING: 'preparing',
    READY: 'ready',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
}

const KITCHEN_STAGES = {
    TO_COOK: 'to_cook',
    PREPARING: 'preparing',
    COMPLETED: 'completed'
}

const TABLE_STATUS = {
    AVAILABLE: 'available',
    OCCUPIED: 'occupied',
    RESERVED: 'reserved'
}

const PAYMENT_METHODS = {
    CASH: 'cash',
    UPI_QR: 'upi_qr',
    NETBANKING: 'netbanking',
    CARD: 'card'
}

const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
}

const SESSION_STATUS = {
    OPEN: 'open',
    CLOSED: 'closed'
}

const ORDER_TYPES = {
    DINE_IN: 'dine_in',
    TAKEAWAY: 'takeaway',
    SELF_ORDER: 'self_order'
}

const STATUS_COLORS = {
    [ORDER_STATUS.DRAFT]: 'badge-neutral',
    [ORDER_STATUS.CONFIRMED]: 'badge-info',
    [ORDER_STATUS.SENT_TO_KITCHEN]: 'badge-warning',
    [ORDER_STATUS.PREPARING]: 'badge-warning',
    [ORDER_STATUS.READY]: 'badge-success',
    [ORDER_STATUS.COMPLETED]: 'badge-success',
    [ORDER_STATUS.CANCELLED]: 'badge-danger'
}

const TABLE_STATUS_COLORS = {
    [TABLE_STATUS.AVAILABLE]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [TABLE_STATUS.OCCUPIED]: 'bg-red-100 text-red-700 border-red-200',
    [TABLE_STATUS.RESERVED]: 'bg-amber-100 text-amber-700 border-amber-200'
}

const NAV_ITEMS = {
    [USER_ROLES.CUSTOMER]: [
        { path: 'customer-floors.html', label: 'Tables', icon: 'LayoutGrid' },
        { path: 'customer-menu.html', label: 'Menu', icon: 'UtensilsCrossed' },
        { path: 'customer-cart.html', label: 'Cart', icon: 'ShoppingCart' },
        { path: 'customer-order-tracking.html', label: 'Orders', icon: 'ClipboardList' }
    ],
    [USER_ROLES.CASHIER]: [
        { path: 'cashier-dashboard.html', label: 'Dashboard', icon: 'LayoutDashboard' },
        { path: 'cashier-orders.html', label: 'Orders', icon: 'ClipboardList' },
        { path: 'cashier-floor.html', label: 'Floor View', icon: 'LayoutGrid' },
        { path: 'cashier-session.html', label: 'Session', icon: 'Clock' },
        { path: 'cashier-register.html', label: 'Register', icon: 'Calculator' }
    ],
    [USER_ROLES.KITCHEN]: [
        { path: 'kitchen-display.html', label: 'Kitchen Board', icon: 'ChefHat' }
    ],
    [USER_ROLES.ADMIN]: [
        { path: 'admin-dashboard.html', label: 'Dashboard', icon: 'LayoutDashboard' },
        { path: 'admin-products.html', label: 'Products', icon: 'Package' },
        { path: 'admin-floors.html', label: 'Floors', icon: 'Building2' },
        { path: 'admin-tables.html', label: 'Tables', icon: 'LayoutGrid' },
        { path: 'admin-payments.html', label: 'Payments', icon: 'CreditCard' },
        { path: 'admin-reports.html', label: 'Reports', icon: 'BarChart3' },
        { path: 'admin-settings.html', label: 'Settings', icon: 'Settings' }
    ]
}

function getDefaultRoute(role) {
    switch (role) {
        case USER_ROLES.CUSTOMER:
            return 'customer-floors.html'
        case USER_ROLES.CASHIER:
            return 'cashier-dashboard.html'
        case USER_ROLES.KITCHEN:
            return 'kitchen-display.html'
        case USER_ROLES.ADMIN:
            return 'admin-dashboard.html'
        default:
            return 'login.html'
    }
}
