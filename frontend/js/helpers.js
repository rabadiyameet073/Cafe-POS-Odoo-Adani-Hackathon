function generateId(prefix = 'ID') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function capitalize(str) {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function formatStatus(status) {
    if (!status) return ''
    return status.split('_').map(capitalize).join(' ')
}

function calculateOrderTotals(items, taxRate = 0.05) {
    const subtotal = items.reduce((sum, item) => {
        const itemPrice = (item.unitPrice || item.unit_price || 0) + (item.variantPrice || item.variant_price || 0)
        const quantity = item.quantity || 1
        return sum + (itemPrice * quantity)
    }, 0)

    const tax = subtotal * taxRate
    const total = subtotal + tax

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100
    }
}

function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const groupKey = typeof key === 'function' ? key(item) : item[key]
        if (!groups[groupKey]) {
            groups[groupKey] = []
        }
        groups[groupKey].push(item)
        return groups
    }, {})
}

function sortBy(array, key, order = 'asc') {
    return [...array].sort((a, b) => {
        const aVal = typeof key === 'function' ? key(a) : a[key]
        const bVal = typeof key === 'function' ? key(b) : b[key]

        if (aVal < bVal) return order === 'asc' ? -1 : 1
        if (aVal > bVal) return order === 'asc' ? 1 : -1
        return 0
    })
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj))
}

function isEmpty(obj) {
    if (!obj) return true
    if (Array.isArray(obj)) return obj.length === 0
    if (typeof obj === 'object') return Object.keys(obj).length === 0
    return false
}

function truncate(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
}

function getInitials(name) {
    if (!name) return ''
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

function stringToColor(str) {
    if (!str) return '#64748b'
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16',
        '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
        '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'
    ]
    return colors[Math.abs(hash) % colors.length]
}

function hasRole(user, requiredRoles) {
    if (!user || !user.role) return false
    if (typeof requiredRoles === 'string') {
        return user.role === requiredRoles
    }
    return requiredRoles.includes(user.role)
}

function getElapsedTime(timestamp) {
    if (!timestamp) return ''

    const now = new Date()
    const past = new Date(timestamp)
    const diffMs = now - past
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
}

function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

function throttle(func, limit) {
    let inThrottle
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}
