

document.addEventListener('DOMContentLoaded', async function () {
    await loadDashboard()
})

async function loadDashboard() {
    const loadingEl = document.getElementById('loadingState')
    const dashboardContent = document.getElementById('dashboardContent')
    const openSessionBtn = document.getElementById('openSessionBtn')
    const sessionInfo = document.getElementById('sessionInfo')

    let stats = {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0
    }
    let recentOrders = []

    try {
        const sessionResponse = await api.get('/sessions/active')
        const session = sessionResponse.data.session

        if (!session) {
            openSessionBtn.classList.remove('hidden')
            sessionInfo.textContent = 'No active session'
        } else {
            sessionInfo.textContent = `Session: ${session.session_number}`
            openSessionBtn.classList.add('hidden')
        }

        const [salesReportResponse, ordersResponse] = await Promise.all([
            api.get('/reports/sales?period=today'),
            api.get('/orders?limit=10')
        ])

        const salesReport = salesReportResponse.data
        const orders = ordersResponse.data.orders || []

        const pendingOrdersList = orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status))

        stats = {
            totalOrders: salesReport.summary?.total_orders || 0,
            totalRevenue: salesReport.summary?.total_revenue || 0,
            pendingOrders: pendingOrdersList.length,
            completedOrders: salesReport.summary?.total_orders || 0
        }

        recentOrders = pendingOrdersList.slice(0, 5).map(order => ({
            id: order.id,
            order_number: order.order_number,
            table: order.tables?.table_number || 'N/A',
            amount: parseFloat(order.total_amount || 0),
            status: order.status,
            time: formatRelativeTime(new Date(order.created_at))
        }))
    } catch (error) {
        console.error('Failed to load dashboard data', error)
        const session = getSessionFromStorage()
        if (!session || !session.isOpen) {
            openSessionBtn.classList.remove('hidden')
            sessionInfo.textContent = 'No active session'
        } else {
            sessionInfo.textContent = `Session: ${session.sessionNumber}`
        }
    }

    renderStats(stats)
    renderRecentOrders(recentOrders)

    loadingEl.classList.add('hidden')
    dashboardContent.classList.remove('hidden')
}

function renderStats(stats) {
    const statCards = [
        { label: 'Total Orders', value: stats.totalOrders, color: 'from-blue-400 to-blue-500', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>' },
        { label: 'Revenue', value: formatCurrency(stats.totalRevenue), color: 'from-emerald-400 to-emerald-500', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>' },
        { label: 'Pending', value: stats.pendingOrders, color: 'from-amber-400 to-amber-500', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>' },
        { label: 'Completed', value: stats.completedOrders, color: 'from-purple-400 to-purple-500', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>' }
    ]

    document.getElementById('statsGrid').innerHTML = statCards.map(stat => `
        <div class="glass-card-static p-6">
            <div class="flex items-start justify-between">
                <div>
                    <p class="text-sm text-slate-500">${stat.label}</p>
                    <p class="text-2xl font-bold text-slate-800 mt-1">${stat.value}</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">${stat.icon}</svg>
                </div>
            </div>
        </div>
    `).join('')
}

function renderRecentOrders(orders) {
    document.getElementById('recentOrders').innerHTML = orders.map(order => `
        <div class="flex items-center justify-between py-3">
            <div class="flex items-center gap-4">
                <div>
                    <p class="font-medium text-slate-800">${order.order_number}</p>
                    <p class="text-sm text-slate-500">Table ${order.table}</p>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'badge-neutral'}">${order.status}</span>
                <span class="font-medium text-slate-700">${formatCurrency(order.amount)}</span>
                <span class="text-sm text-slate-400">${order.time}</span>
            </div>
        </div>
    `).join('')
}
