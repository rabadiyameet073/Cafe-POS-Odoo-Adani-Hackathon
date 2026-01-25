let products = []
let categories = []
let selectedCategory = 'all'
let searchQuery = ''
let quantities = {}

document.addEventListener('DOMContentLoaded', async function () {
    const selectedTable = JSON.parse(localStorage.getItem('selectedTable') || '{}')
    if (selectedTable.number) {
        document.getElementById('tableInfo').textContent = `Table ${selectedTable.number}`
    } else {
        Toast.warning('Please select a table first')
        setTimeout(() => {
            window.location.href = 'customer-floors.html'
        }, 1500)
        return
    }

    await loadData()
    setupEventListeners()
})

async function loadData() {
    const loadingEl = document.getElementById('loadingState')
    const menuContent = document.getElementById('menuContent')

    try {
        const [productsResponse, categoriesResponse] = await Promise.all([
            api.get('/products'),
            api.get('/categories')
        ])
        products = productsResponse.data.products || []
        categories = categoriesResponse.data.categories || []

        products = products.filter(p => p.is_active && p.is_available)

        loadingEl.classList.add('hidden')
        menuContent.classList.remove('hidden')

        products.forEach(p => { quantities[p.id] = 1 })

        renderCategories()
        renderProducts()
    } catch (error) {
        console.error(error)
        Toast.error('Failed to load menu data')
        loadingEl.classList.add('hidden')
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput')
    searchInput.addEventListener('input', function (e) {
        searchQuery = e.target.value.toLowerCase()
        renderProducts()
    })
}

function renderCategories() {
    const container = document.getElementById('categoryFilter')

    let html = `
        <button onclick="selectCategory('all')" class="category-btn px-4 py-2 rounded-full whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-white/60 text-slate-600 hover:bg-white/80'}">
            All Items
        </button>
    `

    categories.forEach(cat => {
        const isActive = String(selectedCategory) === String(cat.id)
        html += `
            <button onclick="selectCategory('${cat.id}')" class="category-btn px-4 py-2 rounded-full whitespace-nowrap transition-all ${isActive ? 'bg-slate-900 text-white' : 'bg-white/60 text-slate-600 hover:bg-white/80'}">
                ${cat.name}
            </button>
        `
    })

    container.innerHTML = html
}

function selectCategory(categoryId) {
    selectedCategory = String(categoryId)
    renderCategories()
    renderProducts()
}

function renderProducts() {
    const container = document.getElementById('productsContainer')
    const emptyState = document.getElementById('emptyState')

    const filtered = products.filter(p => {
        let matchesCategory = true
        if (selectedCategory !== 'all') {
            const productCategoryId = String(p.category_id || p.product_categories?.id || '')
            matchesCategory = productCategoryId === String(selectedCategory)
        }
        const matchesSearch = p.name.toLowerCase().includes(searchQuery)
        return matchesCategory && matchesSearch && p.is_active && p.is_available
    })

    if (filtered.length === 0) {
        container.innerHTML = ''
        emptyState.classList.remove('hidden')
        return
    }

    emptyState.classList.add('hidden')

    const grouped = filtered.reduce((groups, product) => {
        const category = product.product_categories?.name || 'Other'
        if (!groups[category]) groups[category] = []
        groups[category].push(product)
        return groups
    }, {})

    let html = ''
    Object.entries(grouped).forEach(([category, items]) => {
        html += `
            <div>
                <h2 class="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    ${category}
                </h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    ${items.map(product => renderProductCard(product)).join('')}
                </div>
            </div>
        `
    })

    container.innerHTML = html
}

function renderProductCard(product) {
    const qty = quantities[product.id] || 1
    return `
        <div class="glass-card-static overflow-hidden">
            <div class="h-32 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-slate-800">${product.name}</h3>
                <p class="text-sm text-slate-500 line-clamp-2 mt-1">${product.description || 'Delicious item from our kitchen'}</p>
                <div class="flex items-center justify-between mt-4">
                    <span class="text-lg font-bold text-slate-800">${formatCurrency(product.price)}</span>
                    <div class="flex items-center gap-2">
                        <button onclick="updateQuantity('${product.id}', -1)" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                        </button>
                        <span id="qty-${product.id}" class="w-8 text-center font-medium">${qty}</span>
                        <button onclick="updateQuantity('${product.id}', 1)" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                    </div>
                </div>
                <button onclick="handleAddToCart('${product.id}')" class="btn-primary w-full mt-3 flex items-center justify-center gap-2 text-sm py-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    Add to Cart
                </button>
            </div>
        </div>
    `
}

function updateQuantity(productId, delta) {
    quantities[productId] = Math.max(1, (quantities[productId] || 1) + delta)
    const qtyEl = document.getElementById(`qty-${productId}`)
    if (qtyEl) qtyEl.textContent = quantities[productId]
}

function handleAddToCart(productId) {
    const product = products.find(p => p.id === productId)
    if (!product) return

    const qty = quantities[productId] || 1
    addToCart(product, null, qty)
    Toast.success(`Added ${qty}x ${product.name} to cart`)
    quantities[productId] = 1
    const qtyEl = document.getElementById(`qty-${productId}`)
    if (qtyEl) qtyEl.textContent = 1
}
