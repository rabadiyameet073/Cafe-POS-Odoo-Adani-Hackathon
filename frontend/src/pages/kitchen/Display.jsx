import { useState, useEffect, useCallback } from 'react'
import KitchenLayout from '../../components/layouts/KitchenLayout'
import { getActiveKitchenOrders, updateKitchenOrderStatus } from '../../services/cafe.service'
import { subscribeToTable, unsubscribeFromChannel } from '../../services/supabase.service'
import { showToast } from '../../components/Toast'

const Display = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getActiveKitchenOrders()
      setOrders(data || [])
    } catch (err) {
      console.error('Failed to load orders:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 10000)
    const tick = setInterval(() => setNow(Date.now()), 15000)

    const sub = subscribeToTable('kitchen_orders', null, (payload) => {
      console.log('Kitchen order change:', payload)
      if (payload.eventType === 'INSERT') {
        playNotificationSound()
        showToast('New order received!')
      }
      fetchOrders()
    })

    return () => {
      clearInterval(interval)
      clearInterval(tick)
      unsubscribeFromChannel(sub)
    }
  }, [fetchOrders])

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } catch (_) { /* ignore */ }
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateKitchenOrderStatus(orderId, newStatus)
      fetchOrders()
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const getElapsed = (dateStr) => {
    const mins = Math.floor((now - new Date(dateStr).getTime()) / 60000)
    if (mins < 1) return 'Just now'
    return `${mins}m ago`
  }

  const isUrgent = (dateStr) => Math.floor((now - new Date(dateStr).getTime()) / 60000) >= 15

  const getItemCount = (items) => {
    const parsed = typeof items === 'string' ? JSON.parse(items) : items
    return (parsed || []).reduce((sum, i) => sum + (i.quantity || 1), 0)
  }

  const parseItems = (items) => typeof items === 'string' ? JSON.parse(items) : items

  const pendingOrders = orders.filter(o => o.status === 'received')
  const preparingOrders = orders.filter(o => o.status === 'preparing')
  const readyOrders = orders.filter(o => o.status === 'ready')

  const totalItems = orders.reduce((s, o) => s + getItemCount(o.items), 0)

  // Section config
  const sections = [
    {
      key: 'received',
      label: 'Pending',
      data: pendingOrders,
      accent: 'var(--accent-primary)',
      border: 'rgba(245,166,35,0.3)',
      btnBg: 'var(--accent-primary)',
      btnLabel: 'Start Preparing',
      nextStatus: 'preparing',
    },
    {
      key: 'preparing',
      label: 'Preparing',
      data: preparingOrders,
      accent: 'var(--accent-gold)',
      border: 'rgba(255,215,0,0.3)',
      btnBg: 'var(--accent-emerald)',
      btnLabel: 'Mark Ready',
      nextStatus: 'ready',
    },
    {
      key: 'ready',
      label: 'Ready to Serve',
      data: readyOrders,
      accent: 'var(--accent-emerald)',
      border: 'rgba(0,255,148,0.3)',
      btnBg: 'rgba(0,255,148,0.15)',
      btnLabel: 'Mark Served',
      nextStatus: 'served',
      btnTextColor: 'var(--accent-emerald)',
    },
  ]

  return (
    <KitchenLayout>
      <div className="animate-slide-up px-1">
        {/* ─── Header ─── */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="page-title">Kitchen Display</h1>
            <p className="page-subtitle">Real-time order management</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,255,148,0.08)', border: '1px solid rgba(0,255,148,0.2)' }}>
              <span className="status-dot" style={{ background: 'var(--accent-emerald)', boxShadow: '0 0 6px var(--accent-emerald)', width: 7, height: 7 }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--accent-emerald)' }}>Live</span>
            </div>
            <button onClick={fetchOrders} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
              Refresh
            </button>
          </div>
        </div>

        {/* ─── Summary Stats ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Active', value: orders.length, color: 'var(--accent-primary)' },
            { label: 'Pending', value: pendingOrders.length, color: 'var(--accent-primary)' },
            { label: 'Preparing', value: preparingOrders.length, color: 'var(--accent-gold)' },
            { label: 'Ready', value: readyOrders.length, color: 'var(--accent-emerald)' },
          ].map(s => (
            <div key={s.label} className="stat-card p-4 rounded-2xl text-center">
              <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ─── Content ─── */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">✓</div>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-muted)' }}>All clear — no active orders</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>New orders will appear here in real-time</p>
          </div>
        ) : (
          /* ─── Horizontal Sections (rows) — each status is a full-width row with horizontally scrolling cards ─── */
          <div className="space-y-6">
            {sections.map(sec => (
              <div key={sec.key}>
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: sec.accent, boxShadow: `0 0 8px ${sec.accent}` }} />
                  <h2 className="text-lg font-bold" style={{ color: sec.accent }}>
                    {sec.label}
                  </h2>
                  <span className="ml-1 text-sm font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
                    {sec.data.length}
                  </span>
                </div>

                {sec.data.length === 0 ? (
                  <div className="section-card rounded-xl px-6 py-5 text-center" style={{ border: `1px solid ${sec.border}` }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No {sec.label.toLowerCase()} orders</p>
                  </div>
                ) : (
                  /* Horizontal scrolling row of order cards */
                  <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
                    {sec.data.map(order => {
                      const items = parseItems(order.items) || []
                      const urgent = sec.key === 'received' && isUrgent(order.received_at)
                      return (
                        <div
                          key={order.id}
                          className={`section-card rounded-xl p-4 flex-shrink-0 w-72 transition-all ${urgent ? 'ring-2 ring-red-500 ring-opacity-60' : ''}`}
                          style={{ border: `1.5px solid ${sec.border}`, scrollSnapAlign: 'start' }}
                        >
                          {/* Card Header */}
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>#{order.order_number}</span>
                              <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>Table {order.table_number}</div>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs font-bold ${urgent ? 'text-red-400' : ''}`} style={urgent ? {} : { color: 'var(--text-muted)' }}>
                                {getElapsed(order.received_at || order.created_at)}
                              </span>
                              {urgent && <div className="text-[10px] font-bold text-red-400 mt-0.5">! URGENT</div>}
                            </div>
                          </div>

                          {/* Meta row */}
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-surface-hover)', color: sec.accent }}>
                              {sec.label}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
                              {getItemCount(order.items)} items
                            </span>
                            {order.payment_method && (
                              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
                                {order.payment_method}
                              </span>
                            )}
                          </div>

                          {/* Items */}
                          <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto pr-1">
                            {items.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm rounded-lg px-2.5 py-1.5" style={{ background: 'var(--bg-surface-hover)' }}>
                                <span className="font-bold flex-shrink-0" style={{ color: sec.accent }}>{item.quantity}x</span>
                                <div className="flex-1 min-w-0">
                                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.product_name}</span>
                                  {item.variant_name && <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>({item.variant_name})</span>}
                                  {item.notes && <p className="text-xs italic mt-0.5" style={{ color: 'var(--text-muted)' }}>Note: {item.notes}</p>}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Special instructions */}
                          {order.notes && (
                            <div className="text-xs rounded-lg px-2.5 py-1.5 mb-3" style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)', color: 'var(--accent-red)' }}>
                              Note: {order.notes}
                            </div>
                          )}

                          {/* Timestamps */}
                          <div className="text-[10px] mb-3 space-y-0.5" style={{ color: 'var(--text-muted)' }}>
                            <div>Received: {new Date(order.received_at || order.created_at).toLocaleTimeString()}</div>
                            {order.started_preparing_at && <div>Started: {new Date(order.started_preparing_at).toLocaleTimeString()}</div>}
                            {order.ready_at && <div>Ready: {new Date(order.ready_at).toLocaleTimeString()}</div>}
                          </div>

                          {/* Action */}
                          <button
                            onClick={() => handleStatusUpdate(order.id, sec.nextStatus)}
                            className="w-full py-2 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95"
                            style={{ background: sec.btnBg, color: sec.btnTextColor || 'var(--on-accent-text)' }}
                          >
                            {sec.btnLabel}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Total items info */}
        {orders.length > 0 && (
          <div className="mt-6 text-center text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            {totalItems} total items across {orders.length} active orders
          </div>
        )}
      </div>

    </KitchenLayout>
  )
}

export default Display

