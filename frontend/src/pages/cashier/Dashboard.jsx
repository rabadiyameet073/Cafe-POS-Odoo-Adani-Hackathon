import { useState, useEffect } from 'react'
import CashierLayout from '../../components/layouts/CashierLayout'
import { getDashboardStats } from '../../services/cafe.service'
import { subscribeToTable, unsubscribeFromChannel } from '../../services/supabase.service'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const sub1 = subscribeToTable('orders', null, () => fetchStats())
    const sub2 = subscribeToTable('payments', null, () => fetchStats())
    return () => {
      unsubscribeFromChannel(sub1)
      unsubscribeFromChannel(sub2)
    }
  }, [])

  const cards = stats ? [
    { label: "Today's Orders", value: stats.todayOrders, color: 'var(--accent-violet)', bg: 'rgba(168,85,247,0.09)', borderTint: 'rgba(168,85,247,0.21)', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { label: "Today's Revenue", value: `₹${stats.todayRevenue.toFixed(0)}`, color: 'var(--accent-gold)', bg: 'rgba(255,215,0,0.09)', borderTint: 'rgba(255,215,0,0.21)', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Pending Payments', value: stats.pendingPayments, color: 'var(--accent-primary)', bg: 'rgba(245,166,35,0.09)', borderTint: 'rgba(245,166,35,0.21)', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Cash Payments', value: stats.cashPayments, color: 'var(--accent-emerald)', bg: 'rgba(0,255,148,0.09)', borderTint: 'rgba(0,255,148,0.21)', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  ] : []

  const quickActions = [
    { href: '/cashier/orders', label: 'Orders', color: 'var(--accent-violet)', bg: 'rgba(168,85,247,0.08)', borderTint: 'rgba(168,85,247,0.19)', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { href: '/cashier/floor', label: 'Floor View', color: 'var(--accent-primary)', bg: 'rgba(245,166,35,0.08)', borderTint: 'rgba(245,166,35,0.19)', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { href: '/cashier/session', label: 'Session', color: 'var(--accent-gold)', bg: 'rgba(255,215,0,0.08)', borderTint: 'rgba(255,215,0,0.19)', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { href: '/cashier/register', label: 'Register', color: 'var(--accent-emerald)', bg: 'rgba(0,255,148,0.08)', borderTint: 'rgba(0,255,148,0.19)', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  ]

  return (
    <CashierLayout>
      <div className="animate-slide-up">
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 className="page-title">Cashier Dashboard</h1>
            <p className="page-subtitle">Real-time sales overview</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,255,148,0.08)', border: '1px solid rgba(0,255,148,0.2)' }}>
            <span className="status-dot" style={{ background: 'var(--accent-emerald)', boxShadow: '0 0 6px var(--accent-emerald)', width: 7, height: 7 }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--accent-emerald)' }}>Live</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            {cards.map((card, idx) => (
              <div key={idx} className="stat-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="icon-box w-11 h-11 rounded-xl"
                    style={{ background: card.bg, border: `1px solid ${card.borderTint}`, color: card.color }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={card.icon} />
                    </svg>
                  </div>
                  <span className="w-2 h-2 rounded-full mt-1" style={{ background: card.color, boxShadow: `0 0 8px ${card.color}`, opacity: 0.7 }} />
                </div>
                <p className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{card.value}</p>
                <p className="text-xs font-medium mt-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 section-card p-6">
          <h2 className="section-title mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map(link => (
              <a key={link.href} href={link.href} className="action-card p-5 flex flex-col items-center gap-3 text-center rounded-2xl">
                <div
                  className="icon-box w-12 h-12 rounded-xl"
                  style={{ background: link.bg, border: `1px solid ${link.borderTint}`, color: link.color }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={link.icon} />
                  </svg>
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{link.label}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </CashierLayout>
  )
}

export default Dashboard

