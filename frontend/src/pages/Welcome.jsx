import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function ensureLink(id, href) {
  let el = document.getElementById(id)
  if (el) return el
  el = document.createElement('link')
  el.id = id
  el.rel = 'stylesheet'
  el.href = href
  document.head.appendChild(el)
  return el
}

function removeLink(id) {
  const el = document.getElementById(id)
  if (el) el.remove()
}

function loadScriptOnce(id, src) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id)
    if (existing) return resolve()
    const s = document.createElement('script')
    s.id = id
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

export default function Welcome() {
  const navigate = useNavigate()

  useEffect(() => {
    ensureLink('odoo-landing-styles', '/landing/styles.css')

    // Ensure we can enter the landing immediately (no loader).
    window.__ODOO_CAFE_SKIP_LOADER__ = true

    let cancelled = false
    ;(async () => {
      // Provide globals expected by the original landing JS.
      await loadScriptOnce('odoo-three', 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js')
      await loadScriptOnce('odoo-gsap', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js')
      await loadScriptOnce('odoo-scrolltrigger', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js')
      if (cancelled) return

      // Runs the original IIFE (it will read the DOM ids we render below).
      await import('../../js/app.js')
    })().catch(() => {
      // If something fails loading, still keep the page usable via /login.
    })

    // Requirement: on this page, clicking ANY button goes to login.
    const onClick = e => {
      const btn = e.target?.closest?.('button')
      if (!btn) return
      e.preventDefault()
      e.stopPropagation()
      navigate('/login')
    }
    document.addEventListener('click', onClick, true)

    return () => {
      cancelled = true
      document.removeEventListener('click', onClick, true)
      removeLink('odoo-landing-styles')
      window.__ODOO_CAFE_SKIP_LOADER__ = false
    }
  }, [navigate])

  return (
    <div id="app" className="min-h-screen w-full max-w-[100vw] overflow-x-hidden relative">
      <div id="flash-overlay" className="fixed inset-0 z-[100] pointer-events-none"></div>
      <div id="main-content-wrap" className="w-full max-w-[100vw] overflow-x-hidden">
        <header className="w-full">
          <nav id="navbar" className="nav-premium-blur px-3 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex justify-between items-center h-14 sm:h-16 md:h-[4.5rem]">
              <a
                href="#home"
                id="nav-logo"
                className="font-serif text-lg sm:text-2xl md:text-3xl font-black flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0"
              >
                <span id="nav-logo-icon" className="flex items-center justify-center"></span>
                <span className="truncate">Odoo Cafe</span>
              </a>
              <div className="hidden lg:flex gap-6 xl:gap-8 font-serif font-semibold text-sm tracking-wider text-white/90">
                <a href="#home" className="hover:opacity-100 opacity-85 transition-all relative group py-2">
                  HOME
                </a>
                <a href="#menu" className="hover:opacity-100 opacity-85 transition-all relative group py-2">
                  MENU
                </a>
                <a href="#features-section" className="hover:opacity-100 opacity-85 transition-all relative group py-2">
                  ABOUT
                </a>
                <a href="#contact" className="hover:opacity-100 opacity-85 transition-all relative group py-2">
                  CONTACT
                </a>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <a
                  href="/login"
                  id="nav-order-btn"
                  className="flex items-center gap-2 text-sm font-bold px-4 sm:px-5 py-2.5 rounded-full transition-all hover:scale-105 relative overflow-hidden group min-h-[44px] no-underline"
                >
                  <svg className="cart-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  <span className="hidden sm:inline">Order</span>
                  <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-400"></span>
                </a>
                <button
                  type="button"
                  id="nav-mobile-toggle"
                  className="lg:hidden flex flex-col justify-center items-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg border border-white/25 hover:bg-white/10 transition-all gap-1.5"
                  aria-label="Toggle menu"
                >
                  <span className="nav-hamburger nav-hamburger-1 w-5 h-0.5 bg-white/90 rounded-full transition-all duration-200"></span>
                  <span className="nav-hamburger nav-hamburger-2 w-5 h-0.5 bg-white/90 rounded-full transition-all duration-200"></span>
                  <span className="nav-hamburger nav-hamburger-3 w-5 h-0.5 bg-white/90 rounded-full transition-all duration-200"></span>
                </button>
                <a href="/login" id="nav-login-btn" className="hidden lg:flex shrink-0 no-underline">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Login
                </a>
              </div>
            </div>
            <div id="nav-mobile-dropdown" className="lg:hidden overflow-hidden transition-all duration-300 ease-out max-h-0 opacity-0" data-open="false">
              <div className="px-4 pb-4 pt-2 border-t border-white/5 flex flex-col gap-1">
                <a href="#home" className="nav-mobile-link py-3 px-4 rounded-lg font-serif font-semibold text-sm tracking-wider text-white/90 hover:bg-white/5">
                  HOME
                </a>
                <a href="#menu" className="nav-mobile-link py-3 px-4 rounded-lg font-serif font-semibold text-sm tracking-wider text-white/90 hover:bg-white/5">
                  MENU
                </a>
                <a href="#features-section" className="nav-mobile-link py-3 px-4 rounded-lg font-serif font-semibold text-sm tracking-wider text-white/90 hover:bg-white/5">
                  ABOUT
                </a>
                <a href="#contact" className="nav-mobile-link py-3 px-4 rounded-lg font-serif font-semibold text-sm tracking-wider text-white/90 hover:bg-white/5">
                  CONTACT
                </a>
                <div className="mt-2 pt-2 border-t border-white/10">
                  <a href="/login" id="nav-login-mobile" className="flex items-center gap-2 py-3 px-4 font-serif font-semibold text-sm tracking-wider no-underline">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Login to Dashboard
                  </a>
                </div>
              </div>
            </div>
          </nav>
        </header>

        <main id="main-content" className="min-h-screen w-full max-w-[100vw]">
          <section id="home" className="snap-section relative h-screen w-full flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6">
            <div className="absolute inset-0 bg-noise pointer-events-none"></div>
            <div id="hero-gradient" className="absolute inset-0 pointer-events-none"></div>
            <div id="three-container" className="absolute inset-0 z-0 pointer-events-none w-full h-full overflow-hidden"></div>
            <h1
              id="hero-bg-text"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[18vw] sm:text-[22vw] md:text-[20vw] font-serif font-black opacity-[0.08] leading-none select-none pointer-events-none whitespace-nowrap"
            >
              COFFEE
            </h1>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pt-28 sm:pt-32 pb-16 sm:pb-24">
              <div id="hero-text" className="text-center w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 rounded-2xl">
                <div id="hero-badge" className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-5 sm:mb-7 border">
                  <span id="hero-badge-emoji" className="text-xl sm:text-2xl animate-pulse">
                    ☕
                  </span>
                  <span id="hero-badge-label" className="text-xs sm:text-sm font-bold tracking-widest">
                    COFFEE SPECIAL
                  </span>
                </div>
                <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-white font-bold leading-tight mb-4 sm:mb-6">
                  <span id="hero-headline-1">Freshly Brewed</span>
                  <br />
                  <span id="hero-headline-2" className="inline-block">
                    Happiness
                  </span>
                </h1>
                <p id="hero-subtext" className="max-w-xl mx-auto text-sm sm:text-base md:text-xl text-white font-light mb-7 sm:mb-10 px-1">
                  Premium beans, perfect roast, unforgettable taste
                </p>
                <div className="flex flex-wrap gap-3 sm:gap-4 justify-center pointer-events-auto">
                  <a href="/login" id="hero-cta-order" className="min-h-[44px] no-underline">
                    <svg className="inline w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                    </svg>
                    Order Now <span className="hero-order-arrow">→</span>
                  </a>
                  <a
                    href="/login"
                    className="flex items-center gap-2 px-5 py-3 sm:px-8 sm:py-4 text-sm sm:text-base md:text-lg rounded-full font-bold hover:scale-105 transition-all border border-white/20 hover:border-white/40 min-h-[44px] text-white no-underline"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    View Menu
                  </a>
                </div>
              </div>
            </div>
            <div id="mode-buttons" className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-40 pointer-events-auto"></div>
            <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 hidden md:flex flex-col items-center gap-2 text-white/40 text-xs tracking-widest">
              <span className="rotate-90">SCROLL</span>
              <div className="w-px h-16 bg-gradient-to-b from-white/40 to-transparent animate-pulse"></div>
            </div>
          </section>

          <section id="stats-section" className="snap-section min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-4 sm:px-6 lg:px-8 py-12">
            <div id="stats-gradient" className="absolute inset-0"></div>
            <div className="max-w-6xl w-full mx-auto">
              <div id="stats-grid" className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8"></div>
            </div>
            <div id="stats-marquee-wrap" className="marquee-wrap w-screen py-4 sm:py-5 overflow-hidden whitespace-nowrap mt-10 sm:mt-14">
              <div className="inline-flex animate-marquee" id="stats-marquee-inner"></div>
            </div>
          </section>

          <section id="features-section" className="snap-section min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-4 sm:px-6 lg:px-8 py-12">
            <div className="absolute inset-0 bg-noise pointer-events-none"></div>
            <div className="max-w-6xl w-full mx-auto relative">
              <div className="text-center mb-8 sm:mb-12 md:mb-16">
                <span id="features-badge" className="feature-heading inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mb-3 sm:mb-4">
                  WHY CHOOSE US
                </span>
                <h2 className="feature-heading font-serif text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-3 sm:mb-4">
                  The <span id="features-mode-label">COFFEE</span> Experience
                </h2>
                <p className="feature-heading text-white/85 max-w-2xl mx-auto text-sm sm:text-base">
                  Discover what makes us different. Quality ingredients, expert preparation, and passion in every bite.
                </p>
              </div>
              <div id="features-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"></div>
            </div>
          </section>

          <section id="menu" className="snap-section min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-4 sm:px-6 lg:px-8 py-12">
            <div id="menu-gradient" className="absolute inset-0"></div>
            <div className="max-w-6xl w-full mx-auto relative">
              <div className="text-center mb-8 sm:mb-12 md:mb-16">
                <span id="menu-badge" className="menu-heading inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mb-3 sm:mb-4">
                  OUR MENU
                </span>
                <h2 className="menu-heading font-serif text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-3 sm:mb-4">
                  Popular <span id="menu-mode-label">COFFEE</span> Items
                </h2>
                <p className="menu-heading text-white/85 max-w-2xl mx-auto text-sm sm:text-base">Hand-picked favorites loved by our customers</p>
              </div>
              <div id="menu-items" className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"></div>
              <div className="menu-heading text-center mt-8 sm:mt-12">
                <a
                  href="/login"
                  id="menu-view-full"
                  className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-full font-bold text-white border-2 hover:scale-105 transition-transform duration-300 group text-sm sm:text-base min-h-[44px] no-underline"
                >
                  View Full Menu <span className="group-hover:translate-x-1 transition-transform">→</span>
                </a>
              </div>
            </div>
          </section>

          <section id="testimonials-section" className="snap-section min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-4 sm:px-6 lg:px-8 py-12">
            <div className="absolute inset-0 bg-noise pointer-events-none"></div>
            <div className="max-w-6xl w-full mx-auto relative">
              <div className="text-center mb-8 sm:mb-12 md:mb-16">
                <span id="testimonials-badge" className="test-heading inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mb-3 sm:mb-4">
                  TESTIMONIALS
                </span>
                <h2 className="test-heading font-serif text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-3 sm:mb-4">
                  What People <span id="testimonials-accent">Say</span>
                </h2>
              </div>
              <div id="testimonials-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"></div>
            </div>
          </section>

          <section id="quote-section" className="snap-section min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-4 sm:px-6 py-12">
            <div id="quote-gradient" className="absolute inset-0"></div>
            <div className="relative z-10 max-w-4xl w-full mx-auto text-center">
              <div className="quote-mark text-5xl sm:text-6xl md:text-8xl mb-4 sm:mb-8 opacity-30" id="quote-mark">
                &quot;
              </div>
              <h2
                className="quote-text font-serif text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-relaxed mb-6 sm:mb-8 px-2 sm:px-4"
                id="quote-text"
              ></h2>
              <div className="quote-badge inline-flex items-center gap-2 sm:gap-3 px-4 py-2.5 sm:px-6 sm:py-3 rounded-full hover-lift cursor-default" id="quote-badge">
                <span id="quote-emoji" className="text-xl sm:text-2xl">
                  ☕
                </span>
                <span id="quote-brand" className="font-bold">
                  Odoo Cafe
                </span>
              </div>
            </div>
          </section>

          <section id="contact" className="snap-section min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-4xl w-full mx-auto">
              <div id="cta-card" className="cta-card glass rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 text-center relative overflow-hidden animate-subtle-pulse">
                <div id="cta-banner" className="absolute top-0 left-0 right-0 z-20 py-2 sm:py-3 px-4 text-center animate-pulse">
                  <span id="cta-banner-text" className="text-xs sm:text-sm md:text-base font-bold tracking-widest uppercase">
                    🚀 Coming Soon — Online Ordering! 🚀
                  </span>
                </div>
                <div id="cta-gradient" className="absolute inset-0"></div>
                <div className="relative z-10 pt-6 sm:pt-8">
                  <span id="cta-emoji" className="cta-inner text-5xl sm:text-6xl md:text-8xl block mb-4 sm:mb-6">
                    ☕
                  </span>
                  <h2 className="cta-inner font-serif text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
                    Ready to <span id="cta-accent">Order?</span>
                  </h2>
                  <p className="cta-inner text-white/85 mb-6 sm:mb-8 max-w-xl mx-auto text-sm sm:text-base">
                    Join thousands of happy customers. Order online for pickup or delivery.
                  </p>
                  <div className="cta-inner flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                    <a
                      href="/login"
                      id="cta-order-btn"
                      className="group flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-full font-bold text-base sm:text-lg transition-transform hover:scale-105 min-h-[44px] no-underline"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                      </svg>
                      Order Online
                    </a>
                    <a
                      href="/login"
                      className="group flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-full font-bold text-base sm:text-lg border-2 text-white hover:scale-105 transition-transform min-h-[44px] no-underline"
                      id="cta-call-btn"
                    >
                      <svg className="w-5 h-5 group-hover:rotate-12 transition-transform inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      Call Us
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer id="footer" className="footer-parallax-panel w-full relative overflow-hidden">
          <div id="footer-glow" className="absolute inset-0 pointer-events-none"></div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <span className="font-serif font-black text-white/[0.03] text-[18vw] leading-none">ODOO</span>
          </div>
          <div className="max-w-6xl mx-auto w-full relative z-10 px-4 sm:px-6 lg:px-12 py-10 sm:py-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-8 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span id="footer-emoji" className="text-4xl drop-shadow-lg">
                  ☕
                </span>
                <div>
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-white">Odoo Cafe</div>
                  <p className="text-white/45 text-xs mt-0.5 max-w-xs">Premium cafe &amp; food experience — quality in every bite.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 hover:rotate-6 transition-all duration-300 footer-social">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 hover:rotate-6 transition-all duration-300 footer-social">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 hover:rotate-6 transition-all duration-300 footer-social">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="#" aria-label="YouTube" className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 hover:rotate-6 transition-all duration-300 footer-social">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 py-8 border-b border-white/10">
              <div className="footer-col text-center sm:text-left">
                <h4 className="font-bold mb-3 text-xs tracking-widest" id="footer-links-title">
                  EXPLORE
                </h4>
                <ul className="space-y-2 text-sm text-white/55">
                  <li>
                    <a href="#home" className="hover:text-white/90 transition-colors">
                      Home
                    </a>
                  </li>
                  <li>
                    <a href="#menu" className="hover:text-white/90 transition-colors">
                      Our Menu
                    </a>
                  </li>
                  <li>
                    <a href="#features-section" className="hover:text-white/90 transition-colors">
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="#contact" className="hover:text-white/90 transition-colors">
                      Contact &amp; Order
                    </a>
                  </li>
                </ul>
              </div>
              <div className="footer-col text-center">
                <h4 className="font-bold mb-3 text-xs tracking-widest" id="footer-hours-title">
                  HOURS
                </h4>
                <ul className="space-y-2 text-sm text-white/55">
                  <li>
                    Mon – Fri <span className="text-white/80">7AM – 11PM</span>
                  </li>
                  <li>
                    Saturday <span className="text-white/80">8AM – 12AM</span>
                  </li>
                  <li>
                    Sunday <span className="text-white/80">8AM – 10PM</span>
                  </li>
                </ul>
              </div>
              <div className="footer-col text-center sm:text-right">
                <h4 className="font-bold mb-3 text-xs tracking-widest" id="footer-contact-title">
                  CONTACT
                </h4>
                <ul className="space-y-2 text-sm text-white/55">
                  <li className="flex items-center justify-center sm:justify-end gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    123 Cafe Street, Downtown
                  </li>
                  <li className="flex items-center justify-center sm:justify-end gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    +1 (555) 123-4567
                  </li>
                  <li className="flex items-center justify-center sm:justify-end gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    hello@odoocafe.com
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-6 text-center">
              <p className="text-white/30 text-xs">© 2024 Odoo Cafe. All rights reserved.</p>
              <div className="flex flex-wrap gap-4 justify-center text-white/30 text-xs">
                <a href="#" className="hover:text-white/70 transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-white/70 transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-white/70 transition-colors">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

