import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { getCategories, getProducts } from '../../services/cafe.service'
import Loading from '../../components/Loading'
import Icon from '../../components/Icons'
import { showToast } from '../../components/Toast'

const FALLBACK_IMAGES = {
  'Fresh Lime Soda': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed514?w=400',
  'Sprite': 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400',
}

const PlaceholderImage = ({ name }) => (
  <div
    className="w-full h-40 sm:h-48 flex items-center justify-center"
    style={{ borderRadius: '18px 18px 0 0', background: 'linear-gradient(135deg, rgba(245,166,35,0.15) 0%, rgba(168,85,247,0.10) 100%)' }}
  >
    <span className="text-4xl">{name?.toLowerCase().includes('coffee') ? '☕' : name?.toLowerCase().includes('tea') ? '🍵' : name?.toLowerCase().includes('soda') || name?.toLowerCase().includes('lime') ? '🍋' : name?.toLowerCase().includes('juice') ? '🧃' : '🍽️'}</span>
  </div>
)

const Menu = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [failedImages, setFailedImages] = useState(new Set())
  const [cartOpen, setCartOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = sessionStorage.getItem('table_token')
    if (!token) {
      sessionStorage.setItem('_toast', 'Please select a table before ordering.')
      navigate('/customer/select-floor', { replace: true })
      return
    }
    fetchData()
    loadCart()
  }, [])

  const fetchData = async () => {
    try {
      const [cats, prods] = await Promise.all([getCategories(), getProducts()])
      setCategories(cats)
      setProducts(prods)
    } catch (err) {
      showToast(err.message || 'Failed to load menu', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadCart = () => {
    const saved = sessionStorage.getItem('cafe_cart')
    if (saved) setCart(JSON.parse(saved))
  }

  const saveCart = (newCart) => {
    sessionStorage.setItem('cafe_cart', JSON.stringify(newCart))
    setCart(newCart)
  }



  const addToCart = (product) => {
    const existing = cart.find(i => i.product_id === product.id)
    let newCart
    if (existing) {
      newCart = cart.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
    } else {
      newCart = [...cart, {
        product_id: product.id,
        name: product.name,
        price: Number(product.price),
        image_url: product.image_url,
        quantity: 1
      }]
    }
    saveCart(newCart)
    showToast(`${product.name} added to cart`)
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

  const removeFromCart = (productId) => {
    saveCart(cart.filter(i => i.product_id !== productId))
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const cartTax = cartTotal * 0.05
  const cartGrandTotal = cartTotal + cartTax

  const filtered = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category_id === selectedCategory)

  const handleImageError = (productId, productName) => {
    if (FALLBACK_IMAGES[productName]) return
    setFailedImages(prev => new Set(prev).add(productId))
  }

  if (loading) return <Loading />

  return (
    <CustomerLayout>
      <div className="animate-slide-up">

        {/* ═══ Header ═══ */}
        <div className="mb-5 sm:mb-7">
          <h1 className="page-title">Our Menu</h1>
          <p className="page-subtitle">{products.length} items available</p>
        </div>

        {/* ═══ Category pills ═══ */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`category-pill flex-shrink-0 ${selectedCategory === 'all' ? 'active' : ''}`}
          >
            🍽️ All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`category-pill flex-shrink-0 ${selectedCategory === cat.id ? 'active' : ''}`}
            >
              {cat.icon_emoji || ''} {cat.name}
            </button>
          ))}
        </div>

        {/* ═══ Products Grid ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 stagger-children">
          {filtered.map(product => {
            const cartItem = cart.find(i => i.product_id === product.id)
            const imgFailed = failedImages.has(product.id)
            const imageUrl = product.image_url || FALLBACK_IMAGES[product.name]
            const fallbackUrl = FALLBACK_IMAGES[product.name]
            return (
              <div key={product.id} className="product-card flex flex-col">
                <div className="relative overflow-hidden" style={{ borderRadius: '18px 18px 0 0' }}>
                  {imageUrl && !imgFailed ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="product-card-img w-full h-40 sm:h-48 object-cover"
                      onError={(e) => {
                        if (fallbackUrl && e.target.src !== fallbackUrl) {
                          e.target.src = fallbackUrl
                        } else {
                          handleImageError(product.id, product.name)
                        }
                      }}
                    />
                  ) : (
                    <PlaceholderImage name={product.name} />
                  )}
                  {product.is_vegetarian && (
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-xs font-bold backdrop-blur-md"
                      style={{ background: 'rgba(0,255,148,0.15)', color: 'var(--accent-emerald)', border: '1px solid rgba(0,255,148,0.3)', fontSize: '0.6rem' }}
                    >VEG</span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
                  {product.description && (
                    <p className="text-sm mb-3 line-clamp-2 flex-1" style={{ color: 'var(--text-muted)' }}>{product.description}</p>
                  )}
                  <div className="flex justify-between items-center mt-auto pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <span className="product-price text-xl font-extrabold transition-all" style={{ color: 'var(--accent-primary)' }}>₹{Number(product.price).toFixed(0)}</span>
                    {cartItem ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(product.id, -1)}
                          className="w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                          style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                        >−</button>
                        <span className="font-bold text-base min-w-[22px] text-center" style={{ color: 'var(--accent-primary)' }}>{cartItem.quantity}</span>
                        <button
                          onClick={() => updateQty(product.id, 1)}
                          className="w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                          style={{ background: 'var(--accent-primary)', color: 'var(--on-accent-text)' }}
                        >+</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="product-add-btn btn-primary px-4 py-1.5 text-sm rounded-xl"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-lg" style={{ color: 'var(--text-muted)' }}>No items in this category</p>
          </div>
        )}
      </div>

      {/* ═══ Fixed Square Cart Box (bottom-right) — shows items + total ═══ */}
      <div
        className="fixed-cart-btn"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 998,
          borderRadius: '16px',
          background: 'var(--bg-surface-solid)',
          border: '1px solid var(--border-subtle)',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px var(--border-subtle), inset 0 1px 0 var(--card-inset)',
          transition: 'all 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
          overflow: 'hidden',
          minWidth: cart.length > 0 ? '220px' : '60px',
          maxWidth: '260px',
        }}
      >
        {cart.length === 0 ? (
          /* Empty cart — small square icon */
          <button
            onClick={() => setCartOpen(prev => !prev)}
            style={{
              width: '60px',
              height: '60px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              background: 'var(--accent-primary)',
              color: 'var(--on-accent-text)',
              borderRadius: '16px',
              cursor: 'pointer',
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span style={{ fontSize: '0.55rem', fontWeight: 800 }}>CART</span>
          </button>
        ) : (
          /* Has items — expanded box showing items + prices + total */
          <div>
            {/* Header row */}
            <div
              onClick={() => setCartOpen(prev => !prev)}
              className="flex items-center justify-between px-3.5 py-2.5"
              style={{ background: 'var(--accent-primary)', cursor: 'pointer' }}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--on-accent-text)' }}>MY CART</span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    background: 'var(--on-accent-text)',
                    color: 'var(--accent-primary)',
                    borderRadius: '6px',
                    padding: '1px 6px',
                  }}
                >{cartCount}</span>
              </div>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={cartOpen ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
              </svg>
            </div>

            {/* Items list (compact) */}
            <div className="px-3 py-2" style={{ maxHeight: '140px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
              {cart.map(item => (
                <div key={item.product_id} className="flex items-center justify-between py-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)', maxWidth: '110px' }}>{item.name}</span>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>×{item.quantity}</span>
                  </div>
                  <span className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: 'var(--accent-primary)' }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>

            {/* Total + Checkout */}
            <div className="px-3 py-2.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Total</span>
                <span className="text-sm font-extrabold" style={{ color: 'var(--accent-primary)' }}>₹{cartGrandTotal.toFixed(0)}</span>
              </div>
              <button
                onClick={() => navigate('/customer/shopping-cart')}
                className="w-full py-2 text-xs font-bold rounded-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
                style={{ background: 'var(--accent-primary)', color: 'var(--on-accent-text)', boxShadow: '0 2px 12px rgba(255,77,77,0.3)' }}
              >
                Checkout
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Cart Panel (opens from fixed button) ═══ */}
      {cartOpen && (
        <>
          <div
            onClick={() => setCartOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 998,
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(3px)',
              animation: 'fadeIn 0.2s ease-out',
            }}
          />
          <div
            style={{
              position: 'fixed',
              bottom: '96px',
              right: '24px',
              width: '320px',
              maxHeight: 'calc(100vh - 160px)',
              zIndex: 999,
              borderRadius: '16px',
              background: 'var(--bg-surface-solid)',
              border: '1px solid var(--border-subtle)',
              backdropFilter: 'blur(28px) saturate(200%)',
              WebkitBackdropFilter: 'blur(28px) saturate(200%)',
              boxShadow: '0 16px 56px rgba(0,0,0,0.5), 0 0 0 1px var(--border-subtle), inset 0 1px 0 var(--card-inset)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'cartPanelUp 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {/* Cart Header */}
            <div
              className="px-5 py-3.5 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 flex items-center justify-center"
                  style={{ background: 'var(--accent-primary)', borderRadius: '10px', boxShadow: '0 4px 16px rgba(255,77,77,0.3)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="#000" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Your Order</h3>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={() => saveCart([])}
                    className="text-xs px-2 py-1 rounded-lg transition-all hover:scale-105"
                    style={{ color: 'var(--accent-red)', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.15)' }}
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setCartOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:scale-110"
                  style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: 'thin', maxHeight: 'calc(100vh - 380px)' }}>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2 opacity-40">🛒</div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your cart is empty</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Add items from the menu</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {cart.map(item => (
                    <div
                      key={item.product_id}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl transition-all hover:scale-[1.01]"
                      style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)' }}
                    >
                      <div
                        className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.12), rgba(168,85,247,0.08))' }}
                      >
                        {item.image_url && !failedImages.has(item.product_id) ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                        ) : (
                          <span className="text-base">🍽️</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                        <p className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>₹{(item.price * item.quantity).toFixed(0)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => updateQty(item.product_id, -1)}
                          className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs transition-all hover:scale-110"
                          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                        >−</button>
                        <span className="w-5 text-center text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.product_id, 1)}
                          className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs transition-all hover:scale-110"
                          style={{ background: 'var(--accent-primary)', color: 'var(--on-accent-text)' }}
                        >+</button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="flex-shrink-0 transition-all hover:scale-110"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-red)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary & Checkout */}
            {cart.length > 0 && (
              <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface-solid)' }}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                  <span style={{ color: 'var(--text-secondary)' }}>₹{cartTotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-xs mb-2">
                  <span style={{ color: 'var(--text-muted)' }}>Tax (5%)</span>
                  <span style={{ color: 'var(--text-secondary)' }}>₹{cartTax.toFixed(0)}</span>
                </div>
                <div
                  className="flex justify-between text-sm font-extrabold mb-3 pt-2"
                  style={{ borderTop: '1px dashed var(--border-subtle)' }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>Total</span>
                  <span style={{ color: 'var(--accent-primary)' }}>₹{cartGrandTotal.toFixed(0)}</span>
                </div>
                <button
                  onClick={() => navigate('/customer/shopping-cart')}
                  className="w-full py-2.5 font-bold text-sm rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                  style={{ background: 'var(--accent-primary)', color: 'var(--on-accent-text)', boxShadow: '0 4px 20px rgba(255,77,77,0.35)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </>
      )}

    </CustomerLayout>
  )
}

export default Menu
