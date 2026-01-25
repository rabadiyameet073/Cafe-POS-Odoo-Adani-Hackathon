const DEMO_ORDER = {
    id: 'demo-1',
    order_number: 'ORD-12345',
    status: 'preparing',
    table_number: '5',
    items: [
        { id: '1', name: 'Margherita Pizza', quantity: 1, price: 450, kitchen_status: 'preparing' },
        { id: '2', name: 'Cappuccino', quantity: 2, price: 180, kitchen_status: 'completed' }
    ],
    subtotal: 810,
    tax_amount: 40.50,
    total_amount: 850.50,
    created_at: new Date(Date.now() - 600000).toISOString()
}

const STATUS_STEPS = [
    { key: 'confirmed', label: 'Order Confirmed', icon: 'check' },
    { key: 'sent_to_kitchen', label: 'Sent to Kitchen', icon: 'chef' },
    { key: 'preparing', label: 'Preparing', icon: 'clock' },
    { key: 'ready', label: 'Ready', icon: 'bell' },
    { key: 'completed', label: 'Completed', icon: 'package' }
]

document.addEventListener('DOMContentLoaded', async function () {
    await loadOrder()
})

async function loadOrder() {
    const loadingEl = document.getElementById('loadingState')
    const noOrderEl = document.getElementById('noOrder')
    const orderContentEl = document.getElementById('orderContent')

    let order = null
    try {
        order = await api.get('/orders/current')
    } catch (error) {
        order = DEMO_ORDER
    }

    loadingEl.classList.add('hidden')

    if (!order) {
        noOrderEl.classList.remove('hidden')
        return
    }

    orderContentEl.classList.remove('hidden')
    renderOrder(order)
}

function renderOrder(order) {
    document.getElementById('orderInfo').textContent = `Order #${order.order_number} • Table ${order.table_number}`

    renderTimeline(order.status)
    renderOrderItems(order)

    if (order.status === 'completed') {
        document.getElementById('estimatedTime').classList.add('hidden')
        document.getElementById('feedbackBtn').classList.remove('hidden')
    }
}

function renderTimeline(currentStatus) {
    const container = document.getElementById('statusTimeline')
    const statusOrder = ['confirmed', 'sent_to_kitchen', 'preparing', 'ready', 'completed']
    const currentIndex = statusOrder.indexOf(currentStatus)

    const icons = {
        check: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>',
        chef: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>',
        clock: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
        bell: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>',
        package: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>'
    }

    let html = '<div class="relative">'
    STATUS_STEPS.forEach((step, index) => {
        const isCompleted = index <= currentIndex
        const isCurrent = index === currentIndex

        html += `
            <div class="flex items-start gap-4 relative">
                ${index < STATUS_STEPS.length - 1 ? `
                    <div class="absolute left-5 top-10 w-0.5 h-12 ${index < currentIndex ? 'bg-emerald-400' : 'bg-slate-200'}"></div>
                ` : ''}
                <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${isCompleted ? 'bg-emerald-400 text-white' : 'bg-slate-100 text-slate-400'} ${isCurrent ? 'ring-4 ring-emerald-100 animate-pulse-subtle' : ''}">
                    <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icons[step.icon]}</svg>
                </div>
                <div class="pb-8 ${index === STATUS_STEPS.length - 1 ? 'pb-0' : ''}">
                    <p class="font-medium ${isCompleted ? 'text-slate-800' : 'text-slate-400'}">${step.label}</p>
                    ${isCurrent ? '<p class="text-sm text-emerald-600 mt-0.5">In progress...</p>' : ''}
                </div>
            </div>
        `
    })
    html += '</div>'
    container.innerHTML = html
}

function renderOrderItems(order) {
    const container = document.getElementById('orderItems')

    let itemsHtml = order.items.map(item => `
        <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">${item.quantity}</span>
                <span class="text-slate-700">${item.name}</span>
            </div>
            <div class="flex items-center gap-3">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${item.kitchen_status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
                    ${item.kitchen_status === 'completed' ? 'Ready' : 'Preparing'}
                </span>
                <span class="text-slate-600 font-medium">${formatCurrency(item.price * item.quantity)}</span>
            </div>
        </div>
    `).join('')

    container.innerHTML = `
        <h3 class="text-lg font-semibold text-slate-800 mb-4">Order Items</h3>
        <div class="space-y-3">${itemsHtml}</div>
        <div class="border-t border-slate-100 mt-4 pt-4">
            <div class="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>${formatCurrency(order.subtotal)}</span>
            </div>
            <div class="flex justify-between text-sm text-slate-600 mt-1">
                <span>Tax</span>
                <span>${formatCurrency(order.tax_amount)}</span>
            </div>
            <div class="flex justify-between font-bold text-slate-800 mt-2">
                <span>Total</span>
                <span>${formatCurrency(order.total_amount)}</span>
            </div>
        </div>
    `
}
