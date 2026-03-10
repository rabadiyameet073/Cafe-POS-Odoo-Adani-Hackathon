let paymentMethods = []

document.addEventListener('DOMContentLoaded', async function () {
    const selectedTable = JSON.parse(localStorage.getItem('selectedTable') || '{}')
    if (selectedTable.number) {
        // Table info is valid
    } else {
        Toast.warning('Please select a table first')
        setTimeout(() => {
            window.location.href = 'customer-floors.html'
        }, 1500)
        return
    }

    renderOrderSummary()
    await loadPaymentMethods()
    setupEventListeners()
})

async function loadPaymentMethods() {
    try {
        const response = await api.get('/payments/methods/enabled')
        paymentMethods = response.data.methods || []
    } catch (error) {
        console.error('Failed to load payment methods', error)
        Toast.error('Failed to load payment methods')
    }
}

function renderOrderSummary() {
    const cart = getCartFromStorage()

    if (cart.items.length === 0) {
        window.location.href = 'customer-cart.html'
        return
    }

    document.getElementById('subtotal').textContent = formatCurrency(cart.subtotal)
    document.getElementById('tax').textContent = formatCurrency(cart.tax)
    document.getElementById('total').textContent = formatCurrency(cart.total)
}

function setupEventListeners() {
    document.getElementById('confirmPaymentBtn').addEventListener('click', async function () {
        const cart = getCartFromStorage()
        const selectedTable = JSON.parse(localStorage.getItem('selectedTable') || '{}')
        const paymentRadio = document.querySelector('input[name="payment"]:checked')

        if (!paymentRadio) {
            Toast.warning('Please select a payment method')
            return
        }

        const paymentMethodName = paymentRadio.value

        if (cart.items.length === 0) {
            Toast.warning('Your cart is empty')
            return
        }

        Loading.showButton(this)

        try {
            // 1. Create Order
            const orderData = {
                table_id: selectedTable.id || null,
                items: cart.items.map(item => ({
                    product_id: item.productId,
                    variant_id: item.variantId,
                    quantity: item.quantity,
                    notes: '' // Add notes if needed
                })),
                special_instructions: ''
            }

            const orderResponse = await api.post('/orders', orderData)
            const orderId = orderResponse.data.order.id

            const paymentMethod = paymentMethods.find(m => m.name === paymentMethodName)
            if (!paymentMethod) {
                throw new Error('Invalid payment method')
            }

            const paymentData = {
                order_id: orderId,
                payment_method_id: paymentMethod.id,
                amount: cart.total
            }

            const paymentResponse = await api.post('/payments', paymentData)

            if (paymentMethodName === 'upi_qr' && paymentResponse.data.qr_code) {
                showQRModal(paymentResponse.data, orderId)
                Loading.hideButton(this)
            } else {
                handleSuccess(orderId)
            }

        } catch (error) {
            console.error(error)
            Toast.error(error.message || 'Failed to place order')
            Loading.hideButton(this)
        }
    })
}

function showQRModal(data, orderId) {
    const content = `
        <div class="text-center">
            <div class="mb-4 flex justifying-center">
                <img src="${data.qr_code}" alt="Payment QR Code" class="mx-auto w-64 h-64 object-contain border rounded-lg shadow-sm">
            </div>
            <p class="font-bold text-lg mb-2">Scan to Pay: ${formatCurrency(data.payment.amount)}</p>
            <p class="text-sm text-slate-500 mb-4 break-all select-all bg-slate-50 p-2 rounded">${data.upi_string}</p>
            <div class="flex gap-2 justify-center">
                <button onclick="checkPaymentStatus('${orderId}')" class="btn-primary w-full max-w-xs">I have made the payment</button>
            </div>
        </div>
    `

    Modal.open(content, {
        title: 'Scan QR Code',
        size: 'md',
        onClose: () => {
        }
    })
}

// Function to attach to window so onclick works
window.checkPaymentStatus = function (orderId) {
    handleSuccess(orderId)
    Modal.close()
}

function handleSuccess(orderId) {
    clearCart()
    localStorage.removeItem('selectedTable')
    if (orderId) {
        localStorage.setItem('pendingFeedbackOrderId', orderId)
    }
    Toast.success('Order placed successfully!')
    setTimeout(() => {
        window.location.href = 'customer-feedback.html'
    }, 500)
}
