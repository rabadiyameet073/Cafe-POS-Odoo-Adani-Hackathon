import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import Icon from '../../components/Icons'
import { showToast } from '../../components/Toast'

const Cart = () => {
  const [cart, setCart] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const token = sessionStorage.getItem('table_token')
    if (!token) {
      sessionStorage.setItem('_toast', 'Please select a table before ordering.')
      navigate('/customer/select-floor', { replace: true })
      return
    }
    loadCart()
  }, [])

  const loadCart = () => {
    const saved = sessionStorage.getItem('cafe_cart')
    if (saved) setCart(JSON.parse(saved))
  }

  const saveCart = (newCart) => {
    sessionStorage.setItem('cafe_cart', JSON.stringify(newCart))
    setCart(newCart)
  }

  const updateQty = (productId, change) => {
    const newCart = cart.map(i => {
      if (i.product_id === productId) {
        const newQ = i.quantity + change
        return newQ > 0 ? { ...i, quantity: newQ } : null
      }
      return i
    }).filter(Boolean)
    saveCart(newCart)
  }

  const removeItem = (productId) => {
    saveCart(cart.filter(i => i.product_id !== productId))
    showToast('Item removed')
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const tax = subtotal * 0.05
  const total = subtotal + tax
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0)

  const tableNumber = sessionStorage.getItem('table_number')

  return (
    <CustomerLayout>
      <div className="animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 sm:mb-7">
          <div>
            <h1 className="page-title">Your Cart</h1>
            <p className="page-subtitle">Table {tableNumber || 'N/A'}</p>
          </div>
          <button
            onClick={() => navigate('/customer/browse-menu')}
            className="btn-secondary px-4 py-2 rounded-xl text-sm self-start sm:self-auto"
          >
            ← Continue Shopping
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-20 section-card p-12">
            <div className="text-6xl mb-5">🛒</div>
            <p className="text-lg font-medium mb-6" style={{ color: 'var(--text-muted)' }}>Your cart is empty</p>
            <button
              onClick={() => navigate('/customer/browse-menu')}
              className="btn-primary px-6 py-3 rounded-xl"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-3 space-y-3">
              {cart.map(item => (
                <div key={item.product_id} className="section-card p-3 sm:p-4 flex gap-3 sm:gap-4">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none' }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</h3>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--accent-primary)' }}>₹{item.price} each</p>
                    <div className="flex items-center gap-2 sm:gap-3 mt-2">
                      <button
                        onClick={() => updateQty(item.product_id, -1)}
                        className="w-8 h-8 rounded-full font-bold flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                      >−</button>
                      <span className="font-bold text-base min-w-[22px] text-center" style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.product_id, 1)}
                        className="w-8 h-8 rounded-full font-bold flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: 'var(--accent-primary)', color: 'var(--on-accent-text)' }}
                      >+</button>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end justify-between ml-1 flex-shrink-0">
                    <p className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>₹{(item.price * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-sm font-semibold transition-all hover:scale-105"
                      style={{ color: 'var(--accent-rose)' }}
                    >Remove</button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => saveCart([])}
                className="w-full py-2 text-sm font-semibold transition-all hover:opacity-70"
                style={{ color: 'var(--accent-rose)' }}
              >
                Clear All
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="section-card p-5 sm:p-6 sticky top-20 space-y-4 sm:space-y-5">
                <h2 className="section-title">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                    <span>Items ({itemCount})</span><span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                    <span>Tax (5%)</span><span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--accent-primary)' }}>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/customer/checkout')}
                  className="btn-primary w-full py-3 rounded-xl text-base"
                >
                  Proceed to Payment →
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </CustomerLayout>
  )
}

export default Cart