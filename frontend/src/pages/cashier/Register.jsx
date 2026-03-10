import { useState, useEffect } from 'react'
import CashierLayout from '../../components/layouts/CashierLayout'
import { productService, categoryService, orderService, tableService } from '../../services/api.service'
import Loading from '../../components/Loading'
import { showToast } from '../../components/Toast'
import Icon from '../../components/Icons'

const Register = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTable, setSelectedTable] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, tablesRes] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getAllCategories(),
        tableService.getAllTables()
      ])
      setProducts(productsRes.data.products || productsRes.data || [])
      setCategories(categoriesRes.data.categories || categoriesRes.data || [])
      setTables(tablesRes.data.tables || tablesRes.data || [])
    } catch (error) {
      showToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) {
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, quantity: 1 }]
    })
  }

  const updateQty = (productId, change) => {
    setCart(prev => prev.map(i => {
      if (i.product_id === productId) {
        const newQty = i.quantity + change
        return newQty > 0 ? { ...i, quantity: newQty } : null
      }
      return i
    }).filter(Boolean))
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const tax = subtotal * 0.05
  const total = subtotal + tax

  const handlePlaceOrder = async () => {
    if (!selectedTable) { showToast('Please select a table', 'error'); return }
    if (cart.length === 0) { showToast('Cart is empty', 'error'); return }
    try {
      await orderService.createOrder({
        table_id: selectedTable,
        items: cart,
        order_type: 'dine_in',
        total_amount: total
      })
      showToast('Order placed successfully!')
      setCart([])
      setSelectedTable('')
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to place order', 'error')
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch && p.is_available
  })

  if (loading) return <CashierLayout><Loading /></CashierLayout>

  return (
    <CashierLayout>
      <div className="animate-slide-up">
        <h1 className="page-title mb-6"><Icon name="clipboard" className="w-5 h-5 inline" /> POS Register</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Panel */}
          <div className="lg:col-span-2">
            {/* Search & Categories */}
            <div className="mb-4">
              <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field w-full mb-3" />
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button onClick={() => setSelectedCategory('all')} className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'font-bold' : ''}`} style={selectedCategory === 'all' ? { background: 'var(--accent-primary)', color: 'var(--on-accent-text)' } : { background: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>All</button>
                {categories.map(c => (
                  <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${selectedCategory === c.id ? 'font-bold' : ''}`} style={selectedCategory === c.id ? { background: 'var(--accent-primary)', color: 'var(--on-accent-text)' } : { background: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>{c.name}</button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredProducts.map(product => (
                <div key={product.id} onClick={() => addToCart(product)} className="section-card p-4 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent" style={{ ':hover': { borderColor: 'var(--accent-primary)' } }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,166,35,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <p className="font-bold text-[var(--text-primary)] text-sm mb-1">{product.name}</p>
                  <p className="text-[var(--accent-primary)] font-semibold">₹{product.price}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Panel */}
          <div className="lg:col-span-1">
            <div className="section-card p-6 sticky top-4">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Current Order</h2>

              {/* Table Select */}
              <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} className="input-field w-full mb-4">
                <option value="">Select Table</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>Table {t.table_number} ({t.status})</option>
                ))}
              </select>

              {/* Cart Items */}
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-[var(--text-muted)] text-center py-4 text-sm">No items added</p>
                ) : (
                  cart.map(item => (
                    <div key={item.product_id} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">₹{item.price} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.product_id, -1)} className="w-6 h-6 bg-[var(--bg-surface-hover)] rounded-full text-sm font-bold flex items-center justify-center">-</button>
                        <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product_id, 1)} className="w-6 h-6 rounded-full text-sm font-bold flex items-center justify-center" style={{ background: 'var(--accent-primary)', color: 'var(--on-accent-text)' }}>+</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals */}
              <div className="space-y-2 mb-4 border-t border-[var(--border-subtle)] pt-3">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span>Tax (5%)</span><span>₹{tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-[var(--accent-primary)]">₹{total.toFixed(2)}</span></div>
              </div>

              <button onClick={handlePlaceOrder} disabled={cart.length === 0} className="w-full py-3 btn-primary rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                Place Order
              </button>
            </div>
          </div>
        </div>

      </div>
    </CashierLayout>
  )
}

export default Register
