import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { productService, categoryService } from '../../services/api.service'
import { getProducts as getProductsDB, getCategories as getCategoriesDB } from '../../services/cafe.service'
import { supabase } from '../../services/supabase.service'
import Loading from '../../components/Loading'
import { showToast } from '../../components/Toast'

const Products = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    description: '',
    is_available: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // Fetch products - Supabase-direct first, backend API fallback
    try {
      // For admin, get ALL products (including unavailable)
      const { data: prods, error: prodsErr } = await supabase
        .from('products')
        .select('*, product_categories(name, icon_emoji)')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      if (prodsErr) throw prodsErr
      setProducts(prods || [])
    } catch {
      try {
        const res = await productService.getAllProducts()
        setProducts(res.data?.products || res.data || [])
      } catch { /* silently fail */ }
    }

    // Fetch categories - Supabase-direct first, backend API fallback
    try {
      const cats = await getCategoriesDB()
      setCategories(cats || [])
    } catch {
      try {
        const res = await categoryService.getAllCategories()
        setCategories(res.data?.categories || res.data || [])
      } catch { /* silently fail */ }
    }

    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingProduct) {
        try {
          await productService.updateProduct(editingProduct.id, formData)
        } catch {
          const { error } = await supabase.from('products').update({
            name: formData.name,
            category_id: formData.category_id,
            price: Number(formData.price),
            description: formData.description,
            is_available: formData.is_available
          }).eq('id', editingProduct.id)
          if (error) throw error
        }
        showToast('Product updated successfully')
      } else {
        try {
          await productService.createProduct(formData)
        } catch {
          const { error } = await supabase.from('products').insert({
            name: formData.name,
            category_id: formData.category_id,
            price: Number(formData.price),
            description: formData.description,
            is_available: formData.is_available,
            is_active: true
          })
          if (error) throw error
        }
        showToast('Product created successfully')
      }
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      showToast(error.message || 'Operation failed', 'error')
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category_id: product.category_id,
      price: product.price,
      description: product.description || '',
      is_available: product.is_available
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      try {
        await productService.deleteProduct(id)
      } catch {
        const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id)
        if (error) throw error
      }
      showToast('Product deleted successfully')
      fetchData()
    } catch (error) {
      showToast(error.message || 'Delete failed', 'error')
    }
  }

  const toggleAvailability = async (id) => {
    const product = products.find(p => p.id === id)
    try {
      try {
        await productService.toggleAvailability(id)
      } catch {
        const { error } = await supabase.from('products').update({ is_available: !product?.is_available }).eq('id', id)
        if (error) throw error
      }
      showToast('Availability updated')
      fetchData()
    } catch (error) {
      showToast(error.message || 'Update failed', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category_id: '',
      price: '',
      description: '',
      is_available: true
    })
    setEditingProduct(null)
  }

  if (loading) return <Loading />

  return (
    <AdminLayout>
      <div className="animate-slide-up">
        <div className="flex justify-between items-center mb-7">
          <div>
            <h1 className="page-title">Products</h1>
            <p className="page-subtitle">{products.length} products across {categories.length} categories</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true) }}
            className="btn-primary px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Add Product
          </button>
        </div>

        <div className="section-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Name', 'Category', 'Price', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`py-3.5 px-5 text-xs font-semibold uppercase tracking-wide ${h === 'Actions' ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="py-3.5 px-5 font-semibold" style={{ color: 'var(--text-primary)' }}>{product.name}</td>
                    <td className="py-3.5 px-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {categories.find(c => c.id === product.category_id)?.name || 'N/A'}
                    </td>
                    <td className="py-3.5 px-5 font-bold" style={{ color: 'var(--accent-primary)' }}>₹{product.price}</td>
                    <td className="py-3.5 px-5">
                      <button
                        onClick={() => toggleAvailability(product.id)}
                        className="tag-pill transition-all hover:scale-105"
                        style={product.is_available
                          ? { background: 'rgba(0,255,148,0.1)', color: 'var(--accent-emerald)', borderColor: 'rgba(0,255,148,0.25)' }
                          : { background: 'rgba(255,107,157,0.1)', color: 'var(--accent-rose)', borderColor: 'rgba(255,107,157,0.25)' }
                        }
                      >
                        {product.is_available ? '✓ Available' : '✗ Hidden'}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-3">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-sm font-semibold transition-all hover:opacity-70"
                        style={{ color: 'var(--accent-primary)' }}
                      >Edit</button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-sm font-semibold transition-all hover:opacity-70"
                        style={{ color: 'var(--accent-rose)' }}
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
            <div className="section-card p-6 w-full max-w-md animate-scale-in" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="section-title">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                <button onClick={() => { setShowModal(false); resetForm() }} className="p-1.5 rounded-lg transition-all hover:scale-110" style={{ color: 'var(--text-muted)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Category</label>
                    <select
                      value={formData.category_id}
                      onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="input-field"
                      rows="3"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="available"
                      checked={formData.is_available}
                      onChange={e => setFormData({ ...formData, is_available: e.target.checked })}
                      className="w-4 h-4 accent-[var(--accent-primary)]"
                    />
                    <label htmlFor="available" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Available for ordering</label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm() }}
                    className="btn-secondary px-4 py-2.5 rounded-xl"
                  >Cancel</button>
                  <button
                    type="submit"
                    className="btn-primary px-4 py-2.5 rounded-xl"
                  >{editingProduct ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}

export default Products
