import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cartService } from '../../services/api.service'
import Loading from '../Loading'
import Toast from '../Toast'

const Cart = () => {
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()
  const TAX_RATE = 0.05

  useEffect(() => { validateAndLoadCart() }, [])

  const validateAndLoadCart = async () => {
    const tableToken = sessionStorage.getItem('table_token')
    if (!tableToken) {
      showToast('No valid table token found. Please select a table.', 'error')
      sessionStorage.removeItem('cart')
      setTimeout(() => navigate('/customer/select-floor'), 2000)
      return
    }
    try {
      setLoading(true)
      const response = await cartService.getCartByToken(tableToken)
      const items = response.data.items || []
      const mapped = items.map(item => ({
        cart_item_id: item.id,
        product_id: item.product_id,
        name: item.product_name,
        price: item.unit_price,
        image_url: item.product_image,
        quantity: item.quantity
      }))
      sessionStorage.setItem('cart', JSON.stringify(mapped))
      setCart(mapped)
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        showToast('Session expired. Please select a table again.', 'error')
        sessionStorage.removeItem('cart')
        sessionStorage.removeItem('table_token')
        sessionStorage.removeItem('table_number')
        setTimeout(() => navigate('/customer/select-floor'), 2000)
      } else {
        showToast(error.message || 'Failed to load cart', 'error')
        setCart([])
      }
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const updateQuantity = async (productId, change) => {
    const tableToken = sessionStorage.getItem('table_token')
    if (!tableToken) return
    const existingItem = cart.find(item => item.product_id === productId)
    if (!existingItem) return
    try {
      setLoading(true)
      if (existingItem.quantity + change <= 0) {
        if (existingItem.cart_item_id) {
          await cartService.removeItem(tableToken, existingItem.cart_item_id)
        }
      } else {
        await cartService.addToCart({ table_token: tableToken, product_id: productId, quantity: change })
      }
      await validateAndLoadCart()
    } catch (error) {
      showToast(error.message || 'Failed to update cart', 'error')
      setLoading(false)
    }
  }

  const removeItem = async (productId) => {
    const tableToken = sessionStorage.getItem('table_token')
    if (!tableToken) return
    const existingItem = cart.find(item => item.product_id === productId)
    if (!existingItem) return
    try {
      setLoading(true)
      if (existingItem.cart_item_id) {
        await cartService.removeItem(tableToken, existingItem.cart_item_id)
      }
      await validateAndLoadCart()
      showToast('Item removed from cart')
    } catch (error) {
      showToast(error.message || 'Failed to remove item', 'error')
      setLoading(false)
    }
  }

  const clearCart = async () => {
    const tableToken = sessionStorage.getItem('table_token')
    if (!tableToken) {
      setCart([])
      return
    }
    try {
      setLoading(true)
      await cartService.clearCart(tableToken)
      setCart([])
      showToast('Cart cleared')
    } catch (error) {
      showToast(error.message || 'Failed to clear cart', 'error')
    } finally {
      setLoading(false)
    }
  }

  const calculateSubtotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const calculateTax = () => calculateSubtotal() * TAX_RATE
  const calculateTotal = () => calculateSubtotal() + calculateTax()

  const proceedToCheckout = () => {
    const tableToken = sessionStorage.getItem('table_token')
    if (!tableToken) {
      showToast('Table token is invalid. Redirecting...', 'error')
      sessionStorage.removeItem('cart')
      setTimeout(() => navigate('/customer/select-floor'), 2000)
      return
    }
    if (cart.length === 0) {
      showToast('Your cart is empty', 'error')
      return
    }
    navigate('/customer/checkout')
  }

  const continueShopping = () => navigate('/customer/browse-menu')
  const getTableInfo = () => sessionStorage.getItem('table_number') ? `Table ${sessionStorage.getItem('table_number')}` : 'No table selected'

  if (loading) return <Loading />

  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Your Cart</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{getTableInfo()}</p>
        </div>
        <button
          onClick={continueShopping}
          className="px-4 py-2 rounded-xl transition-all hover:scale-105"
          style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
        >
          ← Continue Shopping
        </button>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <svg className="w-12 h-12" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-lg mb-6" style={{ color: 'var(--text-muted)' }}>Your cart is empty</p>
          <button onClick={continueShopping} className="px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105" style={{ background: 'var(--accent-primary)', color: '#000000', boxShadow: '0 4px 20px rgba(0, 217, 255, 0.3)' }}>
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.product_id} className="section-card p-4 flex gap-4" style={{ border: '1px solid var(--border-subtle)' }}>
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="w-24 h-24 object-cover rounded-xl" onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=No+Image' }} />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{item.name}</h3>
                  <p className="font-semibold mb-2" style={{ color: 'var(--accent-primary)' }}>₹{item.price} each</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQuantity(item.product_id, -1)} className="w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all hover:scale-110" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>-</button>
                    <span className="font-bold text-lg min-w-[30px] text-center" style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product_id, 1)} className="w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all hover:scale-110" style={{ background: 'var(--accent-primary)', color: '#000000' }}>+</button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>₹{(item.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeItem(item.product_id)} className="text-sm font-semibold" style={{ color: 'var(--accent-rose)' }}>Remove</button>
                </div>
              </div>
            ))}
            <button onClick={clearCart} className="w-full py-2 font-semibold" style={{ color: 'var(--accent-rose)' }}>Clear Cart</button>
          </div>

          <div className="lg:col-span-1">
            <div className="section-card p-6 sticky top-4 rounded-2xl" style={{ border: '1px solid var(--border-subtle)' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Order Summary</h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}><span>Subtotal</span><span className="font-semibold">₹{calculateSubtotal().toFixed(2)}</span></div>
                <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}><span>Tax (5%)</span><span className="font-semibold">₹{calculateTax().toFixed(2)}</span></div>
                <div className="border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex justify-between text-xl font-bold"><span style={{ color: 'var(--text-primary)' }}>Total</span><span style={{ color: 'var(--accent-primary)' }}>₹{calculateTotal().toFixed(2)}</span></div>
                </div>
              </div>
              <button onClick={proceedToCheckout} className="w-full py-4 rounded-xl font-semibold text-lg transition-all hover:scale-[1.02]" style={{ background: 'var(--accent-primary)', color: '#000000', boxShadow: '0 4px 25px rgba(0, 217, 255, 0.4)' }}>
                Proceed to Payment
              </button>
              <div className="mt-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}><p>Items: {cart.reduce((sum, item) => sum + item.quantity, 0)}</p></div>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default Cart

