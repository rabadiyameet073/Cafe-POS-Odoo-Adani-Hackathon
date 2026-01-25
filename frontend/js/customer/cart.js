document.addEventListener('DOMContentLoaded', function () {
    renderCart()
    setupEventListeners()
})

function setupEventListeners() {
    document.getElementById('clearCartBtn').addEventListener('click', function () {
        clearCart()
        renderCart()
        Toast.success('Cart cleared')
    })

    document.getElementById('proceedPaymentBtn').addEventListener('click', function () {
        const cart = getCartFromStorage()
        if (cart.items.length === 0) {
            Toast.warning('Your cart is empty')
            return
        }
        window.location.href = 'customer-payment.html'
    })
}

function renderCart() {
    const cart = getCartFromStorage()
    const emptyCartEl = document.getElementById('emptyCart')
    const cartContentEl = document.getElementById('cartContent')
    const cartItemsEl = document.getElementById('cartItems')
    const itemCountEl = document.getElementById('itemCount')
    const subtotalEl = document.getElementById('subtotal')
    const taxEl = document.getElementById('tax')
    const totalEl = document.getElementById('total')

    if (cart.items.length === 0) {
        emptyCartEl.classList.remove('hidden')
        cartContentEl.classList.add('hidden')
        return
    }

    emptyCartEl.classList.add('hidden')
    cartContentEl.classList.remove('hidden')

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0)
    itemCountEl.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`

    subtotalEl.textContent = formatCurrency(cart.subtotal)
    taxEl.textContent = formatCurrency(cart.tax)
    totalEl.textContent = formatCurrency(cart.total)

    cartItemsEl.innerHTML = cart.items.map(item => `
        <div class="glass-card-static p-4 flex gap-4">
            <div class="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-slate-800 truncate">${item.productName}</h3>
                ${item.variantName ? `<p class="text-sm text-slate-500">${item.variantName}</p>` : ''}
                <p class="text-sm font-medium text-slate-700 mt-1">${formatCurrency(item.unitPrice + (item.variantPrice || 0))}</p>
            </div>
            <div class="flex flex-col items-end gap-2">
                <button onclick="handleRemoveItem('${item.productId}', ${item.variantId ? `'${item.variantId}'` : 'null'})" class="text-slate-400 hover:text-red-500 transition-colors">
                    <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                <div class="flex items-center gap-2">
                    <button onclick="handleUpdateQty('${item.productId}', ${item.variantId ? `'${item.variantId}'` : 'null'}, ${item.quantity - 1})" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                    </button>
                    <span class="w-8 text-center font-medium">${item.quantity}</span>
                    <button onclick="handleUpdateQty('${item.productId}', ${item.variantId ? `'${item.variantId}'` : 'null'}, ${item.quantity + 1})" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    </button>
                </div>
                <span class="font-semibold text-slate-800">${formatCurrency((item.unitPrice + (item.variantPrice || 0)) * item.quantity)}</span>
            </div>
        </div>
    `).join('')
}

function handleUpdateQty(productId, variantId, newQty) {
    updateCartQuantity(productId, variantId, newQty)
    renderCart()
}

function handleRemoveItem(productId, variantId) {
    removeFromCart(productId, variantId)
    renderCart()
    Toast.success('Item removed from cart')
}
