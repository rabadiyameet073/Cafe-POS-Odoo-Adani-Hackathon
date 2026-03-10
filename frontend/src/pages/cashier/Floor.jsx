import { useState, useEffect, useRef } from 'react'
import CashierLayout from '../../components/layouts/CashierLayout'
import { floorService, tableService } from '../../services/api.service'
import Loading from '../../components/Loading'
import { showToast } from '../../components/Toast'
import Icon from '../../components/Icons'

/* ── status meta ── */
const STATUS = {
  available: { label: 'Available', color: 'var(--accent-emerald)', bg: 'rgba(0,255,148,0.12)', border: 'rgba(0,255,148,0.35)' },
  occupied:  { label: 'Occupied',  color: 'var(--accent-rose)', bg: 'rgba(255,107,157,0.12)',  border: 'rgba(255,107,157,0.35)'  },
  reserved:  { label: 'Reserved',  color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)' },
}

const Floor = () => {
  const [floors, setFloors] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFloor, setSelectedFloor] = useState(null)
  const [prevFloor, setPrevFloor] = useState(null)
  const [contentKey, setContentKey] = useState(0)
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 })
  const tabRefs = useRef({})
  const tabBarRef = useRef(null)

  useEffect(() => { fetchData() }, [])

  /* ── animated indicator position ── */
  useEffect(() => {
    if (!selectedFloor || !tabRefs.current[selectedFloor]) return
    const el = tabRefs.current[selectedFloor]
    const bar = tabBarRef.current
    if (!el || !bar) return
    const elRect = el.getBoundingClientRect()
    const barRect = bar.getBoundingClientRect()
    setTabIndicator({ left: elRect.left - barRect.left, width: elRect.width })
  }, [selectedFloor, floors])

  const fetchData = async () => {
    try {
      const [floorsRes, tablesRes] = await Promise.all([
        floorService.getAllFloors(),
        tableService.getAllTables()
      ])
      const floorsList = floorsRes.data.floors || floorsRes.data || []
      setFloors(floorsList)
      setTables(tablesRes.data.tables || tablesRes.data || [])
      if (floorsList.length > 0 && !selectedFloor) setSelectedFloor(floorsList[0].id)
    } catch {
      showToast('Failed to load floor data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const switchFloor = (id) => {
    if (id === selectedFloor) return
    setPrevFloor(selectedFloor)
    setSelectedFloor(id)
    setContentKey(k => k + 1)
  }

  const handleStatusChange = async (tableId, status) => {
    try {
      await tableService.updateTableStatus(tableId, status)
      showToast('Table status updated')
      fetchData()
    } catch {
      showToast('Failed to update status', 'error')
    }
  }

  const floorTables = tables.filter(t => t.floor_id === selectedFloor)
  const stats = {
    total:     floorTables.length,
    available: floorTables.filter(t => t.status === 'available').length,
    occupied:  floorTables.filter(t => t.status === 'occupied').length,
    reserved:  floorTables.filter(t => t.status === 'reserved').length,
  }

  if (loading) return <CashierLayout><Loading /></CashierLayout>

  return (
    <CashierLayout>
      <div className="animate-slide-up">

        {/* ── Page Header ── */}
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)' }}>
              <Icon name="building" className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h1 className="page-title">Floor Management</h1>
          </div>
          <p className="page-subtitle ml-12">Monitor and manage table status across all floors</p>
        </div>

        {/* ── Premium Animated Floor Tabs ── */}
        <div className="relative mb-8">
          <div
            ref={tabBarRef}
            className="flex gap-2 flex-wrap"
            style={{ position: 'relative' }}
          >
            {floors.map(floor => {
              const active = selectedFloor === floor.id
              const ft = floorTables
              const floorCount = tables.filter(t => t.floor_id === floor.id).length
              return (
                <button
                  key={floor.id}
                  ref={el => { tabRefs.current[floor.id] = el }}
                  onClick={() => switchFloor(floor.id)}
                  className={`floor-tab ${active ? 'active' : ''}`}
                >
                  {/* icon dot */}
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: active ? 'var(--text-muted)' : 'var(--text-muted)',
                    opacity: active ? 0.6 : 1,
                    transition: 'all 0.28s ease',
                    flexShrink: 0,
                  }} />
                  {floor.name}
                  {/* table count badge */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: 20, height: 20, borderRadius: 99,
                    fontSize: '0.65rem', fontWeight: 800,
                    background: active ? 'var(--bg-surface-hover)' : 'var(--bg-surface-hover)',
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                    padding: '0 6px',
                    border: active ? 'none' : '1px solid var(--border-subtle)',
                    transition: 'all 0.28s ease',
                  }}>
                    {floorCount}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Animated content area ── */}
        <div key={contentKey} className="tab-content-enter">

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7 stagger-children">
            {[
              { label: 'Total Tables', value: stats.total, color: 'var(--accent-primary)', bg: 'rgba(245,166,35,0.09)', borderTint: 'rgba(245,166,35,0.19)', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
              { label: 'Available',    value: stats.available, color: 'var(--accent-emerald)', bg: 'rgba(0,255,148,0.09)', borderTint: 'rgba(0,255,148,0.19)', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { label: 'Occupied',     value: stats.occupied,  color: 'var(--accent-rose)', bg: 'rgba(255,107,157,0.09)', borderTint: 'rgba(255,107,157,0.19)', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
              { label: 'Reserved',     value: stats.reserved,  color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.09)', borderTint: 'rgba(59,130,246,0.19)', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
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

          {/* Table Grid */}
          {floorTables.length === 0 ? (
            <div className="section-card p-14 text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)' }}>
                <Icon name="chair" className="w-9 h-9" style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No tables on this floor</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Add tables in the admin panel</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 stagger-children">
              {floorTables.map(table => {
                const s = STATUS[table.status] || STATUS.available
                return (
                  <div
                    key={table.id}
                    className="glass-card p-4 flex flex-col items-center gap-3 group cursor-default"
                    style={{ borderColor: s.border }}
                  >
                    {/* Table icon */}
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
                      <Icon name="chair" className="w-8 h-8" style={{ color: s.color }} />
                    </div>

                    {/* Table info */}
                    <div className="text-center">
                      <p className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                        Table {table.table_number}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {table.seats || '—'} seats
                      </p>
                    </div>

                    {/* Status select */}
                    <div className="w-full relative">
                      <select
                        value={table.status}
                        onChange={e => handleStatusChange(table.id, e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl text-xs font-bold text-center appearance-none cursor-pointer transition-all"
                        style={{
                          background: s.bg,
                          border: `1.5px solid ${s.border}`,
                          color: s.color,
                          outline: 'none',
                        }}
                      >
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="reserved">Reserved</option>
                      </select>
                      {/* chevron */}
                      <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3" fill="none" stroke={s.color} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </CashierLayout>
  )
}

export default Floor
