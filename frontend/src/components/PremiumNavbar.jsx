import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

const PremiumNavbar = ({ navItems = [], userInfo = null, title = "Odoo", onLogout = () => {} }) => {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (path) => location.pathname === path

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 premium-topbar${scrolled ? ' scrolled' : ''}`}
    >
      {/* Shimmer sweep — periodic highlight */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="nav-shimmer-sweep" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to={navItems[0]?.path || '/'} className="flex items-center gap-2.5 group">
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
            <span
              className="text-base font-extrabold tracking-tight premium-brand"
              style={{ color: 'var(--text-primary)', lineHeight: 1.15 }}
            >
              {title}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all nav-tab-item ${isActive(item.path) ? 'active' : ''}`}
              style={{ color: isActive(item.path) ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
            >
              {item.icon && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
              )}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {userInfo && (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.15)' }}
            >
              <div
                className="logo-icon w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'var(--accent-primary)' }}
              >
                <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {userInfo.name || 'User'}
              </span>
            </div>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl transition-all hover:scale-110 nav-tab-item"
              style={{ color: 'var(--text-muted)' }}
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-xl nav-tab-item"
            style={{ color: 'var(--text-primary)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="md:hidden absolute top-full left-0 right-0 mx-4 mt-2 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(10, 13, 22, 0.96)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(245,166,35,0.15)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            animation: 'menuSlideDown 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <nav className="p-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all nav-tab-item"
                style={{
                  background: isActive(item.path) ? 'rgba(245,166,35,0.12)' : 'transparent',
                  color: isActive(item.path) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  border: isActive(item.path) ? '1px solid rgba(245,166,35,0.28)' : '1px solid transparent',
                }}
              >
                {item.icon && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                )}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

export default PremiumNavbar


