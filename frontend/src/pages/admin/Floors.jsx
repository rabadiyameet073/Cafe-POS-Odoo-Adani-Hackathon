import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { floorService, tableService } from '../../services/api.service'
import { getFloors as getFloorsDB, getAllTablesWithTimers } from '../../services/cafe.service'
import { supabase } from '../../services/supabase.service'
import Loading from '../../components/Loading'
import { showToast } from '../../components/Toast'
import Icon from '../../components/Icons'

const Floors = () => {
  const [floors, setFloors] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingFloor, setEditingFloor] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', display_order: 0 })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    // Fetch independently using Supabase-direct as primary, backend API as fallback
    try {
      const floorsData = await getFloorsDB()
      setFloors(floorsData || [])
    } catch {
      try {
        const res = await floorService.getAllFloors()
        setFloors(res.data?.floors || res.data || [])
      } catch { /* silently fail */ }
    }

    try {
      const tablesData = await getAllTablesWithTimers()
      setTables(tablesData || [])
    } catch {
      // Fallback: simple tables query for floor stats
      try {
        const { data } = await supabase.from('tables').select('id, floor_id, status, table_number, seats').eq('is_active', true)
        setTables(data || [])
      } catch {
        try {
          const res = await tableService.getAllTables()
          setTables(res.data?.tables || res.data || [])
        } catch { /* silently fail */ }
      }
    }

    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        display_order: Number(formData.display_order) || 0
      }
      if (editingFloor) {
        try {
          await floorService.updateFloor(editingFloor.id, payload)
        } catch {
          const { error } = await supabase.from('floors').update(payload).eq('id', editingFloor.id)
          if (error) throw error
        }
        showToast('Floor updated successfully')
      } else {
        try {
          await floorService.createFloor(payload)
        } catch {
          const { error } = await supabase.from('floors').insert({ ...payload, is_active: true })
          if (error) throw error
        }
        showToast('Floor created successfully')
      }
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      showToast(error.message || 'Operation failed', 'error')
    }
  }

  const handleEdit = (floor) => {
    setEditingFloor(floor)
    setFormData({ name: floor.name, description: floor.description || '', display_order: floor.display_order || 0 })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    const floor = floors.find(f => f.id === id)
    const floorTableCount = tables.filter(t => t.floor_id === id).length
    if (floorTableCount > 0) {
      showToast(`Cannot delete "${floor?.name}" - it has ${floorTableCount} tables. Remove tables first.`, 'error')
      return
    }
    if (!confirm(`Are you sure you want to delete "${floor?.name}"?`)) return
    try {
      try {
        await floorService.deleteFloor(id)
      } catch {
        const { error } = await supabase.from('floors').update({ is_active: false }).eq('id', id)
        if (error) throw error
      }
      showToast('Floor deleted successfully')
      fetchData()
    } catch (error) {
      showToast(error.message || 'Delete failed', 'error')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', display_order: 0 })
    setEditingFloor(null)
  }

  const getFloorStats = (floorId) => {
    const floorTables = tables.filter(t => t.floor_id === floorId)
    return {
      total: floorTables.length,
      available: floorTables.filter(t => t.status === 'available').length,
      occupied: floorTables.filter(t => t.status === 'occupied').length,
      reserved: floorTables.filter(t => t.status === 'reserved').length,
    }
  }

  if (loading) return <AdminLayout><Loading /></AdminLayout>

  return (
    <AdminLayout>
      <div className="animate-slide-up">
        <div className="flex justify-between items-center mb-7">
          <div>
            <h1 className="page-title">Floor Management</h1>
            <p className="page-subtitle">{floors.length} floor{floors.length !== 1 ? 's' : ''} configured &bull; {tables.length} total tables</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true) }} className="btn-primary px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Add Floor
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7 stagger-children">
          {[
            { label: 'Total Floors', value: floors.length, color: 'var(--accent-primary)', bg: 'rgba(245,166,35,0.09)', borderTint: 'rgba(245,166,35,0.19)' },
            { label: 'Total Tables', value: tables.length, color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.09)', borderTint: 'rgba(59,130,246,0.19)' },
            { label: 'Available', value: tables.filter(t => t.status === 'available').length, color: 'var(--accent-emerald)', bg: 'rgba(0,255,148,0.09)', borderTint: 'rgba(0,255,148,0.19)' },
            { label: 'Occupied', value: tables.filter(t => t.status === 'occupied').length, color: 'var(--accent-rose)', bg: 'rgba(255,107,157,0.09)', borderTint: 'rgba(255,107,157,0.19)' },
          ].map(s => (
            <div key={s.label} className="stat-card p-5">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
              <div className="text-3xl font-extrabold mt-2" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {floors.length === 0 ? (
            <div className="col-span-full section-card p-10 text-center">
              <div className="text-4xl mb-3">🏢</div>
              <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No floors yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Click "Add Floor" to create your first floor</p>
            </div>
          ) : (
            floors.map((floor) => {
              const stats = getFloorStats(floor.id)
              return (
                <div key={floor.id} className="section-card p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{floor.name}</h3>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{floor.description || 'No description'}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleEdit(floor)} className="text-sm font-semibold transition-all hover:opacity-70" style={{ color: 'var(--accent-primary)' }}>Edit</button>
                      <button onClick={() => handleDelete(floor.id)} className="text-sm font-semibold transition-all hover:opacity-70" style={{ color: 'var(--accent-rose)' }}>Delete</button>
                    </div>
                  </div>

                  {/* Table stats per floor */}
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {[
                      { label: 'Total', value: stats.total, color: 'var(--accent-primary)' },
                      { label: 'Free', value: stats.available, color: 'var(--accent-emerald)' },
                      { label: 'Busy', value: stats.occupied, color: 'var(--accent-rose)' },
                      { label: 'Rsrvd', value: stats.reserved, color: 'var(--accent-blue)' },
                    ].map(s => (
                      <div key={s.label} className="text-center p-2 rounded-xl" style={{ background: 'var(--bg-surface-hover)' }}>
                        <div className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-[0.6rem] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {floor.display_order !== undefined && (
                    <div className="mt-3">
                      <span className="tag-pill text-xs" style={{ background: 'rgba(245,166,35,0.08)', color: 'var(--accent-primary)', borderColor: 'rgba(245,166,35,0.2)' }}>
                        Order: {floor.display_order}
                      </span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
            <div className="section-card p-6 w-full max-w-md animate-scale-in">
              <div className="flex items-center justify-between mb-5">
                <h2 className="section-title">{editingFloor ? 'Edit Floor' : 'Add Floor'}</h2>
                <button onClick={() => { setShowModal(false); resetForm() }} className="p-1.5 rounded-lg hover:scale-110 transition-all" style={{ color: 'var(--text-muted)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="e.g. Ground Floor, Terrace" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Description</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" rows="3" placeholder="Optional description..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Display Order</label>
                    <input type="number" min="0" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: e.target.value })} className="input-field" placeholder="0" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="btn-secondary px-4 py-2.5 rounded-xl">Cancel</button>
                  <button type="submit" className="btn-primary px-4 py-2.5 rounded-xl">{editingFloor ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}

export default Floors
