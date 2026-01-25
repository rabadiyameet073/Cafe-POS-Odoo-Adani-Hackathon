function initCustomerLayout() {
    const currentPath = window.location.pathname
    const user = null

    authService.getCurrentUser().then(userData => {
        if (!userData) {
            window.location.href = 'login.html'
            return
        }

        if (userData.role !== 'customer') {
            window.location.href = getDefaultRoute(userData.role)
            return
        }

        const userNameEl = document.getElementById('userName')
        if (userNameEl) {
            userNameEl.textContent = userData.full_name || 'Customer'
        }
    })

    const logoutBtn = document.getElementById('logoutBtn')
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            authService.logout()
        })
    }

    updateNavActive(currentPath)
    updateCartBadge()
}

function updateNavActive(currentPath) {
    const slug = (href) => (href || '').replace('.html', '')
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href')
        if (currentPath.includes(slug(href))) {
            link.classList.add('bg-slate-900', 'text-white')
            link.classList.remove('text-slate-600', 'hover:bg-white/50', 'hover:text-slate-900')
        } else {
            link.classList.remove('bg-slate-900', 'text-white')
            link.classList.add('text-slate-600', 'hover:bg-white/50', 'hover:text-slate-900')
        }
    })

    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        const href = link.getAttribute('href')
        if (currentPath.includes(slug(href))) {
            link.classList.add('text-slate-900')
            link.classList.remove('text-slate-400')
        } else {
            link.classList.remove('text-slate-900')
            link.classList.add('text-slate-400')
        }
    })
}

function getCartFromStorage() {
    const stored = localStorage.getItem('cart')
    if (stored) {
        return JSON.parse(stored)
    }
    return { items: [], subtotal: 0, tax: 0, total: 0 }
}

function saveCartToStorage(cart) {
    localStorage.setItem('cart', JSON.stringify(cart))
    updateCartBadge()
}

function updateCartBadge() {
    const cart = getCartFromStorage()
    const count = cart.items.reduce((sum, item) => sum + item.quantity, 0)

    document.querySelectorAll('.cart-badge').forEach(badge => {
        if (count > 0) {
            badge.textContent = count
            badge.classList.remove('hidden')
        } else {
            badge.classList.add('hidden')
        }
    })
}

function addToCart(product, variant = null, quantity = 1) {
    const cart = getCartFromStorage()
    const productId = product.id
    const variantId = variant?.id || null

    const existingIndex = cart.items.findIndex(
        item => item.productId === productId && item.variantId === variantId
    )

    if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += quantity
    } else {
        cart.items.push({
            productId,
            variantId,
            productName: product.name,
            variantName: variant?.name || null,
            unitPrice: product.price,
            variantPrice: variant?.price_modifier || 0,
            quantity
        })
    }

    recalculateCart(cart)
    saveCartToStorage(cart)
    return cart
}

function updateCartQuantity(productId, variantId, quantity) {
    const cart = getCartFromStorage()
    const index = cart.items.findIndex(
        item => item.productId === productId && item.variantId === variantId
    )

    if (index >= 0) {
        if (quantity <= 0) {
            cart.items.splice(index, 1)
        } else {
            cart.items[index].quantity = quantity
        }
    }

    recalculateCart(cart)
    saveCartToStorage(cart)
    return cart
}

function removeFromCart(productId, variantId) {
    return updateCartQuantity(productId, variantId, 0)
}

function clearCart() {
    const cart = { items: [], subtotal: 0, tax: 0, total: 0 }
    saveCartToStorage(cart)
    return cart
}

function recalculateCart(cart) {
    cart.subtotal = cart.items.reduce((sum, item) => {
        return sum + (item.unitPrice + (item.variantPrice || 0)) * item.quantity
    }, 0)
    cart.tax = Math.round(cart.subtotal * 0.05 * 100) / 100
    cart.total = Math.round((cart.subtotal + cart.tax) * 100) / 100
    cart.subtotal = Math.round(cart.subtotal * 100) / 100
}

document.addEventListener('DOMContentLoaded', initCustomerLayout)
