import { useState, useEffect, useCallback, useRef } from 'react'

/* ═══════════════════════════════════════════════════
   Global Toast System — Single Instance Architecture
   ═══════════════════════════════════════════════════ */

let toastCallback = null
let lastToast = { message: '', time: 0 }

export const showToast = (message, type = 'success') => {
  // Deduplicate: ignore identical messages within 800ms
  const now = Date.now()
  if (message === lastToast.message && now - lastToast.time < 800) return
  lastToast = { message, time: now }
  if (toastCallback) toastCallback(message, type)
}

const DURATION = 3800

const typeConfig = {
  success: {
    gradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    accent: '#059669',
    iconBg: 'linear-gradient(135deg, #059669, #10b981)',
    border: 'rgba(5, 150, 105, 0.25)',
    shadow: '0 12px 40px -8px rgba(5, 150, 105, 0.25), 0 4px 12px rgba(0,0,0,0.06)',
    progressGrad: 'linear-gradient(90deg, #059669, #34d399)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  error: {
    gradient: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
    accent: '#dc2626',
    iconBg: 'linear-gradient(135deg, #dc2626, #ef4444)',
    border: 'rgba(220, 38, 38, 0.25)',
    shadow: '0 12px 40px -8px rgba(220, 38, 38, 0.25), 0 4px 12px rgba(0,0,0,0.06)',
    progressGrad: 'linear-gradient(90deg, #dc2626, #f87171)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  },
  info: {
    gradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    accent: '#2563eb',
    iconBg: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    border: 'rgba(37, 99, 235, 0.25)',
    shadow: '0 12px 40px -8px rgba(37, 99, 235, 0.25), 0 4px 12px rgba(0,0,0,0.06)',
    progressGrad: 'linear-gradient(90deg, #2563eb, #60a5fa)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  warning: {
    gradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    accent: '#d97706',
    iconBg: 'linear-gradient(135deg, #d97706, #f59e0b)',
    border: 'rgba(217, 119, 6, 0.25)',
    shadow: '0 12px 40px -8px rgba(217, 119, 6, 0.25), 0 4px 12px rgba(0,0,0,0.06)',
    progressGrad: 'linear-gradient(90deg, #d97706, #fbbf24)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
}

const ToastItem = ({ toast, onDismiss }) => {
  const [exiting, setExiting] = useState(false)
  const c = typeConfig[toast.type] || typeConfig.info

  const handleDismiss = () => {
    setExiting(true)
    setTimeout(() => onDismiss(toast.id), 280)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onDismiss(toast.id), 280)
    }, DURATION)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px 14px 14px',
        borderRadius: 14,
        background: c.gradient,
        border: `1px solid ${c.border}`,
        boxShadow: c.shadow,
        maxWidth: 400,
        minWidth: 280,
        position: 'relative',
        overflow: 'hidden',
        animation: exiting
          ? 'toastExit .28s cubic-bezier(.4,0,1,1) forwards'
          : 'toastEnter .4s cubic-bezier(.22,1,.36,1) forwards',
        willChange: 'transform, opacity',
      }}
    >
      {/* Icon circle */}
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: c.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 4px 12px ${c.accent}40`,
      }}>
        {c.icon}
      </div>

      {/* Message */}
      <span style={{
        flex: 1,
        fontSize: 13.5,
        fontWeight: 600,
        lineHeight: 1.45,
        color: '#1e293b',
        letterSpacing: '-0.01em',
      }}>
        {toast.message}
      </span>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'rgba(0,0,0,0.06)' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 3,
      }}>
        <div style={{
          height: '100%',
          borderRadius: '0 0 14px 14px',
          background: c.progressGrad,
          opacity: 0.6,
          animation: `toastProgress ${DURATION}ms linear forwards`,
        }} />
      </div>
    </div>
  )
}

const Toast = () => {
  const [toasts, setToasts] = useState([])
  const toastsRef = useRef([])

  const addToast = useCallback((msg, typ) => {
    // Prevent duplicate messages still in the stack
    if (toastsRef.current.some(t => t.message === msg)) return
    const id = Date.now() + Math.random()
    const newToast = { id, message: msg, type: typ }
    toastsRef.current = [...toastsRef.current.slice(-3), newToast]
    setToasts([...toastsRef.current])
  }, [])

  const dismiss = useCallback((id) => {
    toastsRef.current = toastsRef.current.filter(t => t.id !== id)
    setToasts([...toastsRef.current])
  }, [])

  useEffect(() => {
    toastCallback = addToast
    return () => { toastCallback = null }
  }, [addToast])

  return (
    <>
      <style>{`
        @keyframes toastEnter {
          0% { opacity: 0; transform: translateX(60px) scale(0.92); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastExit {
          0% { opacity: 1; transform: translateX(0) scale(1); }
          100% { opacity: 0; transform: translateX(60px) scale(0.92); }
        }
        @keyframes toastProgress {
          0% { width: 100%; }
          100% { width: 0%; }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        top: 80,
        right: 20,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </>
  )
}

export default Toast
