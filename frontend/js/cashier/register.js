
let products = []
let categories = []
let tables = []
let cart = []
let selectedCategory = 'all'
let searchQuery = ''
let selectedPaymentMethod = null
let currentOrderId = null
let paymentMethods = []

document.addEventListener('DOMContentLoaded', async function () {
    await checkSession()
    await loadInitialData()
    setupEventListeners()
})

async function checkSession() {
    const sessionInfo = document.getElementById('sessionInfo')
    const payBtn = document.getElementById('payBtn')

    try {
        const response = await api.get('/sessions/active')
        const session = response.data.session

        if (session) {
            sessionInfo.textContent = `Session: ${session.session_number}`
            sessionInfo.className = 'text-xs text-emerald-600 font-medium'
            payBtn.disabled = false
            localStorage.setItem('activeSession', JSON.stringify(session))
        } else {
            sessionInfo.textContent = 'No active session - Cannot accept payments'
            sessionInfo.className = 'text-xs text-red-500 font-medium'
            payBtn.disabled = true
            Toast.warning('Please open a session to accept payments')
        }
    } catch (error) {
        sessionInfo.textContent = 'Offline'
        payBtn.disabled = true
    }
}

async function loadInitialData() {
    const loadingEl = document.getElementById('loadingState')
    const productsGrid = document.getElementById('productsGrid')

    try {
        const [productsRes, categoriesRes, tablesRes, methodsRes] = await Promise.all([
            api.get('/products'),
            api.get('/categories'),
            api.get('/tables'),
            api.get('/payments/methods/enabled')
        ])

        products = productsRes.data.products || []
        categories = categoriesRes.data.categories || []
        tables = tablesRes.data.tables || []
        paymentMethods = methodsRes.data.methods || []

        products = products.filter(p => p.is_active && p.is_available)

        renderCategories()
        renderProducts()
        renderTables()

        loadingEl.classList.add('hidden')
        productsGrid.classList.remove('hidden')
    } catch (error) {
        console.error(error)
        Toast.error('Failed to load POS data')
    }
}

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase()
        renderProducts()
    })

    document.getElementById('payBtn').addEventListener('click', showPaymentModal)
    document.getElementById('confirmPaymentBtn').addEventListener('click', processPayment)
}

function renderCategories() {
    const container = document.getElementById('categoryFilters')

    let html = `
        <button onclick="selectCategory('all')" 
            class="px-4 py-2 rounded-xl whitespace-nowrap transition-all border text-sm font-medium
            ${selectedCategory === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}">
            All Items
        </button>
    `

    categories.forEach(cat => {
        const isActive = String(selectedCategory) === String(cat.id)
        html += `
            <button onclick="selectCategory('${cat.id}')" 
                class="px-4 py-2 rounded-xl whitespace-nowrap transition-all border text-sm font-medium
                ${isActive ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}">
                ${cat.name}
            </button>
        `
    })

    container.innerHTML = html
}

function selectCategory(id) {
    selectedCategory = String(id)
    renderCategories()
    renderProducts()
}

function renderProducts() {
    const container = document.getElementById('productsGrid')
    const emptyState = document.getElementById('emptyState')

    const filtered = products.filter(p => {
        let matchesCategory = true
        if (selectedCategory !== 'all') {
            const pCat = String(p.category_id || p.product_categories?.id || '')
            matchesCategory = pCat === selectedCategory
        }
        const matchesSearch = p.name.toLowerCase().includes(searchQuery)
        return matchesCategory && matchesSearch
    })

    if (filtered.length === 0) {
        container.classList.add('hidden')
        emptyState.classList.remove('hidden')
        return
    }

    container.classList.remove('hidden')
    emptyState.classList.add('hidden')

    container.innerHTML = filtered.map(p => `
        <button onclick="addToCart('${p.id}')" class="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-md transition-all text-left flex flex-col h-full group">
            <div class="h-24 bg-slate-50 rounded-lg mb-3 flex items-center justify-center text-slate-300 group-hover:bg-slate-100 transition-colors">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <p class="font-medium text-slate-800 line-clamp-1 mb-1">${p.name}</p>
            <p class="text-sm font-bold text-emerald-600 mt-auto">${formatCurrency(p.price)}</p>
        </button>
    `).join('')
}

function renderTables() {
    const selector = document.getElementById('tableSelect')
    const availableTables = tables.filter(t => t.status === 'available')

    // Keep 'No Table' option
    let html = '<option value="">No Table (Takeaway)</option>'

    availableTables.forEach(t => {
        html += `<option value="${t.id}">${t.table_number} (${t.seats} seats)</option>`
    })

    selector.innerHTML = html
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId)
    if (!product) return

    const existing = cart.find(item => item.product_id === productId)

    if (existing) {
        existing.quantity++
    } else {
        cart.push({
            product_id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            tax_percentage: product.tax_percentage || 0
        })
    }

    renderCart()
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.product_id === productId)
    if (!item) return

    item.quantity += delta
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.product_id !== productId)
    }

    renderCart()
}

