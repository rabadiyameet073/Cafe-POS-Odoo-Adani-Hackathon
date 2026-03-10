import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getDefaultRoute } from '../utils/constants'
import { showToast } from '../components/Toast'
import ThemeToggle from '../components/ThemeToggle'

/* ─── Tiny inline SVGs ──────────────────────────────────────── */
const Ico = {
  email: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  lock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  eyeOn: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  eyeOff: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" /></svg>,
  arrow: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>,
  chevD: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
  warn: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  ok: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>,
  err: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
  check: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,

  // role icons (slightly larger for dropdown rows)
  user: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  card: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
  chef: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>,
  shield: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
}

/* ─── Floating input field ───────────────────────────────────── */
const Field = ({ label, icon, value, onChange, onFocus, onBlur, focused, type = 'text', suffix }) => {
  const active = focused || !!value
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', zIndex: 4, color: focused ? '#E53E3E' : 'rgba(255,185,75,.45)', display: 'flex', pointerEvents: 'none', transition: 'color .22s' }}>
        {icon}
      </span>
      <label style={{
        position: 'absolute', zIndex: 3, pointerEvents: 'none', lineHeight: 1, whiteSpace: 'nowrap',
        left: active ? 10 : 37,
        top: active ? -9 : '50%',
        transform: active ? 'none' : 'translateY(-50%)',
        fontSize: active ? 10 : 13.5,
        fontWeight: active ? 700 : 400,
        color: focused ? '#E53E3E' : active ? 'rgba(255,195,90,.75)' : 'rgba(255,185,75,.4)',
        background: active ? 'rgba(9,3,1,.88)' : 'transparent',
        padding: active ? '0 5px' : 0,
        letterSpacing: active ? '.07em' : 0,
        transition: 'all .22s cubic-bezier(.16,1,.3,1)',
      }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange} onFocus={onFocus} onBlur={onBlur}
        style={{
          width: '100%', boxSizing: 'border-box',
          paddingTop: 13, paddingBottom: 13, paddingLeft: 37, paddingRight: suffix ? 42 : 13,
          borderRadius: 11, fontSize: 13.5, fontWeight: 400, outline: 'none', appearance: 'none',
          background: focused ? 'rgba(229,62,62,.06)' : 'rgba(255,255,255,.05)',
          border: `1.5px solid ${focused ? 'rgba(229,62,62,.55)' : 'rgba(220,140,55,.18)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(229,62,62,.10), 0 0 20px rgba(229,62,62,.08), inset 0 1px 0 rgba(255,255,255,.04)' : 'inset 0 1px 0 rgba(255,255,255,.03)',
          color: '#FFF5E8',
          transition: 'all .28s cubic-bezier(.16,1,.3,1)',
        }}
      />
      {suffix}
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────── */
const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [focused, setFocused] = useState(null)
  const [greeting, setGreeting] = useState('')
  const [demoOpen, setDemoOpen] = useState(false)
  const [selectedRole, setRole] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const cardRef = useRef(null)
  const demoRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning ☀️' : h < 17 ? 'Good afternoon ☁️' : 'Good evening 🌙')
    return () => clearTimeout(t)
  }, [])

  // Close demo dropdown on outside click
  useEffect(() => {
    const handler = e => { if (demoRef.current && !demoRef.current.contains(e.target)) setDemoOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* ── particles ── */
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return
    const ctx = cv.getContext('2d'); let anim; const pts = []; const N = 42; const m = { x: -999, y: -999 }
    const sz = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; ctx.scale(devicePixelRatio, devicePixelRatio) }
    sz(); window.addEventListener('resize', sz)
    const mv = e => { m.x = e.clientX; m.y = e.clientY }; window.addEventListener('mousemove', mv)
    for (let i = 0; i < N; i++) pts.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, s: Math.random() * 2 + .5, vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28, o: Math.random() * .38 + .06, p: Math.random() * Math.PI * 2, ps: Math.random() * .016 + .004 })
    const draw = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      pts.forEach((p, i) => {
        const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy)
        if (d < 130) { const f = (130 - d) / 130; p.x -= dx * f * .02; p.y -= dy * f * .02 }
        p.x += p.vx; p.y += p.vy; p.p += p.ps
        if (p.x < -6) p.x = innerWidth + 6; if (p.x > innerWidth + 6) p.x = -6
        if (p.y < -6) p.y = innerHeight + 6; if (p.y > innerHeight + 6) p.y = -6
        const pf = Math.sin(p.p) * .25 + 1
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * pf, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,185,75,${p.o * pf * .58})`; ctx.fill()
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j]; const dd = Math.hypot(p.x - q.x, p.y - q.y)
          if (dd < 88) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = `rgba(255,185,75,${.05 * (1 - dd / 88)})`; ctx.lineWidth = .5; ctx.stroke() }
        }
      })
      anim = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(anim); window.removeEventListener('resize', sz); window.removeEventListener('mousemove', mv) }
  }, [])

  /* ── 3D tilt ── */
  const onMove = useCallback(e => {
    const c = cardRef.current; if (!c) return
    const r = c.getBoundingClientRect()
    c.style.transform = `perspective(900px) rotateX(${((e.clientY - r.top) / r.height - .5) * -6}deg) rotateY(${((e.clientX - r.left) / r.width - .5) * 6}deg) scale3d(1.01,1.01,1.01)`
  }, [])
  const onLeave = useCallback(() => { if (cardRef.current) cardRef.current.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale3d(1,1,1)' }, [])

  const ripple = e => {
    const b = e.currentTarget, r = b.getBoundingClientRect()
    const el = document.createElement('span'); el.className = 'lp-rip'
    el.style.left = `${e.clientX - r.left}px`; el.style.top = `${e.clientY - r.top}px`
    b.appendChild(el); setTimeout(() => el.remove(), 700)
  }

  const toast$ = (msg, type = 'success') => { showToast(msg, type) }

  const demos = [
    { role: 'Customer', email: 'customer@demo.com', accent: '#E53E3E', icon: Ico.user, desc: 'Browse & order food' },
    { role: 'Cashier', email: 'cashier@demo.com', accent: '#D69E2E', icon: Ico.card, desc: 'Process payments' },
    { role: 'Kitchen', email: 'kitchen@demo.com', accent: '#C05621', icon: Ico.chef, desc: 'Manage kitchen orders' },
  ]

  const pickDemo = d => {
    setEmail(d.email); setPassword('demo123'); setRole(d.role); setError(''); setDemoOpen(false)
  }

  const handleSubmit = async e => {
    e.preventDefault(); setError('')
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    try {
      const res = await login({ email, password })
      toast$(`Welcome back, ${res.user.full_name}! ☕`)
      setTimeout(() => navigate(res.user.role === 'customer' ? '/customer/select-floor' : getDefaultRoute(res.user.role)), 500)
    } catch (err) { setError(err.message || 'Login failed. Make sure the backend is running.') }
    finally { setLoading(false) }
  }

  const sg = i => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(18px)',
    transition: `opacity .6s ease ${.06 + i * .08}s, transform .6s cubic-bezier(.16,1,.3,1) ${.06 + i * .08}s`
  })

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* ── Backgrounds ── */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'url(/cafe-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(13, 7, 4, 0.78)', zIndex: 1 }} />
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }} />

      {/* Ambient glows */}
      <div style={{ position: 'fixed', top: -100, left: -80, width: 420, height: 420, borderRadius: '50%', background: 'rgba(200,65,10,.12)', filter: 'blur(90px)', zIndex: 2, animation: 'lpFloat 10s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -80, right: -60, width: 380, height: 380, borderRadius: '50%', background: 'rgba(170,85,0,.09)', filter: 'blur(80px)', zIndex: 2, animation: 'lpFloat 12s ease-in-out infinite reverse', pointerEvents: 'none' }} />

      {/* ── Premium text watermark ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 3, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* ODOO — top left, large outline */}
        <div style={{ position: 'absolute', top: -14, left: -8, fontSize: 'clamp(92px,18vw,185px)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, color: 'transparent', WebkitTextStroke: '2px rgba(214,158,46,0.28)', textTransform: 'uppercase', userSelect: 'none', animation: 'lpWmBreath 6s ease-in-out infinite' }}>ODOO</div>
        {/* CAFE — bottom right, large outline */}
        <div style={{ position: 'absolute', bottom: -18, right: -10, fontSize: 'clamp(92px,18vw,185px)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, color: 'transparent', WebkitTextStroke: '2px rgba(214,158,46,0.22)', textTransform: 'uppercase', userSelect: 'none', animation: 'lpWmBreath 6s ease-in-out 3s infinite' }}>CAFE</div>
        {/* Rotated tagline — left edge */}
        <div style={{ position: 'absolute', top: '50%', left: 22, transform: 'translateY(-50%) rotate(-90deg)', transformOrigin: 'left center', fontSize: 11, fontWeight: 700, letterSpacing: '0.32em', color: 'rgba(214,158,46,0.22)', textTransform: 'uppercase', userSelect: 'none', whiteSpace: 'nowrap', animation: 'lpWmBreath 7s ease-in-out 1s infinite' }}>RESTAURANT · POS</div>
        {/* Centre ghost */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 'clamp(36px,7vw,72px)', fontWeight: 900, letterSpacing: '0.22em', color: 'rgba(255,190,70,0.07)', textTransform: 'uppercase', userSelect: 'none', whiteSpace: 'nowrap', animation: 'lpWmBreath 9s ease-in-out 1.5s infinite' }}>ODOO CAFE</div>
      </div>

      {/* ── Top accent bar ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 50, background: '#E53E3E', animation: 'lpBlink 2.6s ease-in-out infinite' }} />

      {/* ── Theme Toggle ── */}
      <div style={{ position: 'fixed', top: 14, right: 18, zIndex: 60 }}>
        <ThemeToggle />
      </div>

      {/* ── Page layout ── */}
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '52px 20px' }}>
        <div ref={cardRef} onMouseMove={onMove} onMouseLeave={onLeave}
          style={{ width: '100%', maxWidth: 420, transition: 'transform .15s ease-out', transformStyle: 'preserve-3d', willChange: 'transform' }}>

          {/* ── Glass card ── */}
          <div style={{ borderRadius: 28, padding: 'clamp(20px, 5vw, 36px) clamp(18px, 4.5vw, 34px) clamp(18px, 4vw, 30px)', background: 'rgba(11,5,2,.52)', backdropFilter: 'blur(30px) saturate(155%)', WebkitBackdropFilter: 'blur(30px) saturate(155%)', border: '1px solid rgba(220,140,55,.20)', boxShadow: '0 14px 70px rgba(0,0,0,.60), inset 0 1px 0 rgba(255,200,100,.09), inset 0 -1px 0 rgba(0,0,0,.28)' }}>

            {/* ── Section 1: Brand header ── */}
            <div style={{ ...sg(0), marginBottom: 22 }}>
              {/* Greeting pill */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: '4px 11px', borderRadius: 99, fontSize: 10.5, fontWeight: 600, color: 'rgba(255,205,110,.70)', background: 'rgba(214,158,46,.09)', border: '1px solid rgba(214,158,46,.20)' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D69E2E', display: 'inline-block', animation: 'lpBlink 2.2s ease-in-out infinite' }} />
                {greeting}
              </div>

              {/* Logo + name row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 18 }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#C05621', boxShadow: '0 4px 22px rgba(229,62,62,.48)', animation: mounted ? 'lpIconPulse 3.2s ease-in-out infinite' : 'none' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1 }}>
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                    <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.1)', animation: 'lpBlink 2.4s ease-in-out infinite' }} />
                </div>
                <div>
                  <div style={{ fontSize: 19, fontWeight: 900, color: '#FFF5E8', letterSpacing: '-.01em', lineHeight: 1.1 }}>Odoo Cafe</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#D69E2E', letterSpacing: '.2em', marginTop: 2 }}>RESTAURANT POS</div>
                </div>
              </div>

              <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF5E8', letterSpacing: '-.01em', lineHeight: 1.25 }}>Welcome back</div>
              <div style={{ fontSize: 13, color: 'rgba(255,210,145,.45)', marginTop: 5 }}>Sign in to access your dashboard</div>
            </div>

            {/* ── Section 2: Form ── */}
            <form onSubmit={handleSubmit} style={{ ...sg(1) }}>

              {/* Email */}
              <div style={{ marginBottom: 13 }}>
                <Field label="Email address" icon={Ico.email} value={email} focused={focused === 'email'}
                  onChange={e => { setEmail(e.target.value); setRole(null) }}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />
              </div>

              {/* Password */}
              <div style={{ marginBottom: selectedRole ? 10 : 16 }}>
                <Field label="Password" icon={Ico.lock} value={password} type={showPw ? 'text' : 'password'} focused={focused === 'password'}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  suffix={
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 5, cursor: 'pointer', background: 'transparent', border: 'none', color: 'rgba(255,185,75,.42)', padding: 5, borderRadius: 6, display: 'flex', transition: 'color .2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#E53E3E'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,185,75,.42)'}
                    >{showPw ? Ico.eyeOff : Ico.eyeOn}</button>
                  }
                />
              </div>

              {/* Selected role badge */}
              {selectedRole && (() => {
                const d = demos.find(x => x.role === selectedRole)
                return (
                  <div style={{ marginBottom: 13, padding: '8px 12px', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 8, background: `${d.accent}18`, border: `1px solid ${d.accent}40` }}>
                    <span style={{ color: d.accent, display: 'flex' }}>{d.icon}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,220,150,0.85)', flex: 1 }}>
                      Demo: <strong style={{ color: d.accent }}>{d.role}</strong>
                    </span>
                    <button type="button" onClick={() => { setEmail(''); setPassword(''); setRole(null) }}
                      style={{ background: 'transparent', border: 'none', color: 'rgba(255,185,75,.4)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 2, display: 'flex' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#E53E3E'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,185,75,.4)'}
                    >✕</button>
                  </div>
                )
              })()}

              {/* Error */}
              {error && (
                <div style={{ marginBottom: 13, padding: '10px 13px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(229,62,62,.13)', color: '#FC8181', border: '1px solid rgba(229,62,62,.28)', animation: 'lpShake .46s ease-out' }}>
                  {Ico.warn} {error}
                </div>
              )}

              {/* ── Sign In button ── */}
              <div style={{ position: 'relative', marginTop: 4 }}>
                {/* SVG neon running-light border */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }} viewBox="0 0 400 50" preserveAspectRatio="none">
                  <rect x="1" y="1" width="398" height="48" rx="11" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeDasharray="65 335" style={{ filter: 'drop-shadow(0 0 7px #3B82F6) drop-shadow(0 0 14px rgba(59,130,246,0.5))', animation: 'lpNeon 2s linear infinite' }} />
                  <rect x="1" y="1" width="398" height="48" rx="11" fill="none" stroke="#06B6D4" strokeWidth="1.2" strokeDasharray="48 352" style={{ filter: 'drop-shadow(0 0 5px #06B6D4)', animation: 'lpNeon 2s linear infinite', animationDelay: '-1s' }} />
                </svg>
                <button type="submit" disabled={loading} onClick={ripple}
                  style={{ width: '100%', padding: '13px 0', borderRadius: 11, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13.5, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative', overflow: 'hidden', opacity: loading ? .65 : 1, letterSpacing: '.02em', textShadow: '0 1px 3px rgba(0,0,0,.35)', background: '#C53030', animation: 'lpBlink 2.8s ease-in-out infinite', boxShadow: '0 0 22px rgba(229,62,62,.40), 0 5px 18px rgba(0,0,0,.30)', transition: 'all .22s cubic-bezier(.16,1,.3,1)' }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.boxShadow = '0 0 38px rgba(229,62,62,.65), 0 6px 22px rgba(0,0,0,.36)'; e.currentTarget.style.transform = 'translateY(-2px) scale(1.012)' } }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 22px rgba(229,62,62,.40), 0 5px 18px rgba(0,0,0,.30)'; e.currentTarget.style.transform = '' }}
                  onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(.975)' }}
                  onMouseUp={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px) scale(1.012)' }}
                >
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.08)', animation: 'lpBlink 2s ease-in-out infinite', pointerEvents: 'none' }} />
                  {loading
                    ? <>{[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', animation: `lpDot .6s ease-in-out ${i * .15}s infinite` }} />)}<span style={{ marginLeft: 7, position: 'relative', zIndex: 1 }}>Signing in...</span></>
                    : <><span style={{ position: 'relative', zIndex: 1 }}>Sign In</span><span style={{ position: 'relative', zIndex: 1 }}>{Ico.arrow}</span></>
                  }
                </button>
              </div>
            </form>

            {/* ── Section 3: Quick Demo accordion ── */}
            <div style={{ ...sg(2), marginTop: 16 }} ref={demoRef}>

              {/* Trigger button */}
              <button
                type="button"
                onClick={() => setDemoOpen(v => !v)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 11, cursor: 'pointer',
                  background: demoOpen ? 'rgba(214,158,46,.10)' : 'rgba(255,255,255,.05)',
                  border: `1.5px solid ${demoOpen ? 'rgba(214,158,46,.35)' : 'rgba(220,140,55,.18)'}`,
                  color: 'rgba(255,205,110,.75)', fontSize: 12.5, fontWeight: 700,
                  transition: 'all .22s cubic-bezier(.16,1,.3,1)',
                }}
                onMouseEnter={e => { if (!demoOpen) { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.borderColor = 'rgba(220,140,55,.28)' } }}
                onMouseLeave={e => { if (!demoOpen) { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.borderColor = 'rgba(220,140,55,.18)' } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Zap icon */}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Quick Demo
                </div>
                <span style={{ display: 'flex', transition: 'transform .22s', transform: demoOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  {Ico.chevD}
                </span>
              </button>

              {/* ── Inline accordion panel ── */}
              <div style={{
                overflow: 'hidden',
                maxHeight: demoOpen ? '320px' : '0px',
                opacity: demoOpen ? 1 : 0,
                transition: 'max-height .38s cubic-bezier(.16,1,.3,1), opacity .25s ease',
                marginTop: demoOpen ? 8 : 0,
              }}>
                <div style={{
                  borderRadius: 14, overflow: 'hidden',
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(220,140,55,.22)',
                  boxShadow: 'inset 0 1px 0 rgba(255,200,100,.06)',
                }}>
                  {/* Panel header */}
                  <div style={{ padding: '9px 14px 8px', borderBottom: '1px solid rgba(214,158,46,.10)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: 'rgba(214,158,46,.60)' }}>Select a demo role</span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(255,210,130,.42)', fontFamily: 'monospace', background: 'rgba(255,255,255,.06)', padding: '2px 8px', borderRadius: 5 }}>pw: demo123</span>
                  </div>

                  {/* 3-column role grid — 2 cols on tiny screens */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 6, padding: '10px' }}>
                    {demos.map(d => {
                      const sel = selectedRole === d.role
                      return (
                        <button key={d.role} type="button" onClick={() => pickDemo(d)}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                            padding: '13px 8px 11px', borderRadius: 11, cursor: 'pointer', textAlign: 'center',
                            background: sel ? `${d.accent}20` : 'rgba(255,255,255,.04)',
                            border: `1.5px solid ${sel ? d.accent + '60' : 'rgba(220,140,55,.14)'}`,
                            boxShadow: sel ? `0 0 18px ${d.accent}30, inset 0 1px 0 rgba(255,255,255,.08)` : 'none',
                            transition: 'all .22s cubic-bezier(.16,1,.3,1)', position: 'relative', overflow: 'hidden',
                          }}
                          onMouseEnter={e => { if (!sel) { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.borderColor = `${d.accent}35` } }}
                          onMouseLeave={e => { if (!sel) { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.borderColor = 'rgba(220,140,55,.14)' } }}
                        >
                          {/* Shine on selected */}
                          {sel && <div style={{ position: 'absolute', inset: 0, background: `${d.accent}1A`, pointerEvents: 'none' }} />}
                          {/* Icon */}
                          <div style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: sel ? d.accent : `${d.accent}22`, border: `1.5px solid ${d.accent}50`, color: sel ? '#fff' : d.accent, position: 'relative', flexShrink: 0, transition: 'all .22s', boxShadow: sel ? `0 4px 14px ${d.accent}55` : 'none' }}>
                            {d.icon}
                            {sel && <div style={{ position: 'absolute', top: -5, right: -5, width: 15, height: 15, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: d.accent, fontSize: 9, boxShadow: `0 2px 6px ${d.accent}55` }}>{Ico.check}</div>}
                          </div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: sel ? '#FFF5E8' : 'rgba(255,210,145,.78)', lineHeight: 1.15 }}>{d.role}</div>
                          <div style={{ fontSize: 10, color: sel ? `${d.accent}cc` : 'rgba(255,185,90,.38)', fontWeight: 500, lineHeight: 1.3 }}>{d.desc}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 4: Footer links ── */}
            <div style={{ ...sg(3), marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(220,140,55,.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Link to="/signup" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: '#E53E3E', textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#FC8181'}
                onMouseLeave={e => e.currentTarget.style.color = '#E53E3E'}
              >Create account {Ico.arrow}</Link>
              <button type="button" onClick={() => navigate('/customer/select-floor')}
                style={{ fontSize: 12, color: 'rgba(255,200,120,.34)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px 9px', borderRadius: 7, transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,210,145,.68)'; e.currentTarget.style.background = 'rgba(255,255,255,.05)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,200,120,.34)'; e.currentTarget.style.background = 'transparent' }}
              >Skip as guest</button>
            </div>

          </div>{/* /card */}
        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes lpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-30px)}}
        @keyframes lpBar{0%{background-position:0%}100%{background-position:300%}}
        @keyframes lpBlink{0%,100%{opacity:1}50%{opacity:.18}}
        @keyframes lpIconPulse{0%,100%{box-shadow:0 4px 22px rgba(229,62,62,.44)}50%{box-shadow:0 4px 36px rgba(229,62,62,.70)}}
        @keyframes lpShine{0%,72%,100%{transform:translateX(-120%)}42%{transform:translateX(120%)}}
        @keyframes lpBtnShift{0%{background-position:0%}50%{background-position:100%}100%{background-position:0%}}
        @keyframes lpBtnShine{0%{background-position:240%}100%{background-position:-240%}}
        @keyframes lpDot{0%,80%,100%{transform:scale(.6);opacity:.5}40%{transform:scale(1.25);opacity:1}}
        @keyframes lpShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
        @keyframes lpToast{0%{opacity:0;transform:translateY(-16px) scale(.93)}100%{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes lpWmBreath{0%,100%{opacity:1}50%{opacity:.55}}
        @keyframes lpNeon{0%{stroke-dashoffset:0}100%{stroke-dashoffset:-800}}
        .lp-rip{position:absolute;border-radius:50%;background:rgba(255,255,255,.2);width:10px;height:10px;pointer-events:none;transform:translate(-50%,-50%) scale(0);animation:lpRipOut .68s ease-out forwards}
        @keyframes lpRipOut{to{transform:translate(-50%,-50%) scale(48);opacity:0}}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px rgba(9,3,1,.7) inset !important;-webkit-text-fill-color:#FFF5E8 !important}
        input::placeholder{color:transparent}
      `}</style>
    </div>
  )
}

export default Login
