function formatCurrency(amount, currency = 'INR') {
    const num = parseFloat(amount) || 0
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num)
}

function formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(num || 0)
}

function formatPercent(value, decimals = 1) {
    const num = parseFloat(value) || 0
    return `${num.toFixed(decimals)}%`
}

function formatDate(date, options = {}) {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''

    const defaultOptions = { day: '2-digit', month: 'short', year: 'numeric' }
    return d.toLocaleDateString('en-IN', { ...defaultOptions, ...options })
}

function formatTime(date) {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''

    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDateTime(date) {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''

    return `${formatDate(d)}, ${formatTime(d)}`
}

function formatRelativeTime(date) {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''

    const now = new Date()
    const diffMs = now - d
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return 'just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return formatDate(d)
}

function formatPhone(phone) {
    if (!phone) return ''
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
    }
    return phone
}

function formatOrderNumber(orderNumber) {
    if (!orderNumber) return ''
    return orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`
}

function formatTableNumber(tableNumber) {
    if (!tableNumber) return ''
    return `Table ${tableNumber}`
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDuration(minutes) {
    if (!minutes || minutes < 1) return '< 1 min'
    if (minutes < 60) return `${Math.round(minutes)} min`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}