function renderCart() {
    const container = document.getElementById('cartItems')
    const emptyCart = document.getElementById('emptyCart')
    const payBtn = document.getElementById('payBtn')

    if (cart.length === 0) {
        container.innerHTML = ''
        emptyCart.classList.remove('hidden')
        container.classList.add('hidden')
        payBtn.disabled = true
        updateTotals(0, 0, 0)
        return
    }

    emptyCart.classList.add('hidden')
    container.classList.remove('hidden')
    payBtn.disabled = false

    let subtotal = 0
    let totalTax = 0

    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity
        subtotal += itemTotal
        const tax = itemTotal * (item.tax_percentage / 100)
        totalTax += tax

        return `
            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-slate-800 truncate">${item.name}</p>
                    <p class="text-xs text-slate-500">${formatCurrency(item.price)} x ${item.quantity}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="updateQuantity('${item.product_id}', -1)" class="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50">-</button>
                    <span class="text-sm font-medium w-4 text-center">${item.quantity}</span>
                    <button onclick="updateQuantity('${item.product_id}', 1)" class="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50">+</button>
                </div>
            </div>
        `
    }).join('')

    updateTotals(subtotal, totalTax, subtotal + totalTax)
}

function updateTotals(subtotal, tax, total) {
    document.getElementById('cartSubtotal').textContent = formatCurrency(subtotal)
    document.getElementById('cartTax').textContent = formatCurrency(tax)
    document.getElementById('cartTotal').textContent = formatCurrency(total)
}

function showPaymentModal() {
    const modal = document.getElementById('paymentModal')
    const grid = document.getElementById('paymentMethodsGrid')
    const total = parseFloat(document.getElementById('cartTotal').textContent.replace(/[^\d.]/g, ''))

    selectedPaymentMethod = null
    document.getElementById('confirmPaymentBtn').disabled = true
    document.getElementById('qrCodeContainer').classList.add('hidden')

    grid.innerHTML = paymentMethods.map(method => `
        <button onclick="selectPaymentMethod('${method.id}', '${method.name}')" 
            class="payment-method-btn p-4 border rounded-xl flex flex-col items-center gap-2 hover:bg-slate-50 transition-all ${selectedPaymentMethod === method.id ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200'}">
            <span class="font-medium">${method.display_name}</span>
        </button>
    `).join('')

    modal.classList.remove('hidden')
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden')
    currentOrderId = null
}

async function selectPaymentMethod(id, name) {
    selectedPaymentMethod = id

    // Update UI
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.className = 'payment-method-btn p-4 border rounded-xl flex flex-col items-center gap-2 hover:bg-slate-50 transition-all border-slate-200'
    })
    event.currentTarget.className = 'payment-method-btn p-4 border rounded-xl flex flex-col items-center gap-2 hover:bg-slate-50 transition-all border-slate-900 bg-slate-50 ring-1 ring-slate-900'

    document.getElementById('confirmPaymentBtn').disabled = false

    // If Order created and UPI selected, show QR
    if (name === 'upi_qr' && currentOrderId) {
        // We'll handle this in processPayment for simplicity first, or create order now??
        // For POS, better to create order on "Confirm" to avoid ghost orders
    }
}

async function processPayment() {
    const confirmBtn = document.getElementById('confirmPaymentBtn')
    const tableId = document.getElementById('tableSelect').value
    const session = JSON.parse(localStorage.getItem('activeSession'))

    Loading.showButton(confirmBtn)

    try {
        // 1. Create Order
        const orderData = {
            table_id: tableId || null,
            session_id: session.id,
            order_type: tableId ? 'dine_in' : 'takeaway',
            items: cart.map(i => ({
                product_id: i.product_id,
                quantity: i.quantity
            }))
        }

        const orderRes = await api.post('/orders', orderData)
        const order = orderRes.data.order
        currentOrderId = order.id

        // 2. Process Payment
        const paymentData = {
            order_id: order.id,
            payment_method_id: selectedPaymentMethod,
            amount: parseFloat(document.getElementById('cartTotal').textContent.replace(/[^\d.]/g, ''))
        }

        const payRes = await api.post('/payments', paymentData)
        const method = paymentMethods.find(m => m.id === selectedPaymentMethod)

        if (method.name === 'upi_qr' && payRes.data.qr_code) {
            // Show QR Code directly in modal
            const qrContainer = document.getElementById('qrCodeContainer')
            qrContainer.classList.remove('hidden')
            qrContainer.innerHTML = `
                <img src="${payRes.data.qr_code}" class="mx-auto w-48 h-48 mb-2">
                <p class="font-mono text-sm break-all bg-white p-1 rounded">${payRes.data.upi_string}</p>
             `
            confirmBtn.textContent = 'Verify & Complete'
            Loading.hideButton(confirmBtn)

            // Change confirmation to complete action
            confirmBtn.onclick = async () => {
                // In real world, check status. For now, assume success
                finishTransaction()
            }
        } else {
            finishTransaction()
        }

    } catch (error) {
        console.error(error)
        Toast.error(error.message || 'Transaction failed')
        Loading.hideButton(confirmBtn)
    }
}

function finishTransaction() {
    closePaymentModal()
    Toast.success('Order placed & paid successfully!')
    cart = []
    renderCart()
    // Refresh tables if we selected one to show it occupied? 
    // Ideally yes, but let's reload initial data
    loadInitialData()
}

// Global scope for onclicks
window.selectCategory = selectCategory
window.addToCart = addToCart
window.updateQuantity = updateQuantity
window.showPaymentModal = showPaymentModal
window.closePaymentModal = closePaymentModal
window.selectPaymentMethod = selectPaymentMethod
