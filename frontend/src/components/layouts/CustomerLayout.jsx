import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getFloors, getTablesByFloor, createTableSession } from '../../services/cafe.service'
import ThemeToggle from '../ThemeToggle'
import BackgroundBlobs from '../BackgroundBlobs'

const CustomerLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [currentTable, setCurrentTable] = useState(sessionStorage.getItem('table_number'))
  const [scrolled, setScrolled] = useState(false)
  const [tableDropdownOpen, setTableDropdownOpen] = useState(false)
  const [floors, setFloors] = useState([])
  const [selectedFloor, setSelectedFloor] = useState(null)
  const [tables, setTables] = useState([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [switchingTable, setSwitchingTable] = useState(null)
  const [tableToast, setTableToast] = useState(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setTableDropdownOpen(false)
      }
    }
    if (tableDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [tableDropdownOpen])

  // Fetch floors when dropdown opens
  const openTableDropdown = useCallback(async () => {
    setTableDropdownOpen(prev => !prev)
    if (!tableDropdownOpen && floors.length === 0) {
      setLoadingTables(true)
      try {
        const floorData = await getFloors()
        setFloors(floorData)
        // Auto-select current floor or first floor
        const currentFloorName = sessionStorage.getItem('floor_name')
        const match = floorData.find(f => f.name === currentFloorName)
        const target = match || floorData[0]
        if (target) {
          setSelectedFloor(target)
          const tableData = await getTablesByFloor(target.id)
          setTables(tableData.sort((a, b) => {
            const numA = parseInt(a.table_number.replace(/\D/g, ''), 10) || 0
            const numB = parseInt(b.table_number.replace(/\D/g, ''), 10) || 0
            return numA - numB
          }))
        }
      } catch (err) {
        console.error('Failed to load tables:', err)
      } finally {
        setLoadingTables(false)
      }
    }
  }, [tableDropdownOpen, floors.length])

  const handleFloorChange = async (floor) => {
    setSelectedFloor(floor)
    setLoadingTables(true)
    try {
      const tableData = await getTablesByFloor(floor.id)
      setTables(tableData.sort((a, b) => {
        const numA = parseInt(a.table_number.replace(/\D/g, ''), 10) || 0
        const numB = parseInt(b.table_number.replace(/\D/g, ''), 10) || 0
        return numA - numB
      }))
    } catch (err) {
      console.error('Failed to load tables:', err)
    } finally {
      setLoadingTables(false)
    }
  }

  const handleTableSelect = async (table) => {
    if (table.status !== 'available') return
    if (switchingTable) return
    setSwitchingTable(table.id)

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

      setCurrentTable(table.table_number)
      setTableDropdownOpen(false)
      setTableToast(`Switched to Table ${table.table_number}`)
      setTimeout(() => setTableToast(null), 2500)

      // Refresh tables to show updated status
      const tableData = await getTablesByFloor(selectedFloor.id)
      setTables(tableData.sort((a, b) => {
        const numA = parseInt(a.table_number.replace(/\D/g, ''), 10) || 0
        const numB = parseInt(b.table_number.replace(/\D/g, ''), 10) || 0
        return numA - numB
      }))
    } catch (err) {
      setTableToast(err.message || 'Failed to switch table')
      setTimeout(() => setTableToast(null), 3000)
    } finally {
      setSwitchingTable(null)
    }
  }

  const isActive = (path) => location.pathname.includes(path)

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--bg-base)', transition: 'background 0.4s ease' }}>
      <BackgroundBlobs />

      {/* Premium Sticky Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 premium-topbar${scrolled ? ' scrolled' : ''}`}>
        {/* Shimmer sweep — subtle periodic shine */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="nav-shimmer-sweep" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/customer/select-floor" className="flex items-center gap-2.5 group flex-shrink-0">
            <div
              className="logo-icon w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'var(--accent-primary)',
                transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.14) rotate(-10deg)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)' }}
            >
              <svg viewBox="0 0 22 22" fill="none" className="w-5 h-5">
                <path d="M7.5 8.5 C7 7 8 5.8 7.5 4" stroke="rgba(0,0,0,0.72)" strokeWidth="1.1" strokeLinecap="round" className="steam-1" />
                <path d="M11 8.5 C10.5 7 11.5 5.8 11 4" stroke="rgba(0,0,0,0.72)" strokeWidth="1.1" strokeLinecap="round" className="steam-2" />
                <path d="M14.5 8.5 C14 7 15 5.8 14.5 4" stroke="rgba(0,0,0,0.72)" strokeWidth="1.1" strokeLinecap="round" className="steam-3" />
                <rect x="4" y="9.5" width="14" height="10" rx="2.5" fill="rgba(0,0,0,0.84)" />
                <path d="M18 12 h1.5 a2 2 0 0 1 0 4 H18" stroke="rgba(0,0,0,0.84)" strokeWidth="1.3" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--accent-primary)' }}>Odoo</span>
              <span className="text-base font-extrabold tracking-tight transition-colors duration-300" style={{ color: 'var(--text-primary)', lineHeight: 1.15 }}>Café</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { path: 'select-floor', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', label: 'Tables' },
              { path: 'browse-menu', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', label: 'Menu' },
              { path: 'order-tracking', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Orders' },
            ].map(item => (
              <Link
                key={item.path}
                to={`/customer/${item.path}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all nav-tab-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Table Selector Button */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={openTableDropdown}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all nav-tab-item ${tableDropdownOpen ? 'active' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden sm:inline font-medium">
                  {currentTable ? `T-${currentTable}` : 'Table'}
                </span>
                {currentTable && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--accent-emerald)' }} />
                )}
              </button>

              {/* Table Dropdown */}
              {tableDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 z-50 rounded-2xl overflow-hidden"
                  style={{
                    width: 'min(340px, calc(100vw - 32px))',
                    maxHeight: 'calc(100vh - 100px)',
                    background: 'var(--bg-surface-solid)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: '0 16px 56px rgba(0,0,0,0.5), 0 0 0 1px var(--border-subtle)',
                    animation: 'cartPanelUp 0.2s cubic-bezier(0.33, 1, 0.68, 1)',
                  }}
                >
                  {/* Header */}
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {currentTable ? `Current: Table ${currentTable}` : 'Select a Table'}
                      </h3>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {currentTable ? 'Tap another to switch' : 'Choose your table'}
                      </span>
                    </div>
                    <button
                      onClick={() => setTableDropdownOpen(false)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:scale-110"
                      style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  {/* Floor Tabs */}
                  {floors.length > 1 && (
                    <div className="flex gap-1 px-3 py-2 overflow-x-auto" style={{ borderBottom: '1px solid var(--border-subtle)', scrollbarWidth: 'none' }}>
                      {floors.map(floor => (
                        <button
                          key={floor.id}
                          onClick={() => handleFloorChange(floor)}
                          className="category-pill flex-shrink-0 text-xs px-3 py-1.5"
                          style={{
                            background: selectedFloor?.id === floor.id ? 'var(--accent-primary)' : 'var(--bg-surface-hover)',
                            color: selectedFloor?.id === floor.id ? '#000' : 'var(--text-secondary)',
                            borderColor: selectedFloor?.id === floor.id ? 'var(--accent-primary)' : 'var(--border-subtle)',
                            fontWeight: selectedFloor?.id === floor.id ? 700 : 500,
                          }}
                        >
                          {floor.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tables Grid */}
                  <div className="px-3 py-3 overflow-y-auto" style={{ maxHeight: '320px', scrollbarWidth: 'thin' }}>
                    {loadingTables ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-subtle)', borderTopColor: 'var(--accent-primary)' }} />
                      </div>
                    ) : tables.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tables on this floor</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {tables.map(table => {
                          const isAvailable = table.status === 'available'
                          const isCurrent = table.table_number === currentTable
                          const isOccupied = table.status === 'occupied'
                          const isReserved = table.status === 'reserved'
                          const isSwitching = switchingTable === table.id

                          return (
                            <button
                              key={table.id}
                              onClick={() => isAvailable && handleTableSelect(table)}
                              disabled={!isAvailable || isSwitching}
                              className="relative flex flex-col items-center justify-center p-3 rounded-xl transition-all text-center"
                              style={{
                                background: isCurrent
                                  ? 'rgba(245, 166, 35, 0.15)'
                                  : isAvailable
                                    ? 'var(--bg-surface-hover)'
                                    : isReserved
                                      ? 'rgba(255, 215, 0, 0.06)'
                                      : 'rgba(255, 77, 77, 0.06)',
                                border: `1.5px solid ${
                                  isCurrent
                                    ? 'var(--accent-primary)'
                                    : isAvailable
                                      ? 'var(--border-subtle)'
                                      : isReserved
                                        ? 'rgba(255, 215, 0, 0.2)'
                                        : 'rgba(255, 77, 77, 0.15)'
                                }`,
                                cursor: isAvailable ? 'pointer' : 'not-allowed',
                                opacity: isSwitching ? 0.6 : 1,
                              }}
                              onMouseEnter={e => {
                                if (isAvailable && !isCurrent) {
                                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
                                  e.currentTarget.style.transform = 'translateY(-2px)'
                                }
                              }}
                              onMouseLeave={e => {
                                if (isAvailable && !isCurrent) {
                                  e.currentTarget.style.borderColor = 'var(--border-subtle)'
                                  e.currentTarget.style.transform = 'translateY(0)'
                                }
                              }}
                            >
                              {isCurrent && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ background: 'var(--accent-primary)', boxShadow: '0 0 6px var(--accent-primary)' }} />
                              )}
                              <span className="text-sm font-bold" style={{ color: isCurrent ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                                {table.table_number}
                              </span>
                              <span className="text-[10px] mt-0.5" style={{
                                color: isCurrent
                                  ? 'var(--accent-primary)'
                                  : isAvailable
                                    ? 'var(--accent-emerald)'
                                    : isReserved
                                      ? 'var(--accent-gold)'
                                      : 'var(--accent-red)',
                                fontWeight: 600,
                              }}>
                                {isCurrent ? 'Current' : isAvailable ? 'Available' : isReserved ? 'Reserved' : 'Occupied'}
                              </span>
                              {table.seats && (
                                <span className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                  {table.seats} seats
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="px-4 py-2.5 flex items-center justify-center gap-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <span className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-emerald)' }} /> Available
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-red)' }} /> Occupied
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-gold)' }} /> Reserved
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Username + Logout — second from last */}
            {user && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.18)' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'var(--accent-primary)', color: 'var(--on-accent-text)' }}>
                  {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden md:inline text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {user.full_name?.split(' ')[0] || user.email}
                </span>
                <button
                  onClick={logout}
                  className="p-1 rounded-lg transition-all hover:scale-110 flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  title="Logout"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}

            {/* Dark Mode Toggle — last */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-16" />

      {/* Mobile Bottom Nav */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-2 pt-2 flex justify-around"
        style={{
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
          background: 'var(--nav-bg-solid)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {[
          { path: 'select-floor', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', label: 'Tables' },
          { path: 'browse-menu', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', label: 'Menu' },
          { path: 'shopping-cart', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', label: currentTable ? `T-${currentTable}` : 'Cart' },
          { path: 'order-tracking', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Orders' },
        ].map(item => (
          <Link
            key={item.path}
            to={`/customer/${item.path}`}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all relative group"
            style={{ color: isActive(item.path) ? 'var(--accent-red)' : 'var(--text-muted)' }}
          >
            <svg
              className="w-5 h-5"
              style={{ transform: isActive(item.path) ? 'scale(1.18)' : 'scale(1)', transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
            </svg>
            <span className="text-[10px] font-medium">{item.label}</span>
            {isActive(item.path) && (
              <span 
                className="absolute -bottom-0.5 w-4 h-0.5 rounded-full" 
                style={{ background: 'var(--accent-red)', boxShadow: '0 0 8px var(--accent-red)' }} 
              />
            )}
          </Link>
        ))}
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 md:pb-6">
        {children}
      </main>

      {/* Table Switch Toast */}
      {tableToast && (
        <div
          className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{
            background: 'var(--accent-primary)',
            color: 'var(--on-accent-text)',
            animation: 'cartPanelUp 0.25s cubic-bezier(0.33, 1, 0.68, 1)',
          }}
        >
          {tableToast}
        </div>
      )}
    </div>
  )
}

export default CustomerLayout

