import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { getFloors, getTablesByFloor, createTableSession, autoFreeExpiredTables } from '../../services/cafe.service'
import { subscribeToTable, unsubscribeFromChannel } from '../../services/supabase.service'
import { supabase } from '../../services/supabase.service'
import Loading from '../../components/Loading'
import Icon from '../../components/Icons'
import { showToast } from '../../components/Toast'
import { useTheme } from '../../contexts/ThemeContext'

// ─── Timer Hook ───
function useCountdownTimers(tables) {
  const [timers, setTimers] = useState({})

  useEffect(() => {
    // Fetch occupied_until from tables and compute countdown
    const tick = () => {
      const now = Date.now()
      const newTimers = {}
      tables.forEach(t => {
        if (t.status === 'occupied' && t.occupied_until) {
          const endMs = new Date(t.occupied_until).getTime()
          const remaining = Math.max(0, Math.floor((endMs - now) / 1000))
          newTimers[t.id] = remaining
        }
      })
      setTimers(newTimers)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [tables])

  return timers
}

function formatTimer(seconds) {
  if (!seconds || seconds <= 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const Floors = () => {
  const [floors, setFloors] = useState([])
  const [selectedFloor, setSelectedFloor] = useState(null)
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState(false)
  const [floorContentKey, setFloorContentKey] = useState(0)
  const navigate = useNavigate()
  const { isDark } = useTheme()

  const timers = useCountdownTimers(tables)

  useEffect(() => {
    fetchFloors()

    const savedToast = sessionStorage.getItem('_toast')
    if (savedToast) {
      sessionStorage.removeItem('_toast')
      showToast(savedToast, 'info')
    }

    autoFreeExpiredTables().catch(() => { })
    const interval = setInterval(() => {
      autoFreeExpiredTables().then(freed => {
        if (freed && freed.length > 0 && selectedFloor) {
          fetchTables(selectedFloor.id)
        }
      }).catch(() => { })
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedFloor) fetchTables(selectedFloor.id)
  }, [selectedFloor])

  useEffect(() => {
    if (!selectedFloor) return
    const sub = subscribeToTable('tables', `floor_id=eq.${selectedFloor.id}`, (payload) => {
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        setTables(prev => prev.map(t => t.id === payload.new.id ? payload.new : t))
      }
    })
    return () => unsubscribeFromChannel(sub)
  }, [selectedFloor])

  const fetchFloors = async () => {
    try {
      const data = await getFloors()
      setFloors(data)
      if (data.length > 0) setSelectedFloor(data[0])
    } catch (err) {
      showToast(err.message || 'Failed to load floors', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchTables = async (floorId) => {
    try {
      const data = await getTablesByFloor(floorId)
      const sorted = [...data]
        .sort((a, b) => {
          const numA = parseInt(a.table_number.replace(/\D/g, ''), 10) || 0
          const numB = parseInt(b.table_number.replace(/\D/g, ''), 10) || 0
          return numA - numB
        })
      setTables(sorted)
    } catch (err) {
      showToast(err.message || 'Failed to load tables', 'error')
    }
  }

  const selectTable = async (table) => {
    if (table.status !== 'available') {
      showToast('This table is not available', 'error')
      return
    }
    if (selecting) return
    setSelecting(true)

    try {
      const { session, tableToken } = await createTableSession(
        table.id,
        selectedFloor.id,
        table.table_number
      )

      sessionStorage.setItem('table_token', tableToken)
      sessionStorage.setItem('table_number', table.table_number)
      sessionStorage.setItem('table_id', table.id)
      sessionStorage.setItem('session_id', session.id)
      sessionStorage.setItem('floor_name', selectedFloor.name)

      showToast(`Table ${table.table_number} selected! Redirecting to menu...`)
      setTimeout(() => navigate('/customer/browse-menu'), 600)
    } catch (err) {
      showToast(err.message || 'Failed to select table', 'error')
      setSelecting(false)
    }
  }

  if (loading) return <Loading />

  return (
    <CustomerLayout>
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="page-title mb-1">Select Your Table</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Choose a floor and tap an available table to get started</p>
        </div>

        {/* Floor Tabs */}
        {floors.length > 1 && (
          <div className="mb-6 relative" style={{ zIndex: 5 }}>
            <div className="flex gap-2 overflow-x-auto py-3 px-1 -mx-1" style={{ scrollbarWidth: 'none' }}>
              {floors.map((floor) => (
                <button
                  key={floor.id}
                  onClick={() => { if (selectedFloor?.id !== floor.id) { setSelectedFloor(floor); setFloorContentKey(k => k + 1) } }}
                  className={`floor-tab whitespace-nowrap ${selectedFloor?.id === floor.id ? 'active' : ''}`}
                >
                  <span className="mr-1.5">{
                    floor.name.toLowerCase().includes('ground') ? '🏢' :
                    floor.name.toLowerCase().includes('first') || floor.name.toLowerCase().includes('1st') ? '🏗️' :
                    floor.name.toLowerCase().includes('outdoor') || floor.name.toLowerCase().includes('terrace') || floor.name.toLowerCase().includes('garden') ? '🌿' :
                    '🏠'
                  }</span>
                  {floor.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedFloor?.description && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(245,166,35,0.08)', borderLeft: '3px solid var(--accent-primary)', color: 'var(--text-secondary)' }}>
            {selectedFloor.description}
          </div>
        )}

        {/* Tables Grid */}
        <div key={floorContentKey} className="tab-content-enter">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((table) => {
            const remaining = timers[table.id]
            const hasTimer = table.status === 'occupied' && remaining !== undefined && remaining > 0
            const isExpiring = hasTimer && remaining < 300

            const isAvailable = table.status === 'available'
            const isOccupied  = table.status === 'occupied'

            const cardBase = {
              position: 'relative',
              borderRadius: 18,
              padding: '20px 16px 18px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: isAvailable ? 'pointer' : 'not-allowed',
              transition: 'transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease, border-color .22s ease',
              overflow: 'hidden',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              ...(isDark ? (
                isAvailable ? {
                  background: 'rgba(18,14,6,0.80)',
                  border: '1.5px solid rgba(245,158,11,0.28)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.32)',
                } : isOccupied ? {
                  background: 'rgba(20,10,10,0.72)',
                  border: '1.5px solid rgba(248,113,113,0.18)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
                  opacity: 0.8,
                } : {
                  background: 'rgba(10,12,20,0.72)',
                  border: '1.5px solid rgba(96,165,250,0.18)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                  opacity: 0.7,
                }
              ) : (
                isAvailable ? {
                  background: 'rgba(253,246,215,0.96)',
                  border: '1.5px solid rgba(245,158,11,0.32)',
                  boxShadow: '0 4px 20px rgba(245,158,11,0.12), 0 2px 8px rgba(100,60,10,0.06)',
                } : isOccupied ? {
                  background: 'rgba(254,242,242,0.94)',
                  border: '1.5px solid rgba(239,68,68,0.22)',
                  boxShadow: '0 4px 16px rgba(239,68,68,0.08), 0 2px 8px rgba(100,60,10,0.04)',
                  opacity: 0.92,
                } : {
                  background: 'rgba(239,246,255,0.94)',
                  border: '1.5px solid rgba(37,99,235,0.22)',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.08), 0 2px 8px rgba(100,60,10,0.04)',
                  opacity: 0.88,
                }
              ))
            }

            const iconBoxStyle = {
              width: 56, height: 56, borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 4, flexShrink: 0,
              transition: 'transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease',
              ...(isDark ? (
                isAvailable ? {
                  background: 'rgba(245,158,11,0.12)',
                  border: '1.5px solid rgba(245,158,11,0.28)',
                  boxShadow: '0 4px 14px rgba(245,158,11,0.10)',
                } : isOccupied ? {
                  background: 'rgba(248,113,113,0.10)',
                  border: '1.5px solid rgba(248,113,113,0.22)',
                } : {
                  background: 'rgba(96,165,250,0.10)',
                  border: '1.5px solid rgba(96,165,250,0.22)',
                }
              ) : (
                isAvailable ? {
                  background: 'rgba(254,243,199,0.80)',
                  border: '1.5px solid rgba(245,158,11,0.35)',
                  boxShadow: '0 4px 14px rgba(245,158,11,0.14)',
                } : isOccupied ? {
                  background: 'rgba(254,226,226,0.80)',
                  border: '1.5px solid rgba(239,68,68,0.30)',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.10)',
                } : {
                  background: 'rgba(219,234,254,0.80)',
                  border: '1.5px solid rgba(37,99,235,0.30)',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.10)',
                }
              ))
            }

            const statusPillStyle = {
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 99,
              fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
              ...(isAvailable ? {
                background: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(254,243,199,0.85)',
                color: isDark ? '#F59E0B' : '#92400E',
                border: isDark ? '1px solid rgba(245,158,11,0.22)' : '1px solid rgba(245,158,11,0.30)',
              } : isOccupied ? {
                background: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(254,226,226,0.85)',
                color: isDark ? '#F87171' : '#B91C1C',
                border: isDark ? '1px solid rgba(248,113,113,0.22)' : '1px solid rgba(239,68,68,0.30)',
              } : {
                background: isDark ? 'rgba(96,165,250,0.12)' : 'rgba(219,234,254,0.85)',
                color: isDark ? '#60A5FA' : '#1D4ED8',
                border: isDark ? '1px solid rgba(96,165,250,0.22)' : '1px solid rgba(37,99,235,0.30)',
              })
            }

            return (
              <div
                key={table.id}
                style={cardBase}
                onClick={() => selectTable(table)}
                onMouseEnter={e => {
                  if (!isAvailable) return
                  e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'
                  e.currentTarget.style.boxShadow = isDark
                    ? '0 12px 36px rgba(220,38,38,0.22), 0 4px 14px rgba(0,0,0,0.3)'
                    : '0 12px 36px rgba(220,38,38,0.22), 0 4px 14px rgba(0,0,0,0.10)'
                  e.currentTarget.style.borderColor = isDark ? 'rgba(220,38,38,0.55)' : 'rgba(220,38,38,0.55)'
                  const ib = e.currentTarget.querySelector('.tbl-icon-box')
                  if (ib) { ib.style.transform = 'scale(1.1)'; ib.style.boxShadow = isDark ? '0 6px 22px rgba(220,38,38,0.28)' : '0 6px 22px rgba(220,38,38,0.24)' }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = isDark
                    ? '0 4px 20px rgba(0,0,0,0.32)'
                    : '0 4px 20px rgba(220,38,38,0.12), 0 2px 8px rgba(100,60,10,0.05)'
                  e.currentTarget.style.borderColor = isDark ? 'rgba(245,158,11,0.28)' : 'rgba(245,158,11,0.32)'
                  const ib = e.currentTarget.querySelector('.tbl-icon-box')
                  if (ib) { ib.style.transform = ''; ib.style.boxShadow = isDark ? '0 4px 14px rgba(220,38,38,0.10)' : '0 4px 14px rgba(220,38,38,0.14)' }
                }}
                onMouseDown={e => { if (isAvailable) e.currentTarget.style.transform = 'scale(.97)' }}
                onMouseUp={e => { if (isAvailable) e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)' }}
              >
                {/* top highlight */}
                <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: isAvailable ? (isDark ? 'rgba(245,158,11,0.22)' : 'rgba(245,158,11,0.28)') : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)'), borderRadius: 99 }} />

                {/* Icon box */}
                <div className="tbl-icon-box" style={iconBoxStyle}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                    stroke={isAvailable ? (isDark ? '#F59E0B' : '#D97706') : isOccupied ? (isDark ? '#F87171' : '#DC2626') : (isDark ? '#60A5FA' : '#2563EB')}
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {/* table top */}
                    <rect x="2" y="8" width="20" height="3" rx="1.5"/>
                    {/* four legs */}
                    <line x1="5" y1="11" x2="4" y2="20"/>
                    <line x1="19" y1="11" x2="20" y2="20"/>
                    <line x1="9" y1="11" x2="9" y2="20"/>
                    <line x1="15" y1="11" x2="15" y2="20"/>
                    {/* plate / napkin on top */}
                    <circle cx="12" cy="6" r="2"/>
                  </svg>
                </div>

                {/* Table number */}
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-.01em', lineHeight: 1.1, textAlign: 'center' }}>
                  Table {table.table_number}
                </div>

                {/* Seats */}
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {table.seats} seats
                </div>

                {/* Status pill */}
                <div style={statusPillStyle}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: isAvailable ? '#F59E0B' : isOccupied ? '#F87171' : '#60A5FA', display: 'inline-block', flexShrink: 0 }} />
                  {isAvailable ? 'Available' : isOccupied ? 'Occupied' : 'Reserved'}
                </div>

                {/* Timer */}
                {hasTimer && (
                  <div
                    className={isExpiring ? 'animate-pulse-opacity' : ''}
                    style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 8, marginTop: 2,
                    fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                    background: isExpiring ? 'rgba(248,113,113,0.15)' : 'rgba(251,146,60,0.12)',
                    color: isExpiring ? '#F87171' : '#FB923C',
                    border: `1px solid ${isExpiring ? 'rgba(248,113,113,0.3)' : 'rgba(251,146,60,0.25)'}`,
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {formatTimer(remaining)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        </div>{/* end tab-content-enter */}

        {tables.length === 0 && (
          <div className="text-center py-16 section-card">
            <div className="flex justify-center mb-4">
              <Icon name="building" className="w-14 h-14" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>No tables available on this floor</p>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Available — Tap to select</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F87171', display: 'inline-block' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Occupied (timer shows remaining time)</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#60A5FA', display: 'inline-block' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reserved</span>
          </div>
        </div>

      </div>
    </CustomerLayout>
  )
}

export default Floors
