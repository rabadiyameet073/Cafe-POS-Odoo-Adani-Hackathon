import { useState, useEffect } from 'react'
import KitchenLayout from '../../components/layouts/KitchenLayout'
import KitchenOrderDisplay from '../../components/kitchen/KitchenOrderDisplay'
import { api } from '../../utils/api'

const KitchenPanel = () => {
  const [refreshKey, setRefreshKey] = useState(0)
  const [stats, setStats] = useState({ received: 0, preparing: 0, ready: 0, totalItems: 0 })

  const fetchStats = async () => {
    try {
      const response = await api.get('/kitchen/orders')
      const orders = response.data?.orders || response.orders || []
      const active = orders.filter(o => o.status !== 'served')
      const totalItems = active.reduce((s, o) => {
        const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items
        return s + (items || []).reduce((sum, i) => sum + (i.quantity || 1), 0)
      }, 0)
      setStats({
        received: active.filter(o => o.status === 'received').length,
        preparing: active.filter(o => o.status === 'preparing').length,
        ready: active.filter(o => o.status === 'ready').length,
        totalItems,
      })
    } catch (_) { /* ignore */ }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 12000)
    return () => clearInterval(interval)
  }, [refreshKey])

  const handleStatusUpdate = (orderId, newStatus) => {
    console.log(`Order ${orderId} status updated to ${newStatus}`)
    setRefreshKey(prev => prev + 1)
  }

  return (
    <KitchenLayout>
      <div className="animate-slide-up">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="page-title">Kitchen Panel</h1>
            <p className="page-subtitle">Manage incoming orders and update their status</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,255,148,0.08)', border: '1px solid rgba(0,255,148,0.2)' }}>
              <span className="status-dot" style={{ background: 'var(--accent-emerald)', boxShadow: '0 0 6px var(--accent-emerald)', width: 7, height: 7 }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--accent-emerald)' }}>Live</span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Pending', value: stats.received, color: 'var(--accent-primary)' },
            { label: 'Preparing', value: stats.preparing, color: 'var(--accent-gold)' },
            { label: 'Ready', value: stats.ready, color: 'var(--accent-emerald)' },
            { label: 'Total Items', value: stats.totalItems, color: 'var(--text-primary)' },
          ].map(s => (
            <div key={s.label} className="stat-card p-4 rounded-2xl text-center">
              <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <KitchenOrderDisplay
          key={refreshKey}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>
    </KitchenLayout>
  )
}

export default KitchenPanel
