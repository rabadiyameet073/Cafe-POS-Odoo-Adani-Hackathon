import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { floorService, tableService } from '../../services/api.service'
import { getFloors as getFloorsDB, getAllTablesWithTimers, forceFreeTaTable, extendTableTimer } from '../../services/cafe.service'
import { supabase, subscribeToTable, unsubscribeFromChannel } from '../../services/supabase.service'
import Loading from '../../components/Loading'
import { showToast } from '../../components/Toast'
import Icon from '../../components/Icons'

const STATUS = {
  available: { label: 'Available', color: 'var(--accent-emerald)', bg: 'rgba(0,255,148,0.12)', border: 'rgba(0,255,148,0.35)' },
  occupied:  { label: 'Occupied',  color: 'var(--accent-rose)',    bg: 'rgba(255,107,157,0.12)', border: 'rgba(255,107,157,0.35)' },
  reserved:  { label: 'Reserved',  color: 'var(--accent-blue)',    bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)' },
}

const Tables = () => {
  const [floors, setFloors] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [timers, setTimers] = useState({})
  const [selectedFloor, setSelectedFloor] = useState('all')
  const [activeTab, setActiveTab] = useState('manage') // 'manage' | 'live'
  const [showModal, setShowModal] = useState(false)
  const [editingTable, setEditingTable] = useState(null)
  const [formData, setFormData] = useState({ table_number: '', seats: 4, floor_id: '' })

  useEffect(() => { fetchData() }, [])

  // Real-time subscription
  useEffect(() => {
    const sub = subscribeToTable('tables', null, () => fetchData())
    return () => unsubscribeFromChannel(sub)
  }, [])

  // Live countdown timer per occupied table
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers = {}
      tables.forEach(t => {
        const session = t.table_sessions
        if (session && session.timer_ends_at && t.status === 'occupied') {
          const end = new Date(session.timer_ends_at).getTime()
          const diff = end - Date.now()
          if (diff <= 0) {
            newTimers[t.id] = '00:00'
          } else {
            const mins = Math.floor(diff / 60000)
            const secs = Math.floor((diff % 60000) / 1000)
            newTimers[t.id] = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
          }
        }
      })
      setTimers(newTimers)
    }, 1000)
    return () => clearInterval(interval)
  }, [tables])

  const fetchData = async () => {
    // Fetch floors and tables independently so one failure doesn't block the other
    // Use Supabase-direct calls as primary (always available), backend API as fallback
    try {
      const floorsData = await getFloorsDB()
      setFloors(floorsData || [])
      if (floorsData?.length > 0 && !formData.floor_id) {
        setFormData(prev => ({ ...prev, floor_id: floorsData[0].id }))
      }
    } catch (err) {
      // Fallback to backend API
      try {
        const res = await floorService.getAllFloors()
        const list = res.data?.floors || res.data || []
        setFloors(list)
        if (list.length > 0 && !formData.floor_id) {
          setFormData(prev => ({ ...prev, floor_id: list[0].id }))
        }
      } catch { /* silently fail for floors */ }
    }

    try {
      const tablesData = await getAllTablesWithTimers()
      setTables(tablesData || [])
    } catch (err) {
      // Fallback: simple tables query without sessions
      try {
        const { data, error } = await supabase.from('tables').select('*, floors(name)').eq('is_active', true).order('table_number', { ascending: true })
        if (error) throw error
        setTables((data || []).map(t => ({ ...t, table_sessions: null })))
      } catch {
        showToast('Failed to load tables', 'error')
      }
    }

    setLoading(false)
  }

  /* ── CRUD Handlers ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        table_number: String(formData.table_number),
        seats: Number(formData.seats),
        floor_id: formData.floor_id
      }
      if (editingTable) {
        // Try backend API first, fallback to Supabase-direct
        try {
          await tableService.updateTable(editingTable.id, payload)
        } catch {
          const { error } = await supabase.from('tables').update(payload).eq('id', editingTable.id)
          if (error) throw error
        }
        showToast(`Table ${payload.table_number} updated`)
      } else {
        try {
          await tableService.createTable(payload)
        } catch {
          const token = 'QR' + Math.random().toString(36).substring(2, 10).toUpperCase()
          const { error } = await supabase.from('tables').insert({ ...payload, qr_code_token: token, status: 'available', is_active: true })
          if (error) throw error
        }
        showToast(`Table ${payload.table_number} created`)
      }
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Operation failed', 'error')
    }
  }

  const handleEdit = (table) => {
    setEditingTable(table)
    setFormData({
      table_number: table.table_number,
      seats: table.seats || 4,
      floor_id: table.floor_id
    })
    setShowModal(true)
  }

  const handleDelete = async (table) => {
    if (!confirm(`Delete Table ${table.table_number}? This cannot be undone.`)) return
    try {
      try {
        await tableService.deleteTable(table.id)
      } catch {
        const { error } = await supabase.from('tables').update({ is_active: false }).eq('id', table.id)
        if (error) throw error
      }
      showToast(`Table ${table.table_number} deleted`)
      fetchData()
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Delete failed', 'error')
    }
  }

  const handleStatusChange = async (tableId, status) => {
    try {
      try {
        await tableService.updateTableStatus(tableId, status)
      } catch {
        const { error } = await supabase.from('tables').update({ status }).eq('id', tableId)
        if (error) throw error
      }
      showToast('Table status updated')
      fetchData()
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error')
    }
  }

  const handleForceFree = async (table) => {
    if (!confirm(`Free Table ${table.table_number}? This will end the session.`)) return
    try {
      await forceFreeTaTable(table.id, table.current_session_id)
      showToast(`Table ${table.table_number} freed`)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Failed', 'error')
    }
  }

  const handleExtend = async (table) => {
    if (!table.current_session_id) return
    try {
      await extendTableTimer(table.current_session_id, 15)
      showToast(`Table ${table.table_number} extended by 15 minutes`)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Failed', 'error')
    }
  }

  const resetForm = () => {
    setFormData({ table_number: '', seats: 4, floor_id: floors.length > 0 ? floors[0].id : '' })
    setEditingTable(null)
  }

  if (loading) return <AdminLayout><Loading /></AdminLayout>

  // Filtered tables
  const filteredTables = selectedFloor === 'all' ? tables : tables.filter(t => t.floor_id === selectedFloor)
  const occupied = filteredTables.filter(t => t.status === 'occupied')
  const available = filteredTables.filter(t => t.status === 'available')
  const reserved = filteredTables.filter(t => t.status === 'reserved')

  const stats = {
    total: filteredTables.length,
    available: available.length,
    occupied: occupied.length,
    reserved: reserved.length,
  }

  return (
    <AdminLayout>
      <div className="animate-slide-up">

        {/* ── Header ── */}
        <div className="flex justify-between items-center mb-7">
          <div>
            <h1 className="page-title">Table Management</h1>
            <p className="page-subtitle">{stats.total} tables &bull; {stats.occupied} occupied &bull; {stats.available} available</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all hover:scale-105"
              style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <Icon name="refresh" className="w-4 h-4" /> Refresh
            </button>
            <button onClick={() => { resetForm(); setShowModal(true) }}
              className="btn-primary px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Add Table
            </button>
          </div>
        </div>

        {/* ── Tab Switcher: Manage / Live Monitor ── */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'manage', label: 'Manage Tables', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { key: 'live', label: 'Live Monitor', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--bg-surface-hover)',
                color: activeTab === tab.key ? '#000' : 'var(--text-secondary)',
                border: activeTab === tab.key ? 'none' : '1px solid var(--border-subtle)',
              }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Floor Filter Tabs ── */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button onClick={() => setSelectedFloor('all')}
            className="floor-tab" style={{
              background: selectedFloor === 'all' ? 'var(--accent-primary)' : 'var(--bg-surface-hover)',
              color: selectedFloor === 'all' ? '#000' : 'var(--text-secondary)',
              border: selectedFloor === 'all' ? 'none' : '1px solid var(--border-subtle)',
              padding: '6px 16px', borderRadius: 12, fontWeight: 700, fontSize: '0.8rem'
            }}>
            All Floors
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 20, height: 20, borderRadius: 99, fontSize: '0.65rem', fontWeight: 800,
              background: selectedFloor === 'all' ? 'rgba(0,0,0,0.15)' : 'var(--bg-surface-hover)',
              color: selectedFloor === 'all' ? '#000' : 'var(--text-muted)',
              padding: '0 6px', marginLeft: 6,
            }}>{tables.length}</span>
          </button>
          {floors.map(floor => {
            const count = tables.filter(t => t.floor_id === floor.id).length
            const active = selectedFloor === floor.id
            return (
              <button key={floor.id} onClick={() => setSelectedFloor(floor.id)}
                className="floor-tab" style={{
                  background: active ? 'var(--accent-primary)' : 'var(--bg-surface-hover)',
                  color: active ? '#000' : 'var(--text-secondary)',
                  border: active ? 'none' : '1px solid var(--border-subtle)',
                  padding: '6px 16px', borderRadius: 12, fontWeight: 700, fontSize: '0.8rem'
                }}>
                {floor.name}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 20, height: 20, borderRadius: 99, fontSize: '0.65rem', fontWeight: 800,
                  background: active ? 'rgba(0,0,0,0.15)' : 'var(--bg-surface-hover)',
                  color: active ? '#000' : 'var(--text-muted)',
                  padding: '0 6px', marginLeft: 6,
                }}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7 stagger-children">
          {[
            { label: 'Total Tables', value: stats.total, color: 'var(--accent-primary)', bg: 'rgba(245,166,35,0.09)', borderTint: 'rgba(245,166,35,0.19)', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { label: 'Available',    value: stats.available, color: 'var(--accent-emerald)', bg: 'rgba(0,255,148,0.09)', borderTint: 'rgba(0,255,148,0.19)', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Occupied',     value: stats.occupied, color: 'var(--accent-rose)', bg: 'rgba(255,107,157,0.09)', borderTint: 'rgba(255,107,157,0.19)', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
            { label: 'Reserved',     value: stats.reserved, color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.09)', borderTint: 'rgba(59,130,246,0.19)', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          ].map(s => (
            <div key={s.label} className="stat-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: s.bg, border: `1px solid ${s.borderTint}` }}>
                  <svg className="w-4 h-4" fill="none" stroke={s.color} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={s.icon} />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ══════════ TAB: MANAGE TABLES ══════════ */}
        {activeTab === 'manage' && (
          <div>
            {filteredTables.length === 0 ? (
              <div className="section-card p-14 text-center">
                <div className="text-4xl mb-3">🪑</div>
                <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No tables found</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Click "Add Table" to create your first table</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 stagger-children">
                {filteredTables.map(table => {
                  const s = STATUS[table.status] || STATUS.available
                  const floorName = floors.find(f => f.id === table.floor_id)?.name || table.floors?.name || '—'
                  return (
                    <div key={table.id} className="glass-card p-4 flex flex-col items-center gap-2 group"
                      style={{ borderColor: s.border }}>

                      {/* Table icon */}
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                        style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
                        <Icon name="chair" className="w-8 h-8" style={{ color: s.color }} />
                      </div>

                      {/* Table info */}
                      <p className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>Table {table.table_number}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{floorName} &bull; {table.seats || '—'} seats</p>

                      {/* Status selector */}
                      <div className="w-full relative">
                        <select value={table.status} onChange={e => handleStatusChange(table.id, e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl text-xs font-bold text-center appearance-none cursor-pointer transition-all"
                          style={{ background: s.bg, border: `1.5px solid ${s.border}`, color: s.color, outline: 'none' }}>
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="reserved">Reserved</option>
                        </select>
                        <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3" fill="none" stroke={s.color} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>

                      {/* Edit / Delete */}
                      <div className="flex gap-2 w-full mt-1">
                        <button onClick={() => handleEdit(table)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                          style={{ background: 'rgba(245,166,35,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(245,166,35,0.25)' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(table)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                          style={{ background: 'rgba(255,107,157,0.1)', color: 'var(--accent-rose)', border: '1px solid rgba(255,107,157,0.25)' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════ TAB: LIVE MONITOR ══════════ */}
        {activeTab === 'live' && (
          <div>
            {/* Occupied */}
            {occupied.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span style={{ background: 'var(--accent-rose)', boxShadow: '0 0 6px var(--accent-rose)', width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }} />
                  <h2 className="text-base font-bold uppercase tracking-wide" style={{ color: 'var(--accent-rose)' }}>Occupied Tables ({occupied.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                  {occupied.map(table => {
                    const session = table.table_sessions
                    return (
                      <div key={table.id} className="section-card p-5" style={{ borderLeft: '3px solid var(--accent-rose)' }}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Table {table.table_number}</h3>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{table.floors?.name} &bull; {table.seats} seats</p>
                          </div>
                          {session?.table_token && (
                            <span className="tag-pill font-mono" style={{ background: 'rgba(255,107,157,0.08)', color: 'var(--accent-rose)', borderColor: 'rgba(255,107,157,0.22)' }}>{session.table_token}</span>
                          )}
                        </div>
                        {timers[table.id] !== undefined && (
                          <div className="rounded-xl p-3 mb-3 text-center" style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)' }}>
                            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Time Remaining</p>
                            <p className="text-3xl font-mono font-bold" style={{ color: timers[table.id] === '00:00' ? 'var(--accent-rose)' : 'var(--accent-gold)' }}>
                              <Icon name="timer" className="w-5 h-5 inline" /> {timers[table.id]}
                            </p>
                          </div>
                        )}
                        {session?.session_start && (
                          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                            Since: {new Date(session.session_start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button onClick={() => handleExtend(table)}
                            className="flex-1 py-2 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                            style={{ background: 'rgba(255,215,0,0.1)', color: 'var(--accent-gold)', border: '1px solid rgba(255,215,0,0.25)' }}>
                            +15 min
                          </button>
                          <button onClick={() => handleForceFree(table)}
                            className="flex-1 py-2 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                            style={{ background: 'var(--accent-rose)', color: '#fff', boxShadow: '0 4px 12px rgba(255,107,157,0.3)' }}>
                            Force Free
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Reserved */}
            {reserved.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span style={{ background: 'var(--accent-blue)', boxShadow: '0 0 6px var(--accent-blue)', width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }} />
                  <h2 className="text-base font-bold uppercase tracking-wide" style={{ color: 'var(--accent-blue)' }}>Reserved Tables ({reserved.length})</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
                  {reserved.map(table => (
                    <div key={table.id} className="section-card p-4 text-center" style={{ borderLeft: '3px solid var(--accent-blue)' }}>
                      <div className="flex justify-center mb-2"><span className="text-2xl">📋</span></div>
                      <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Table {table.table_number}</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{table.floors?.name} &bull; {table.seats} seats</p>
                      <span className="inline-block mt-2 tag-pill" style={{ background: 'rgba(59,130,246,0.08)', color: 'var(--accent-blue)', borderColor: 'rgba(59,130,246,0.22)' }}>Reserved</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ background: 'var(--accent-emerald)', boxShadow: '0 0 6px var(--accent-emerald)', width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }} />
                <h2 className="text-base font-bold uppercase tracking-wide" style={{ color: 'var(--accent-emerald)' }}>Available Tables ({available.length})</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
                {available.map(table => (
                  <div key={table.id} className="section-card p-4 text-center" style={{ borderLeft: '3px solid var(--accent-emerald)' }}>
                    <div className="flex justify-center mb-2"><span className="text-2xl">🪑</span></div>
                    <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Table {table.table_number}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{table.floors?.name} &bull; {table.seats} seats</p>
                    <span className="inline-block mt-2 tag-pill" style={{ background: 'rgba(0,255,148,0.08)', color: 'var(--accent-emerald)', borderColor: 'rgba(0,255,148,0.22)' }}>Available</span>
                  </div>
                ))}
              </div>
              {available.length === 0 && <p className="text-center py-6" style={{ color: 'var(--text-muted)' }}>No available tables</p>}
            </div>
          </div>
        )}

        {/* ══════════ ADD/EDIT TABLE MODAL ══════════ */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
            <div className="section-card p-6 w-full max-w-md animate-scale-in">
              <div className="flex items-center justify-between mb-5">
                <h2 className="section-title">{editingTable ? 'Edit Table' : 'Add New Table'}</h2>
                <button onClick={() => { setShowModal(false); resetForm() }}
                  className="p-1.5 rounded-lg hover:scale-110 transition-all" style={{ color: 'var(--text-muted)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Floor */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Floor</label>
                    <select value={formData.floor_id} onChange={e => setFormData({ ...formData, floor_id: e.target.value })}
                      className="input-field" required>
                      <option value="">Select Floor</option>
                      {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  {/* Table Number */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Table Number</label>
                    <input type="text" value={formData.table_number}
                      onChange={e => setFormData({ ...formData, table_number: e.target.value })}
                      className="input-field" placeholder="e.g. T1, T2, T3..." required />
                  </div>
                  {/* Seats */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Number of Seats</label>
                    <input type="number" min="1" max="20" value={formData.seats}
                      onChange={e => setFormData({ ...formData, seats: e.target.value })}
                      className="input-field" placeholder="e.g. 2, 4, 6..." required />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => { setShowModal(false); resetForm() }}
                    className="btn-secondary px-4 py-2.5 rounded-xl">Cancel</button>
                  <button type="submit" className="btn-primary px-4 py-2.5 rounded-xl">{editingTable ? 'Update Table' : 'Create Table'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}

export default Tables
