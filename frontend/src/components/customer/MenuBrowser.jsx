import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { productService, categoryService, cartService } from '../../services/api.service'
import Loading from '../Loading'
import Toast from '../Toast'

const MenuBrowser = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
    loadCart()
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getAllCategories()
      ])
      setProducts(productsRes.data.products?.filter(p => p.is_available) || [])
      setCategories(categoriesRes.data.categories?.filter(c => c.is_active) || [])
    } catch (error) {
      showToast(error.message || 'Failed to load menu', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadCart = async () => {
    const tableToken = sessionStorage.getItem('table_token')
    if (!tableToken) {
      setCart([])
      return
    }
    try {
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
    } catch {
      setCart([])
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const validateTableToken = () => {
    const tableToken = sessionStorage.getItem('table_token')
    if (!tableToken) {
      showToast('Please select a table first', 'error')
      setTimeout(() => navigate('/customer/select-floor'), 1500)
      return false
    }
    return true
  }

  const addToCart = async (product) => {
    if (!validateTableToken()) return
    const tableToken = sessionStorage.getItem('table_token')
    try {
      await cartService.addToCart({
        table_token: tableToken,
        product_id: product.id,
        quantity: 1
      })
      await loadCart()
      showToast(`${product.name} added to cart`)
    } catch (error) {
      showToast(error.message || 'Failed to add item to cart', 'error')
    }
  }

  const updateQuantity = async (productId, change) => {
    const tableToken = sessionStorage.getItem('table_token')
    if (!tableToken) return
    const existingItem = cart.find(item => item.product_id === productId)
    if (!existingItem) return
    try {
      if (existingItem.quantity + change <= 0) {
        if (existingItem.cart_item_id) {
          await cartService.removeItem(tableToken, existingItem.cart_item_id)
        }
      } else {
        await cartService.addToCart({
          table_token: tableToken,
          product_id: productId,
          quantity: change
        })
      }
      await loadCart()
    } catch (error) {
      showToast(error.message || 'Failed to update cart', 'error')
    }
  }

  const getCartTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const getCartCount = () => cart.reduce((sum, item) => sum + item.quantity, 0)

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category_id === selectedCategory)

  const proceedToCart = () => {
    if (!validateTableToken()) return
    if (cart.length === 0) {
      showToast('Your cart is empty', 'error')
      return
    }
    navigate('/customer/shopping-cart')
  }

  const getTableInfo = () => {
    const tableNumber = sessionStorage.getItem('table_number')
    return tableNumber ? `Table ${tableNumber}` : 'No table selected'
  }

  if (loading) return <Loading />

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Our Menu</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{getTableInfo()}</p>
        </div>
        <button
          onClick={proceedToCart}
          className="px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
          style={{
            background: 'var(--accent-primary)',
            color: '#000000',
            boxShadow: '0 4px 20px rgba(0, 217, 255, 0.3)',
          }}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Cart ({getCartCount()})</span>
          </span>
          {cart.length > 0 && <span className="ml-2 font-bold">₹{getCartTotal().toFixed(2)}</span>}
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className="px-5 py-2.5 rounded-xl whitespace-nowrap transition-all duration-300"
          style={{
            background: selectedCategory === 'all' ? 'var(--accent-primary)' : 'var(--bg-surface)',
            color: selectedCategory === 'all' ? '#000000' : 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          All Items
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className="px-5 py-2.5 rounded-xl whitespace-nowrap transition-all duration-300"
            style={{
              background: selectedCategory === category.id ? 'var(--accent-primary)' : 'var(--bg-surface)',
              color: selectedCategory === category.id ? '#000000' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((product) => {
          const cartItem = cart.find(item => item.product_id === product.id)
          return (
            <div 
              key={product.id} 
              className="section-card p-4 hover:scale-[1.02] transition-all duration-300"
              style={{ border: '1px solid var(--border-subtle)' }}
            >
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-44 object-cover rounded-xl mb-4"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image' }}
                />
              )}
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
                {product.is_vegetarian && (
                  <span style={{ color: 'var(--accent-emerald)' }}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              {product.description && (
                <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{product.description}</p>
              )}
              <div className="flex justify-between items-center mt-4">
                <span 
                  className="text-2xl font-bold"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  ₹{product.price}
                </span>
                {cartItem ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(product.id, -1)}
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all hover:scale-110"
                      style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                    >
                      -
                    </button>
                    <span className="font-bold text-lg min-w-[24px] text-center" style={{ color: 'var(--text-primary)' }}>
                      {cartItem.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, 1)}
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all hover:scale-110"
                      style={{ background: 'var(--accent-primary)', color: '#000000' }}
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(product)}
                    className="px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105"
                    style={{ background: 'var(--accent-primary)', color: '#000000' }}
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg" style={{ color: 'var(--text-muted)' }}>No products available in this category</p>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default MenuBrowser

