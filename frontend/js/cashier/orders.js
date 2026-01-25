let orders = []
let statusFilter = 'all'
let searchQuery = ''

document.addEventListener('DOMContentLoaded', function () {
    loadOrders()
    setupEventListeners()
    renderFilters()
})

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', function (e) {
        searchQuery = e.target.value.toLowerCase()
        renderOrders()
    })
}

async function loadOrders() {
    try {
        const response = await api.get('/orders')
        orders = response.data.orders || []
    } catch (error) {
        console.error('Failed to load orders', error)
        Toast.error('Failed to load orders')
        orders = []
    }
    renderOrders()
}

function renderFilters() {
    const filters = ['all', ...Object.values(ORDER_STATUS)]
    document.getElementById('statusFilters').innerHTML = filters.map(status => `
        <button onclick="setStatusFilter('${status}')" class="filter-btn px-4 py-2 rounded-xl whitespace-nowrap transition-all ${statusFilter === status ? 'bg-slate-900 text-white' : 'bg-white/60 text-slate-600 hover:bg-white/80'}">
            ${status === 'all' ? 'All' : status.replace(/_/g, ' ').toUpperCase()}
        </button>
    `).join('')
}

function setStatusFilter(status) {
    statusFilter = status
    renderFilters()
    renderOrders()
}

function renderOrders() {
    const filtered = orders.filter(order => {
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter
        const matchesSearch = order.order_number.toLowerCase().includes(searchQuery) ||
            order.table_number.includes(searchQuery) ||
            order.customer_name.toLowerCase().includes(searchQuery)
        return matchesStatus && matchesSearch
    })

    const listEl = document.getElementById('ordersList')
    const emptyEl = document.getElementById('emptyState')

    if (filtered.length === 0) {
        listEl.innerHTML = ''
        emptyEl.classList.remove('hidden')
        return
    }

    emptyEl.classList.add('hidden')
    listEl.innerHTML = filtered.map(order => `
        <div class="glass-card-static p-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div>
                        <p class="font-semibold text-slate-800">${order.order_number}</p>
                        <p class="text-sm text-slate-500">Table ${order.tables?.table_number || 'N/A'} • ${order.users?.full_name || 'Guest'}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-right hidden sm:block">
                        <p class="font-medium text-slate-700">${formatCurrency(order.total_amount)}</p>
                        <p class="text-xs text-slate-400">${order.items?.length || 0} items</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'badge-neutral'}">${order.status}</span>
                    <div class="flex items-center gap-1 text-sm text-slate-400">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span>${formatRelativeTime(order.created_at)}</span>
                    </div>
                    <button onclick="viewOrder('${order.id}')" class="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        View
                    </button>
                </div>
            </div>
        </div>
    `).join('')
}

function viewOrder(orderId) {
    const order = orders.find(o => o.id === orderId)
    if (!order) return

    document.getElementById('modalTitle').textContent = `Order ${order.order_number}`
    document.getElementById('modalContent').innerHTML = `
        <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
                <p class="text-sm text-slate-500">Table</p>
                <p class="font-medium">${order.tables?.table_number || 'N/A'}</p>
            </div>
            <div>
                <p class="text-sm text-slate-500">Customer</p>
                <p class="font-medium">${order.users?.full_name || 'Guest'}</p>
            </div>
            <div>
                <p class="text-sm text-slate-500">Status</p>
                <span class="inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'badge-neutral'}">${order.status}</span>
            </div>
            <div>
                <p class="text-sm text-slate-500">Total</p>
                <p class="font-bold text-lg">${formatCurrency(order.total_amount)}</p>
            </div>
        </div>
        <button onclick="closeOrderModal()" class="btn-primary w-full">Close</button>
    `
    document.getElementById('orderModal').classList.remove('hidden')
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.add('hidden')
}
