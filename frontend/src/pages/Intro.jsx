import { useEffect, useMemo, useState } from 'react'
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

export default function Intro() {
  const navigate = useNavigate()
  const [percent, setPercent] = useState(0)
  const [showSkip, setShowSkip] = useState(false)

  const letters = useMemo(() => 'PREMIUM DINING EXPERIENCE'.split(''), [])

  useEffect(() => {
    ensureLink('odoo-landing-styles', '/landing/styles.css')

    const tSkip = window.setTimeout(() => setShowSkip(true), 1500)
    const t = window.setInterval(() => {
      setPercent(p => (p >= 100 ? 100 : p + 2))
    }, 60)

    return () => {
      window.clearTimeout(tSkip)
      window.clearInterval(t)
      removeLink('odoo-landing-styles')
    }
  }, [])

  useEffect(() => {
    if (percent >= 100) {
      const t = window.setTimeout(() => navigate('/welcome'), 500)
      return () => window.clearTimeout(t)
    }
  }, [percent, navigate])

  return (
    <div id="loader-wrap" className="loader-wrap">
      <div className="loader-ambient"></div>
      <div className="loader-orb"></div>
      <div className="loader-orbit loader-orbit-1"></div>
      <div className="loader-orbit loader-orbit-2"></div>
      <div className="loader-orbit loader-orbit-3"></div>
      <div className="loader-corner loader-corner-tl"></div>
      <div className="loader-corner loader-corner-tr"></div>
      <div className="loader-corner loader-corner-bl"></div>
      <div className="loader-corner loader-corner-br"></div>
      <div className="loader-logo-wrap">
        <div className="loader-logo">Odoo Cafe</div>
        <div className="loader-tagline">
          {letters.map((ch, i) => (
            <span key={i} className="loader-tagline-letter">
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </div>
        <div className="loader-progress-wrap">
          <div className="loader-progress-container">
            <div
              id="loader-progress-bar"
              className="loader-progress-bar"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div id="loader-percent" className="loader-percent">
            {percent}%
          </div>
        </div>
        <button
          type="button"
          id="loader-skip"
          className="loader-skip"
          style={{ display: showSkip ? 'flex' : 'none' }}
          onClick={() => navigate('/welcome')}
        >
          Skip Intro
        </button>
      </div>
    </div>
  )
}

