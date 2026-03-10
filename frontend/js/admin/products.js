const DEMO_PRODUCTS = [
    { id: 'p1', name: 'Margherita Pizza', description: 'Classic pizza with tomato and mozzarella', category_id: 'c1', category_name: 'Pizzas', price: 450, is_available: true },
    { id: 'p2', name: 'Cappuccino', description: 'Espresso with steamed milk foam', category_id: 'c2', category_name: 'Beverages', price: 180, is_available: true },
    { id: 'p3', name: 'Tiramisu', description: 'Italian coffee-flavored dessert', category_id: 'c3', category_name: 'Desserts', price: 280, is_available: true },
    { id: 'p4', name: 'Garlic Bread', description: 'Toasted bread with garlic butter', category_id: 'c4', category_name: 'Starters', price: 120, is_available: false },
    { id: 'p5', name: 'Caesar Salad', description: 'Fresh romaine lettuce with caesar dressing', category_id: 'c5', category_name: 'Salads', price: 200, is_available: true }
]

const DEMO_CATEGORIES = [
    { id: 'c1', name: 'Pizzas' },
    { id: 'c2', name: 'Beverages' },
    { id: 'c3', name: 'Desserts' },
    { id: 'c4', name: 'Starters' },
    { id: 'c5', name: 'Salads' }
]

let products = []
let categories = []
let searchQuery = ''
let selectedCategory = 'all'
let editingProduct = null

document.addEventListener('DOMContentLoaded', function () {
    loadData()
    setupEventListeners()
})

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', function (e) {
        searchQuery = e.target.value.toLowerCase()
        renderProducts()
    })

    document.getElementById('categoryFilter').addEventListener('change', function (e) {
        selectedCategory = e.target.value
        renderProducts()
    })

    document.getElementById('saveProductBtn').addEventListener('click', handleSave)
}

async function loadData() {
    try {
        [products, categories] = await Promise.all([
            api.get('/products'),
            api.get('/categories')
        ])
    } catch (error) {
        products = DEMO_PRODUCTS
        categories = DEMO_CATEGORIES
    }

    renderCategories()
    renderProducts()
}

function renderCategories() {
    const filterEl = document.getElementById('categoryFilter')
    const modalEl = document.getElementById('productCategory')

    filterEl.innerHTML = '<option value="all">All Categories</option>' +
        categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')

    modalEl.innerHTML = '<option value="">Select category</option>' +
        categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
}

function renderProducts() {
    const filtered = products.filter(product => {
        const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory
        const matchesSearch = product.name.toLowerCase().includes(searchQuery)
        return matchesCategory && matchesSearch
    })

    const gridEl = document.getElementById('productsGrid')
    const emptyEl = document.getElementById('emptyState')

    if (filtered.length === 0) {
        gridEl.innerHTML = ''
        emptyEl.classList.remove('hidden')
        return
    }

    emptyEl.classList.add('hidden')
    gridEl.innerHTML = filtered.map(product => `
        <div class="glass-card-static p-4">
            <div class="flex items-start gap-4">
                <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4"></path></svg>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between">
                        <div>
                            <h3 class="font-semibold text-slate-800 truncate">${product.name}</h3>
                            <p class="text-sm text-slate-500">${product.category_name}</p>
                        </div>
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${product.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
                            ${product.is_available ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <p class="text-lg font-bold text-slate-800 mt-2">${formatCurrency(product.price)}</p>
                </div>
            </div>
            <div class="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button onclick="openEditModal('${product.id}')" class="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    Edit
                </button>
                <button onclick="deleteProduct('${product.id}')" class="text-slate-500 hover:text-red-600 text-sm py-1.5 px-3 flex items-center gap-1 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    Delete
                </button>
            </div>
        </div>
    `).join('')
}

function openAddModal() {
    editingProduct = null
    document.getElementById('modalTitle').textContent = 'Add Product'
    document.getElementById('saveProductBtn').textContent = 'Create Product'
    document.getElementById('productName').value = ''
    document.getElementById('productCategory').value = ''
    document.getElementById('productPrice').value = ''
    document.getElementById('productDescription').value = ''
    document.getElementById('productAvailable').checked = true
    document.getElementById('productModal').classList.remove('hidden')
}

function openEditModal(productId) {
    const product = products.find(p => p.id === productId)
    if (!product) return

    editingProduct = product
    document.getElementById('modalTitle').textContent = 'Edit Product'
    document.getElementById('saveProductBtn').textContent = 'Update Product'
    document.getElementById('productName').value = product.name
    document.getElementById('productCategory').value = product.category_id
    document.getElementById('productPrice').value = product.price
    document.getElementById('productDescription').value = product.description || ''
    document.getElementById('productAvailable').checked = product.is_available
    document.getElementById('productModal').classList.remove('hidden')
}

function closeModal() {
    document.getElementById('productModal').classList.add('hidden')
    editingProduct = null
}

async function handleSave() {
    const name = document.getElementById('productName').value.trim()
    const category_id = document.getElementById('productCategory').value
    const price = parseFloat(document.getElementById('productPrice').value)
    const description = document.getElementById('productDescription').value.trim()
    const is_available = document.getElementById('productAvailable').checked

    if (!name || !category_id || !price) {
        Toast.warning('Please fill in all required fields')
        return
    }

    const data = { name, category_id, price, description, is_available }

    try {
        if (editingProduct) {
            await api.put(`/products/${editingProduct.id}`, data)
            Toast.success('Product updated successfully')
        } else {
            await api.post('/products', data)
            Toast.success('Product created successfully')
        }
        closeModal()
        loadData()
    } catch (error) {
        const category = categories.find(c => c.id === category_id)
        if (editingProduct) {
            Object.assign(editingProduct, data, { category_name: category?.name })
        } else {
            products.push({ id: 'p' + Date.now(), ...data, category_name: category?.name })
        }
        Toast.success(editingProduct ? 'Product updated' : 'Product created')
        closeModal()
        renderProducts()
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
        await api.delete(`/products/${productId}`)
        Toast.success('Product deleted')
        loadData()
    } catch (error) {
        products = products.filter(p => p.id !== productId)
        Toast.success('Product deleted')
        renderProducts()
    }
}
