const DEMO_STATS = {
    totalRevenue: 125000,
    totalOrders: 487,
    avgOrderValue: 256.68,
    newCustomers: 45
}

const DEMO_TOP_PRODUCTS = [
    { name: 'Margherita Pizza', revenue: 25000, units: 56 },
    { name: 'Cappuccino', revenue: 15000, units: 83 },
    { name: 'Tiramisu', revenue: 12000, units: 43 },
    { name: 'Garlic Bread', revenue: 8000, units: 67 },
    { name: 'Caesar Salad', revenue: 7500, units: 38 }
]

const DEMO_CATEGORIES = [
    { name: 'Pizzas', revenue: 45000, percent: 36 },
    { name: 'Beverages', revenue: 32000, percent: 26 },
    { name: 'Desserts', revenue: 22000, percent: 18 },
    { name: 'Starters', revenue: 15000, percent: 12 },
    { name: 'Salads', revenue: 11000, percent: 8 }
]

let selectedPeriod = 'today'

document.addEventListener('DOMContentLoaded', function () {
    loadReports()
})

function selectPeriod(period) {
    selectedPeriod = period
    document.querySelectorAll('.period-btn').forEach(btn => {
        if (btn.textContent.toLowerCase().includes(period) ||
            (period === 'today' && btn.textContent === 'Today') ||
            (period === 'week' && btn.textContent === 'This Week') ||
            (period === 'month' && btn.textContent === 'This Month') ||
            (period === 'year' && btn.textContent === 'This Year')) {
            btn.classList.add('bg-slate-900', 'text-white')
            btn.classList.remove('bg-white/60', 'text-slate-600')
        } else {
            btn.classList.remove('bg-slate-900', 'text-white')
            btn.classList.add('bg-white/60', 'text-slate-600')
        }
    })
    loadReports()
}

async function loadReports() {
    let stats = DEMO_STATS
    let topProducts = DEMO_TOP_PRODUCTS
    let categories = DEMO_CATEGORIES

    try {
        const report = await api.get(`/reports/sales?period=${selectedPeriod}`)
        stats = report.summary || stats
        topProducts = report.top_products || topProducts
    } catch (error) { }

    renderStats(stats)
    renderTopProducts(topProducts)
    renderCategories(categories)
}

function renderStats(stats) {
    document.getElementById('statsGrid').innerHTML = `
        <div class="glass-card-static p-6">
            <p class="text-sm text-slate-500">Total Revenue</p>
            <p class="text-2xl font-bold text-slate-800 mt-1">${formatCurrency(stats.totalRevenue || stats.total_revenue || 0)}</p>
        </div>
        <div class="glass-card-static p-6">
            <p class="text-sm text-slate-500">Total Orders</p>
            <p class="text-2xl font-bold text-slate-800 mt-1">${formatNumber(stats.totalOrders || stats.total_orders || 0)}</p>
        </div>
        <div class="glass-card-static p-6">
            <p class="text-sm text-slate-500">Avg Order Value</p>
            <p class="text-2xl font-bold text-slate-800 mt-1">${formatCurrency(stats.avgOrderValue || stats.average_order_value || 0)}</p>
        </div>
        <div class="glass-card-static p-6">
            <p class="text-sm text-slate-500">New Customers</p>
            <p class="text-2xl font-bold text-slate-800 mt-1">${stats.newCustomers || stats.new_customers || 0}</p>
        </div>
    `
}

function renderTopProducts(products) {
    document.getElementById('topProducts').innerHTML = products.map((p, i) => `
        <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">${i + 1}</span>
                <div>
                    <p class="font-medium text-slate-700">${p.name}</p>
                    <p class="text-sm text-slate-400">${p.units} sold</p>
                </div>
            </div>
            <span class="font-medium text-slate-700">${formatCurrency(p.revenue)}</span>
        </div>
    `).join('')
}

function renderCategories(categories) {
    document.getElementById('salesByCategory').innerHTML = categories.map(c => `
        <div class="space-y-1">
            <div class="flex justify-between text-sm">
                <span class="font-medium text-slate-700">${c.name}</span>
                <span class="text-slate-500">${formatCurrency(c.revenue)} (${c.percent}%)</span>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-[#FFDEE9] to-[#B5FFFC] rounded-full" style="width: ${c.percent}%"></div>
            </div>
        </div>
    `).join('')
}
