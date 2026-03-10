import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { getOrdersByToken, getKitchenOrderByOrderId, getSessionByToken } from '../../services/cafe.service'
import { subscribeToTable, unsubscribeFromChannel } from '../../services/supabase.service'
import Loading from '../../components/Loading'

const OrderTrackingPage = () => {
  const [order, setOrder] = useState(null)
  const [kitchenOrder, setKitchenOrder] = useState(null)
  const [session, setSession] = useState(null)
  const [timerRemaining, setTimerRemaining] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const tableToken = sessionStorage.getItem('table_token')
  const tableNumber = sessionStorage.getItem('table_number')

  const fetchData = useCallback(async () => {
    if (!tableToken) {
      navigate('/customer/select-floor', { replace: true })
      return
    }
    try {
      const orders = await getOrdersByToken(tableToken)
      if (orders.length > 0) {
        const latestOrder = orders[0]
        setOrder(latestOrder)
        const ko = await getKitchenOrderByOrderId(latestOrder.id)
        if (ko) setKitchenOrder(ko)
      }
      const sess = await getSessionByToken(tableToken)
      if (sess) setSession(sess)
    } catch (err) {
      console.error('Failed to fetch order:', err)
    } finally {
      setLoading(false)
    }
  }, [tableToken])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!tableToken) return
    const orderSub = subscribeToTable('orders', `table_token=eq.${tableToken}`, (payload) => {
      if (payload.new) setOrder(prev => prev?.id === payload.new.id ? { ...prev, ...payload.new } : prev)
    })
    const kitchenSub = subscribeToTable('kitchen_orders', `table_token=eq.${tableToken}`, (payload) => {
      if (payload.new) setKitchenOrder(payload.new)
    })
    const sessionSub = subscribeToTable('table_sessions', `table_token=eq.${tableToken}`, (payload) => {
      if (payload.new) setSession(payload.new)
    })
    const paymentSub = subscribeToTable('payments', `table_token=eq.${tableToken}`, (payload) => {
      if (payload.new && ['approved', 'completed'].includes(payload.new.status)) setTimeout(fetchData, 1000)
    })
    return () => {
      unsubscribeFromChannel(orderSub)
      unsubscribeFromChannel(kitchenSub)
      unsubscribeFromChannel(sessionSub)
      unsubscribeFromChannel(paymentSub)
    }
  }, [tableToken, fetchData])

  useEffect(() => {
    if (!session?.timer_ends_at) { setTimerRemaining(null); return }
    const updateTimer = () => {
      const diff = new Date(session.timer_ends_at).getTime() - Date.now()
      if (diff <= 0) { setTimerRemaining('00:00'); return }
      setTimerRemaining(`${String(Math.floor(diff / 60000)).padStart(2, '0')}:${String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')}`)
    }
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [session?.timer_ends_at])

  const getDisplayStatus = () => {
    if (!order) return 'no_order'
    const s = order.status
    if (s === 'pending_payment' || s === 'payment_requested') return 'waiting_payment'
    if (s === 'paid' || s === 'received') return 'received'
    if (s === 'preparing') return 'preparing'
    if (s === 'ready') return 'ready'
    if (s === 'served' || s === 'completed') return 'served'
    if (s === 'cancelled') return 'cancelled'
    return 'received'
  }

  const status = getDisplayStatus()
  const steps = [
    { key: 'waiting_payment', label: 'Payment', letter: '₹' },
    { key: 'received', label: 'Received', letter: 'R' },
    { key: 'preparing', label: 'Preparing', letter: 'P' },
    { key: 'ready', label: 'Ready', letter: '!' },
    { key: 'served', label: 'Served', letter: '✓' }
  ]
  const statusOrder = ['waiting_payment', 'received', 'preparing', 'ready', 'served']
  const currentIdx = statusOrder.indexOf(status)

  const statusConfig = {
    waiting_payment: { bg: '#F5A623', letter: '₹', title: 'Awaiting Payment', subtitle: 'Payment is being confirmed' },
    received: { bg: '#6366f1', letter: 'R', title: 'Order Confirmed', subtitle: 'Kitchen has received your order' },
    preparing: { bg: '#FF4D4D', letter: 'P', title: 'Being Prepared', subtitle: 'Chef is cooking your meal' },
    ready: { bg: '#10b981', letter: '!', title: 'Order Ready!', subtitle: 'Collect from the counter' },
    served: { bg: '#a855f7', letter: '✓', title: 'Enjoy Your Meal!', subtitle: 'Hope you love the food' }
  }

  const cfg = statusConfig[status] || statusConfig.received

  if (loading) return <Loading />

  return (
    <CustomerLayout>
      <div className="order-tracking-page">
        {/* ═══ Header ═══ */}
        <div className="ot-header">
          <div>
            <h1 className="ot-title">Order Status</h1>
            <div className="ot-subtitle-row">
              <span>Table {tableNumber}</span>
              {order?.order_number && <span className="ot-order-badge">{order.order_number}</span>}
            </div>
          </div>
          {timerRemaining && session?.timer_status === 'running' && (
            <div className="ot-timer-badge">
              <span className={timerRemaining === '00:00' ? 'ot-timer-expired' : ''}>{timerRemaining}</span>
            </div>
          )}
        </div>

        {!order ? (
          /* ═══ Empty State ═══ */
          <div className="ot-empty-state">
            <div className="ot-empty-icon-wrap">
              <span className="ot-empty-letter">?</span>
            </div>
            <h2 className="ot-empty-title">No Orders Yet</h2>
            <p className="ot-empty-desc">Browse the menu and place your first order</p>
            <button onClick={() => navigate('/customer/browse-menu')} className="ot-cta-btn">
              Browse Menu
            </button>
          </div>

        ) : status === 'cancelled' ? (
          <div className="ot-empty-state">
            <div className="ot-empty-icon-wrap ot-cancelled">
              <span className="ot-empty-letter" style={{color:'var(--accent-red)'}}>×</span>
            </div>
            <h2 className="ot-empty-title" style={{color:'var(--accent-red)'}}>Order Cancelled</h2>
            <p className="ot-empty-desc">Payment was rejected or order was cancelled</p>
            <button onClick={() => navigate('/customer/browse-menu')} className="ot-cta-btn">Order Again</button>
          </div>

        ) : (
          <>
            {/* ═══ Hero Status Card ═══ */}
            <div className="ot-hero-card" style={{borderLeftColor: cfg.bg}}>
              <div className="ot-hero-top">
                <div className="ot-hero-icon" style={{background: cfg.bg}}>
                  <span className="ot-hero-letter">{cfg.letter}</span>
                </div>
                <div>
                  <h2 className="ot-hero-title">{cfg.title}</h2>
                  <p className="ot-hero-subtitle">{cfg.subtitle}</p>
                </div>
              </div>

              {/* ─── Progress Track ─── */}
              <div className="ot-progress-wrap">
                <div className="ot-progress-track">
                  <div className="ot-progress-fill" style={{
                    width: currentIdx >= 0 ? `${(currentIdx / (steps.length - 1)) * 100}%` : '0%',
                    background: status === 'ready' || status === 'served' ? '#10b981' : 'var(--accent-red)'
                  }} />
                </div>
                <div className="ot-steps-row">
                  {steps.map((step, idx) => {
                    const isActive = idx <= currentIdx
                    const isCurrent = statusOrder[currentIdx] === step.key
                    return (
                      <div key={step.key} className={`ot-step ${isActive ? 'ot-step-active' : ''} ${isCurrent ? 'ot-step-current' : ''}`}>
                        <div className={`ot-step-dot ${isCurrent ? 'ot-step-dot-current' : isActive ? 'ot-step-dot-done' : ''}`}>
                          {isActive ? <span className="ot-step-letter">{step.letter}</span> : <span className="ot-step-num">{idx + 1}</span>}
                        </div>
                        <span className="ot-step-label">{step.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ═══ Cards Grid ═══ */}
            <div className="ot-cards-grid">
              {/* ─── Order Items ─── */}
              <div className="ot-card ot-items-card">
                <div className="ot-card-header">
                  <div className="ot-card-dot" style={{background:'var(--accent-primary)'}} />
                  <h3>Order Items</h3>
                  <span className="ot-badge">{(order.order_items || order.items || []).length}</span>
                </div>
                <div className="ot-items-list">
                  {(order.order_items || order.items || []).map((item, idx) => (
                    <div key={idx} className="ot-item-row" style={{animationDelay: `${idx * 60}ms`}}>
                      <div className="ot-item-qty">{item.quantity}×</div>
                      <span className="ot-item-name">{item.product_name || item.name}</span>
                      <span className="ot-item-price">₹{((item.unit_price || item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="ot-total-row">
                  <span>Total</span>
                  <span className="ot-total-amount">₹{Number(order.total_amount).toFixed(2)}</span>
                </div>
              </div>

              {/* ─── Right Column ─── */}
              <div className="ot-right-col">
                {/* Kitchen Status */}
                {kitchenOrder && (
                  <div className="ot-card ot-kitchen-card">
                    <div className="ot-kitchen-inner">
                      <div className="ot-kitchen-icon" style={{background:
                        kitchenOrder.status === 'received' ? '#6366f1' :
                        kitchenOrder.status === 'preparing' ? '#FF4D4D' :
                        kitchenOrder.status === 'ready' ? '#10b981' : '#a855f7'
                      }}>
                        <span className="ot-kitchen-letter">
                          {kitchenOrder.status === 'received' ? 'R' : kitchenOrder.status === 'preparing' ? 'P' : kitchenOrder.status === 'ready' ? '!' : '✓'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="ot-kitchen-status">Kitchen — {kitchenOrder.status.charAt(0).toUpperCase() + kitchenOrder.status.slice(1)}</p>
                        <p className="ot-kitchen-desc">
                          {kitchenOrder.status === 'received' ? 'Waiting for kitchen to start' :
                            kitchenOrder.status === 'preparing' ? 'Chef is cooking your food' :
                              kitchenOrder.status === 'ready' ? 'Ready! Collect your order!' : 'Completed'}
                        </p>
                      </div>
                      {(kitchenOrder.status === 'preparing' || kitchenOrder.status === 'ready') && (
                        <div className={`ot-live-dot ${kitchenOrder.status === 'ready' ? 'ot-live-green' : 'ot-live-orange'}`} />
                      )}
                    </div>
                  </div>
                )}

                {/* Timer card */}
                {timerRemaining && session?.timer_status === 'running' && (
                  <div className="ot-card ot-timer-card">
                    <div className="ot-timer-inner">
                      <div>
                        <p className="ot-timer-label">Session Timer</p>
                        <p className="ot-timer-sublabel">39-min table session</p>
                      </div>
                      <div className={`ot-timer-value ${timerRemaining === '00:00' ? 'ot-timer-expired' : ''}`}>
                        {timerRemaining}
                      </div>
                    </div>
                    <div className="ot-timer-bar-track">
                      <div className="ot-timer-bar-fill" style={{
                        width: timerRemaining ? `${Math.max(0, (parseInt(timerRemaining.split(':')[0]) * 60 + parseInt(timerRemaining.split(':')[1])) / (39 * 60) * 100)}%` : '0%'
                      }} />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="ot-actions">
                  <button onClick={() => navigate('/customer/browse-menu')} className="ot-btn-secondary">
                    Order More
                  </button>
                  {(status === 'ready' || status === 'served') && (
                    <button onClick={() => navigate('/customer/feedback')} className="ot-btn-feedback">
                      Give Feedback
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </CustomerLayout>
  )
}

export default OrderTrackingPage
