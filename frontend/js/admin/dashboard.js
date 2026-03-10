const DEMO_STATS = {
    totalRevenue: 125000,
    totalOrders: 487,
    avgOrderValue: 256.68,
    avgRating: 4.5,
    revenueChange: 12.5,
    ordersChange: 8.2
}

const DEMO_TOP_PRODUCTS = [
    { name: 'Margherita Pizza', category: 'Pizzas', revenue: 25000, units_sold: 56 },
    { name: 'Cappuccino', category: 'Beverages', revenue: 15000, units_sold: 83 },
    { name: 'Tiramisu', category: 'Desserts', revenue: 12000, units_sold: 43 },
    { name: 'Garlic Bread', category: 'Starters', revenue: 8000, units_sold: 67 },
    { name: 'Caesar Salad', category: 'Salads', revenue: 7500, units_sold: 38 }
]

const DEMO_RECENT_ORDERS = [
    { id: '1', order_number: 'ORD-001', customer: 'John Doe', amount: 850, time: '5 min ago' },
    { id: '2', order_number: 'ORD-002', customer: 'Jane Smith', amount: 1200, time: '12 min ago' },
    { id: '3', order_number: 'ORD-003', customer: 'Guest', amount: 450, time: '18 min ago' }
]

document.addEventListener('DOMContentLoaded', async function () {
    await loadDashboard()
})

async function loadDashboard() {
    const loadingEl = document.getElementById('loadingState')
    const dashboardContent = document.getElementById('dashboardContent')

    let stats = DEMO_STATS
    let topProducts = DEMO_TOP_PRODUCTS
    let recentOrders = DEMO_RECENT_ORDERS

    try {
        const [salesReportResponse, productReportResponse] = await Promise.all([
            api.get('/reports/sales'),
            api.get('/reports/products')
        ])

        const salesReport = salesReportResponse.data
        const productReport = productReportResponse.data

        stats = {
            totalRevenue: salesReport.summary?.total_revenue || 0,
            totalOrders: salesReport.summary?.total_orders || 0,
            avgOrderValue: salesReport.summary?.average_order_value || 0,
            avgRating: 4.5,
            revenueChange: 12.5,
            ordersChange: 8.2
        }

        topProducts = (productReport.products || []).slice(0, 5).map(p => ({
            name: p.product_name,
            category: p.category,
            revenue: p.revenue,
            units_sold: p.units_sold
        }))
    } catch (error) {
        console.error('Failed to load dashboard data', error)
    }

    renderStats(stats)
    renderTopProducts(topProducts)
    renderRecentOrders(recentOrders)

    loadingEl.classList.add('hidden')
    dashboardContent.classList.remove('hidden')
}

function renderStats(stats) {
    const statCards = [
        { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), change: stats.revenueChange, color: 'from-emerald-400 to-emerald-500', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>' },
        { label: 'Total Orders', value: formatNumber(stats.totalOrders), change: stats.ordersChange, color: 'from-blue-400 to-blue-500', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>' },
        { label: 'Avg Order Value', value: formatCurrency(stats.avgOrderValue), color: 'from-purple-400 to-purple-500', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>' },
        { label: 'Avg Rating', value: stats.avgRating?.toFixed(1) || '0.0', color: 'from-amber-400 to-amber-500', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>' }
    ]

    document.getElementById('statsGrid').innerHTML = statCards.map(stat => `
        <div class="glass-card-static p-6">
            <div class="flex items-start justify-between">
                <div>
                    <p class="text-sm text-slate-500">${stat.label}</p>
                    <p class="text-2xl font-bold text-slate-800 mt-1">${stat.value}</p>
                    ${stat.change ? `
                        <div class="flex items-center gap-1 mt-2 text-sm ${stat.change > 0 ? 'text-emerald-600' : 'text-red-600'}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${stat.change > 0 ? 'M7 17L17 7M17 7V17M17 7H7' : 'M17 7L7 17M7 17V7M7 17H17'}"></path></svg>
                            <span>${formatPercent(Math.abs(stat.change))}</span>
                            <span class="text-slate-400">vs last week</span>
                        </div>
                    ` : ''}
                </div>
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">${stat.icon}</svg>
                </div>
            </div>
        </div>
    `).join('')
}

function renderTopProducts(products) {
    document.getElementById('topProducts').innerHTML = products.map((product, index) => `
        <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">${index + 1}</span>
                <div>
                    <p class="font-medium text-slate-700">${product.name}</p>
                    <p class="text-sm text-slate-400">${product.category}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-medium text-slate-700">${formatCurrency(product.revenue)}</p>
                <p class="text-sm text-slate-400">${product.units_sold} sold</p>
            </div>
        </div>
    `).join('')
}

function renderRecentOrders(orders) {
    document.getElementById('recentOrders').innerHTML = orders.map(order => `
        <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <svg class="w-[18px] h-[18px] text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                </div>
                <div>
                    <p class="font-medium text-slate-700">${order.order_number}</p>
                    <p class="text-sm text-slate-400">${order.customer}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-medium text-slate-700">${formatCurrency(order.amount)}</p>
                <p class="text-sm text-slate-400 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    ${order.time}
                </p>
            </div>
        </div>
    `).join('')
}
