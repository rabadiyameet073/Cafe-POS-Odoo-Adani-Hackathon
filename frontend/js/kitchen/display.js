let orders = []

document.addEventListener('DOMContentLoaded', function () {
    initKitchen()
    updateClock()
    setInterval(updateClock, 1000)
    setInterval(loadOrders, 10000)
})

function initKitchen() {
    authService.getCurrentUser().then(userData => {
        if (!userData) {
            window.location.href = 'login.html'
            return
        }

        if (userData.role !== 'kitchen' && userData.role !== 'admin') {
            window.location.href = getDefaultRoute(userData.role)
            return
        }
    })

    document.getElementById('logoutBtn').addEventListener('click', () => {
        authService.logout()
    })

    loadOrders()
}

async function loadOrders() {
    try {
        // Use grouped=true to get all stages including completed
        const response = await api.get('/kitchen/orders?grouped=true')
        // Debug: log response to see structure
        console.log('Kitchen API response:', response)

        // The response structure is: { success: true, data: { orders: { to_cook: [], preparing: [], completed: [] } } }
        const data = response.data || response
        const grouped = data.orders || data

        // Handle grouped response structure
        if (grouped.to_cook !== undefined || grouped.preparing !== undefined || grouped.completed !== undefined) {
            orders = [
                ...(grouped.to_cook || []),
                ...(grouped.preparing || []),
                ...(grouped.completed || [])
            ]
        } else if (Array.isArray(grouped)) {
            orders = grouped
        } else if (Array.isArray(data)) {
            orders = data
        } else {
            orders = []
        }

        // Ensure orders is always an array
        if (!Array.isArray(orders)) {
            console.warn('Orders is not an array, resetting to empty:', orders)
            orders = []
        }
    } catch (error) {
        console.error('Failed to load kitchen orders:', error)
        orders = []
    }

    renderOrders()

    document.getElementById('loadingState').classList.add('hidden')
    document.getElementById('kitchenContent').classList.remove('hidden')
}

function renderOrders() {
    const toCook = orders.filter(o => o.stage === 'to_cook' || o.status === 'sent_to_kitchen')
    const preparing = orders.filter(o => o.stage === 'preparing' || o.status === 'preparing')
    const ready = orders.filter(o => o.stage === 'completed' || o.status === 'ready')

    document.getElementById('orderCount').textContent = `${orders.length} orders`
    document.getElementById('toCookCount').textContent = toCook.length
    document.getElementById('preparingCount').textContent = preparing.length
    document.getElementById('readyCount').textContent = ready.length

    document.getElementById('toCookOrders').innerHTML = toCook.length
        ? toCook.map(o => renderOrderCard(o, 'to_cook')).join('')
        : renderEmptyState('chef')
    document.getElementById('preparingOrders').innerHTML = preparing.length
        ? preparing.map(o => renderOrderCard(o, 'preparing')).join('')
        : renderEmptyState('clock')
    document.getElementById('readyOrders').innerHTML = ready.length
        ? ready.map(o => renderOrderCard(o, 'completed')).join('')
        : renderEmptyState('bell')
}

function renderOrderCard(order, stage) {
    const receivedAt = order.received_at || order.created_at
    const elapsedMins = receivedAt ? Math.floor((Date.now() - new Date(receivedAt).getTime()) / 60000) : 0
    const timeColor = elapsedMins < 5 ? 'text-emerald-600' : elapsedMins < 10 ? 'text-amber-600' : 'text-red-600'

    const ticketNumber = order.ticket_number || order.orders?.order_number || `#${(order.id || '').slice(0, 6)}`
    const tableInfo = order.orders?.tables?.table_number || order.table_number
    const tableLabel = tableInfo ? `Table ${tableInfo}` : 'Takeaway'

    let actionBtn = ''
    if (stage === 'to_cook') {
        actionBtn = `<button onclick="moveToStage('${order.id}', 'preparing')" class="w-full py-2.5 rounded-xl font-medium bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-md">Start Cooking</button>`
    } else if (stage === 'preparing') {
        actionBtn = `<button onclick="moveToStage('${order.id}', 'completed')" class="w-full py-2.5 rounded-xl font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-md">Mark Ready</button>`
    } else {
        actionBtn = `<button onclick="markAsPickedUp('${order.id}')" class="w-full py-2.5 rounded-xl font-medium bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-md flex items-center justify-center gap-2">
            <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span>Order Picked Up</span>
        </button>`
    }

    const items = order.items || order.order_items || []

    return `
        <div class="glass-card-static p-4 hover:shadow-md transition-all">
            <div class="flex items-center justify-between mb-3">
                <div>
                    <span class="text-slate-800 font-bold text-lg">${ticketNumber}</span>
                    <span class="text-slate-500 text-sm ml-2">${tableLabel}</span>
                </div>
                <div class="flex items-center gap-1 ${timeColor}">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span class="font-mono font-bold">${elapsedMins}m</span>
                </div>
            </div>
            <div class="space-y-2 mb-3">
                ${items.map(item => {
        // Debug: log item structure to console
        console.log('Kitchen item:', item)
        // Try multiple property names for item name
        const itemName = item.name || item.product_name || item.productName || item.product?.name || item.products?.name || 'Unknown Item'
        const itemQty = item.quantity ?? item.qty ?? 1
        const isCompleted = item.kitchen_status === 'completed'
        return `
                    <div class="flex items-center justify-between text-sm ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}">
                        <span><span class="font-semibold">${itemQty}x</span> ${itemName}</span>
                        ${isCompleted ? '<svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' : ''}
                    </div>
                `}).join('')}
            </div>
            ${actionBtn}
        </div>
    `
}

function renderEmptyState(icon) {
    const icons = {
        chef: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>',
        clock: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
        bell: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>'
    }
    return `
        <div class="text-center py-12 text-slate-400">
            <svg class="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icons[icon]}</svg>
            <p class="text-sm">No orders</p>
        </div>
    `
}

async function moveToStage(orderId, newStage) {
    try {
        await api.patch(`/kitchen/orders/${orderId}/stage`, { stage: newStage })

        if (newStage === 'completed') {
            Toast.success('Order marked as ready!')
        } else if (newStage === 'preparing') {
            Toast.info('Cooking started')
        }

        // Reload to reflect changes from database
        loadOrders()
    } catch (error) {
        console.error('Failed to update order stage:', error)
        Toast.error(error.message || 'Failed to update order')
    }
}

function updateClock() {
    const now = new Date()
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })
}

async function markAsPickedUp(orderId) {
    try {
        // Delete kitchen order (marks as picked up and removes from display)
        await api.delete(`/kitchen/orders/${orderId}`)

        Toast.success('Order picked up successfully!')

        // Reload to remove from display
        loadOrders()
    } catch (error) {
        console.error('Failed to mark order as picked up:', error)
        Toast.error(error.message || 'Failed to update order')
    }
}
