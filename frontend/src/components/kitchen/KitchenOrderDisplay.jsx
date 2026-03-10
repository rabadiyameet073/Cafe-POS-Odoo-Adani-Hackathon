import { useState, useEffect } from 'react'
import { api } from '../../utils/api'
import { subscribeToTable, unsubscribeFromChannel } from '../../services/supabase.service'
import Loading from '../Loading'
import Toast from '../Toast'
import Icon from '../Icons'

const KitchenOrderDisplay = ({ onStatusUpdate }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [filterKey, setFilterKey] = useState(0)

  useEffect(() => {
    fetchKitchenOrders()

    // Set up Supabase subscription to kitchen_orders table
    const channel = subscribeToTable('kitchen_orders', null, (payload) => {
      console.log('Kitchen order change detected:', payload)
      
      if (payload.eventType === 'INSERT') {
        setOrders(prev => [...prev, payload.new].sort((a, b) => 
          new Date(a.received_at) - new Date(b.received_at)
        ))
        // Play notification sound on new order
        playNotificationSound()
        showToast('New order received!', 'info')
      } else if (payload.eventType === 'UPDATE') {
        setOrders(prev => prev.map(o => 
          o.id === payload.new.id ? payload.new : o
        ).sort((a, b) => 
          new Date(a.received_at) - new Date(b.received_at)
        ))
      } else if (payload.eventType === 'DELETE') {
        setOrders(prev => prev.filter(o => o.id !== payload.old.id))
      }
    })

    return () => {
      unsubscribeFromChannel(channel)
    }
  }, [])

  const fetchKitchenOrders = async () => {
    try {
      const response = await api.get('/kitchen/orders')
      const fetchedOrders = response.data?.orders || response.orders || []
      
      // Sort orders chronologically (oldest first)
      const sortedOrders = fetchedOrders.sort((a, b) => 
        new Date(a.received_at) - new Date(b.received_at)
      )
      
      setOrders(sortedOrders)
    } catch (error) {
      showToast(error.message || 'Failed to load kitchen orders', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Kitchen notification: two beeps
      oscillator.frequency.value = 880 // Higher pitch for kitchen
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
      
      // Second beep
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator()
        const gainNode2 = audioContext.createGain()
        
        oscillator2.connect(gainNode2)
        gainNode2.connect(audioContext.destination)
        
        oscillator2.frequency.value = 880
        oscillator2.type = 'sine'
        
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        
        oscillator2.start(audioContext.currentTime)
        oscillator2.stop(audioContext.currentTime + 0.3)
      }, 400)
    } catch (error) {
      console.error('Failed to play notification sound:', error)
    }
  }

  const updateOrderStatus = async (kitchenOrderId, newStatus) => {
    try {
      await api.patch(`/kitchen/orders/${kitchenOrderId}/stage`, {
        stage: newStatus
      })
      
      // Refresh orders after update
      fetchKitchenOrders()
      showToast('Order status updated successfully', 'success')
      
      // Notify parent component if callback provided
      if (onStatusUpdate) {
        onStatusUpdate(kitchenOrderId, newStatus)
      }
    } catch (error) {
      showToast(error.message || 'Failed to update order status', 'error')
    }
  }

  const getTimeSinceReceived = (receivedAt) => {
    const now = new Date()
    const received = new Date(receivedAt)
    const diffMinutes = Math.floor((now - received) / 60000)
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes === 1) return '1 min ago'
    return `${diffMinutes} mins ago`
  }

  const isOrderOld = (receivedAt) => {
    const now = new Date()
    const received = new Date(receivedAt)
    const diffMinutes = Math.floor((now - received) / 60000)
    return diffMinutes >= 15
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'received':
        return 'bg-[rgba(245,166,35,0.15)] border-[rgba(245,166,35,0.4)] text-[var(--accent-primary)]'
      case 'preparing':
        return 'bg-[rgba(255,215,0,0.1)] border-[rgba(245,166,35,0.4)] text-[var(--accent-primary)]'
      case 'ready':
        return 'bg-[rgba(0,255,148,0.1)] border-[rgba(0,255,148,0.4)] text-[var(--accent-emerald)]'
      case 'served':
        return 'bg-[var(--bg-surface-hover)] border-[var(--border-subtle)] text-[var(--text-primary)]'
      default:
        return 'bg-[var(--bg-surface-hover)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      'received': 'Order Received',
      'preparing': 'Preparing',
      'ready': 'Ready',
      'served': 'Served'
    }
    return labels[status] || status
  }

  const getNextStatusButton = (currentStatus, orderId) => {
    switch (currentStatus) {
      case 'received':
        return (
          <button
            onClick={() => updateOrderStatus(orderId, 'preparing')}
            className="w-full py-2 bg-[var(--accent-primary)] text-[var(--on-accent-text)] rounded-lg hover:opacity-90 transition-all font-semibold"
          >
            Start Preparing
          </button>
        )
      case 'preparing':
        return (
          <button
            onClick={() => updateOrderStatus(orderId, 'ready')}
            className="w-full py-2 bg-[var(--accent-emerald)] text-[var(--on-accent-text)] rounded-lg hover:opacity-90 transition-all font-semibold"
          >
            Mark Ready
          </button>
        )
      case 'ready':
        return (
          <button
            onClick={() => updateOrderStatus(orderId, 'served')}
            className="w-full py-2 bg-[var(--accent-primary)] text-[var(--on-accent-text)] rounded-lg hover:opacity-90 transition-all font-semibold"
          >
            Mark Served
          </button>
        )
      default:
        return null
    }
  }

  const filteredOrders = statusFilter === 'all' 
    ? orders.filter(o => o.status !== 'served')
    : orders.filter(o => o.status === statusFilter)

  const orderCounts = {
    all: orders.filter(o => o.status !== 'served').length,
    received: orders.filter(o => o.status === 'received').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length
  }

  if (loading) return <Loading />

  const renderOrderCard = (order) => {
    const isOld = isOrderOld(order.received_at)
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    const itemCount = (items || []).reduce((s, i) => s + (i.quantity || 1), 0)

    return (
      <div
        key={order.id}
        className={`section-card p-4 border-2 transition-all flex-shrink-0 w-72 ${getStatusColor(order.status)} ${
          isOld ? 'ring-2 ring-red-500 ring-opacity-60' : ''
        }`}
        style={{ scrollSnapAlign: 'start' }}
      >
        {/* Order Header */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-extrabold">#{order.order_number}</h3>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Table {order.table_number}</p>
          </div>
          <div className="text-right">
            <span className={`text-xs font-bold ${isOld ? 'text-[var(--accent-rose)]' : ''}`}>
              {getTimeSinceReceived(order.received_at)}
            </span>
            {isOld && (
              <div className="text-[10px] text-[var(--accent-rose)] font-bold mt-0.5">! URGENT</div>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: 'var(--bg-surface-hover)' }}>
            {getStatusLabel(order.status)}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
            {itemCount} items
          </span>
          {order.payment_method && (
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
              {order.payment_method}
            </span>
          )}
        </div>

        {/* Order Items */}
        <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto pr-1">
          {items?.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm rounded-lg px-2.5 py-1.5" style={{ background: 'var(--bg-surface-hover)' }}>
              <span className="font-bold flex-shrink-0" style={{ color: 'var(--accent-primary)' }}>{item.quantity}x</span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.product_name}</span>
                {item.variant_name && <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>({item.variant_name})</span>}
                {item.notes && <p className="text-xs italic mt-0.5" style={{ color: 'var(--text-muted)' }}>Note: {item.notes}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Timestamps */}
        <div className="text-[10px] mb-3 space-y-0.5" style={{ color: 'var(--text-muted)' }}>
          <div>Received: {new Date(order.received_at).toLocaleTimeString()}</div>
          {order.started_preparing_at && <div>Started: {new Date(order.started_preparing_at).toLocaleTimeString()}</div>}
          {order.ready_at && <div>Ready: {new Date(order.ready_at).toLocaleTimeString()}</div>}
        </div>

        {/* Action Button */}
        {getNextStatusButton(order.status, order.id)}
      </div>
    )
  }

  return (
    <div className="animate-slide-up">
      {/* Status Filter Buttons */}
      <div className="tab-bar mb-6 flex-wrap">
        {[
          { key: 'all',       label: 'All Active',  colorClass: 'active-amber' },
          { key: 'received',  label: 'Received',    colorClass: 'active-gold' },
          { key: 'preparing', label: 'Preparing',   colorClass: 'active-amber' },
          { key: 'ready',     label: 'Ready',       colorClass: 'active-emerald' }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => { if (f.key !== statusFilter) { setStatusFilter(f.key); setFilterKey(k => k + 1) } }}
            className={`tab-pill ${statusFilter === f.key ? f.colorClass : ''}`}
          >
            {f.label}
            <span
              className="inline-flex items-center justify-center text-xs font-bold ml-2 rounded-full w-5 h-5"
              style={{
                background: statusFilter === f.key ? 'var(--bg-surface-hover)' : 'var(--bg-surface-hover)',
                color: statusFilter === f.key ? 'var(--on-accent-text)' : 'var(--text-muted)',
                minWidth: '1.25rem'
              }}
            >{orderCounts[f.key]}</span>
          </button>
        ))}
      </div>

      {/* Orders — Horizontal Rows by Status */}
      <div key={filterKey} className="tab-content-enter">
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4"><Icon name="fire" className="w-5 h-5 inline" /></div>
          <p className="text-[var(--text-muted)] text-lg">
            {statusFilter === 'all' 
              ? 'No active orders in the kitchen' 
              : `No orders with status: ${getStatusLabel(statusFilter)}`}
          </p>
        </div>
      ) : statusFilter !== 'all' ? (
        /* Single-status: horizontal scroll row */
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
          {filteredOrders.map((order) => renderOrderCard(order))}
        </div>
      ) : (
        /* All-status: grouped horizontal rows */
        <div className="space-y-6">
          {[
            { key: 'received', label: 'Pending', accent: 'var(--accent-primary)' },
            { key: 'preparing', label: 'Preparing', accent: 'var(--accent-gold)' },
            { key: 'ready', label: 'Ready', accent: 'var(--accent-emerald)' },
          ].map(sec => {
            const sectionOrders = filteredOrders.filter(o => o.status === sec.key)
            if (sectionOrders.length === 0) return null
            return (
              <div key={sec.key}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: sec.accent, boxShadow: `0 0 8px ${sec.accent}` }} />
                  <h3 className="text-base font-bold" style={{ color: sec.accent }}>{sec.label}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>{sectionOrders.length}</span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
                  {sectionOrders.map((order) => renderOrderCard(order))}
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>{/* end tab-content-enter */}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default KitchenOrderDisplay
