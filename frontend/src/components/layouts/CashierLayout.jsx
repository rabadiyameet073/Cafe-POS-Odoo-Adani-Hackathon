import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import BackgroundBlobs from '../BackgroundBlobs'
import ThemeToggle from '../ThemeToggle'

const cashierNavItems = [
  { path: 'dashboard', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z', label: 'Dashboard' },
  { path: 'orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Orders' },
  { path: 'floor', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', label: 'Floor' },
  { path: 'session', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Session' },
  { path: 'register', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', label: 'Register' },
]

const CashierLayout = ({ children }) => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (path) => location.pathname.includes(path)

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--bg-base)', transition: 'background 0.4s ease' }}>
      <BackgroundBlobs />

      {/* Premium Sticky Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-30 premium-topbar${scrolled ? ' scrolled' : ''}`}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="nav-shimmer-sweep" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/cashier/dashboard" className="flex items-center gap-2.5 group flex-shrink-0">
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
              <span className="text-base font-extrabold tracking-tight transition-colors duration-300" style={{ color: 'var(--text-primary)', lineHeight: 1.15 }}>POS</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {cashierNavItems.map(item => (
              <Link
                key={item.path}
                to={`/cashier/${item.path}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all nav-tab-item ${isActive(item.path) ? 'active' : ''}`}
                style={{ color: isActive(item.path) ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.18)' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'var(--accent-primary)', color: 'var(--on-accent-text)' }}>
                  {user.full_name ? user.full_name[0].toUpperCase() : 'C'}
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
        {cashierNavItems.map(item => (
          <Link
            key={item.path}
            to={`/cashier/${item.path}`}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all relative group"
            style={{ color: isActive(item.path) ? 'var(--accent-primary)' : 'var(--text-muted)' }}
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
                style={{ background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary)' }}
              />
            )}
          </Link>
        ))}
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  )
}

export default CashierLayout

