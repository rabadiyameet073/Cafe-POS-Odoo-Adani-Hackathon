import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../utils/api'
import { subscribeToTable, unsubscribeFromChannel } from '../../services/supabase.service'
import Loading from '../Loading'
import Toast from '../Toast'
import Icon from '../Icons'

const OrderTracker = () => {
  const [order, setOrder] = useState(null)
  const [kitchenOrder, setKitchenOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrderDetails()
  }, [])

  useEffect(() => {
    if (order) {
      // Set up Supabase subscriptions to orders table
      const ordersChannel = subscribeToTable(
        'orders',
        `id=eq.${order.id}`,
        (payload) => {
          console.log('Order status update:', payload)
          
          if (payload.eventType === 'UPDATE') {
            setOrder(prev => ({ ...prev, ...payload.new }))
          }
        }
      )

      // Set up Supabase subscriptions to kitchen_orders table
      const kitchenChannel = subscribeToTable(
        'kitchen_orders',
        `order_id=eq.${order.id}`,
        (payload) => {
          console.log('Kitchen order update:', payload)
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setKitchenOrder(payload.new)
          }
        }
      )

      return () => {
        unsubscribeFromChannel(ordersChannel)
        unsubscribeFromChannel(kitchenChannel)
      }
    }
  }, [order])

  const fetchOrderDetails = async () => {
    try {
      const tableToken = sessionStorage.getItem('table_token')
      
      if (!tableToken) {
        showToast('No active order found', 'error')
        navigate('/customer/select-floor')
        return
      }

      // Get orders by table token
      const response = await api.get(`/orders/by-token/${tableToken}`)
      const orders = response.data.orders || []
      
      if (orders.length === 0) {
        showToast('No orders found', 'error')
        navigate('/customer/browse-menu')
        return
      }

      // Get the most recent order
      const latestOrder = orders[0]
      setOrder(latestOrder)

      // Try to fetch kitchen order details
      try {
        const kitchenResponse = await api.get(`/kitchen/orders?order_id=${latestOrder.id}`)
        if (kitchenResponse.data.orders && kitchenResponse.data.orders.length > 0) {
          setKitchenOrder(kitchenResponse.data.orders[0])
        }
      } catch (error) {
        console.log('Kitchen order not yet available')
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load order details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const getOrderStatus = () => {
    if (!order) return 'pending'
    
    // Map order status to display status
    const statusMap = {
      'pending_payment': 'pending',
      'payment_requested': 'pending',
      'paid': 'received',
      'received': 'received',
      'preparing': 'preparing',
      'ready': 'ready',
      'served': 'served',
      'completed': 'served'
    }
    
    return statusMap[order.status] || 'pending'
  }

  const getStatusSteps = () => {
    const currentStatus = getOrderStatus()
    
    return [
      { 
        key: 'received', 
        label: 'Order Received', 
        icon: '<Icon name="clipboard" className="w-5 h-5 inline" />',
        active: ['received', 'preparing', 'ready', 'served'].includes(currentStatus)
      },
      { 
        key: 'preparing', 
        label: 'Preparing', 
        icon: '<Icon name="chef" className="w-5 h-5 inline" />',
        active: ['preparing', 'ready', 'served'].includes(currentStatus)
      },
      { 
        key: 'ready', 
        label: 'Ready', 
        icon: '<Icon name="checkCircle" className="w-4 h-4 inline" />',
        active: ['ready', 'served'].includes(currentStatus)
      },
      { 
        key: 'served', 
        label: 'Served', 
        icon: '<Icon name="plate" className="w-5 h-5 inline" />',
        active: currentStatus === 'served'
      }
    ]
  }

  const getEstimatedTime = () => {
    if (!order || !kitchenOrder) return 'Calculating...'
    
    const status = getOrderStatus()
    
    if (status === 'served') return 'Completed'
    if (status === 'ready') return 'Ready for pickup'
    if (status === 'preparing') return '10-15 minutes'
    if (status === 'received') return '15-20 minutes'
    
    return 'Pending'
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getTableInfo = () => {
    const tableNumber = sessionStorage.getItem('table_number')
    return tableNumber || 'N/A'
  }

  const goToMenu = () => {
    navigate('/customer/browse-menu')
  }

  const provideFeedback = () => {
    navigate('/customer/feedback')
  }

  if (loading) return <Loading />

  if (!order) {
    return (
      <div className="animate-slide-up text-center py-12">
        <div className="text-6xl mb-4"><Icon name="eye" className="w-5 h-5 inline" /></div>
        <p className="text-[var(--text-muted)] text-lg mb-6">No order found</p>
        <button
          onClick={goToMenu}
          className="px-6 py-3 btn-primary rounded-lg hover:shadow-lg transition-all"
        >
          Browse Menu
        </button>
      </div>
    )
  }

  const statusSteps = getStatusSteps()
  const currentStatus = getOrderStatus()

  return (
    <div className="animate-slide-up">
      <h1 className="page-title mb-6">Order Tracking</h1>

      {/* Order Info Card */}
      <div className="section-card p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-1">Order Number</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{order.order_number}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-1">Table Number</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{getTableInfo()}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-1">Order Time</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{formatTime(order.created_at)}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-1">Estimated Time</p>
            <p className="text-lg font-bold text-[var(--accent-rose)]">{getEstimatedTime()}</p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="section-card p-8 mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 text-center">Order Status</h2>
        
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-12 left-0 right-0 h-1 bg-[var(--bg-surface-hover)] mx-12"></div>
          <div 
            className="absolute top-12 left-0 h-1 btn-primary mx-12 transition-all duration-500"
            style={{ 
              width: `calc(${(statusSteps.findIndex(s => s.key === currentStatus) / (statusSteps.length - 1)) * 100}% - 96px)` 
            }}
          ></div>

          {/* Status Steps */}
          <div className="relative flex justify-between">
            {statusSteps.map((step, index) => (
              <div key={step.key} className="flex flex-col items-center" style={{ width: '120px' }}>
                <div 
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl mb-3 transition-all duration-300 ${
                    step.active 
                      ? 'btn-primary shadow-lg scale-110' 
                      : 'bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  {step.icon}
                </div>
                <p className={`text-sm font-semibold text-center ${
                  step.active ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                }`}>
                  {step.label}
                </p>
                {step.active && step.key === currentStatus && (
                  <div className="mt-2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--accent-primary)' }}>
                    Current
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="section-card p-6 mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Order Items</h2>
        <div className="space-y-3">
          {order.items?.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)] last:border-0">
              <div className="flex-1">
                <p className="font-semibold text-[var(--text-primary)]">{item.product_name || item.name}</p>
                <p className="text-sm text-[var(--text-muted)]">Quantity: {item.quantity}</p>
              </div>
              <p className="font-bold text-[var(--accent-rose)]">₹{(item.unit_price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t-2 border-slate-300">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-[var(--text-primary)]">Total</span>
            <span className="text-2xl font-bold text-[var(--accent-rose)]">₹{order.total_amount?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        {currentStatus === 'served' && (
          <button
            onClick={provideFeedback}
            className="px-6 py-3 btn-primary rounded-lg hover:shadow-lg transition-all"
          >
            Provide Feedback
          </button>
        )}
        <button
          onClick={goToMenu}
          className="px-6 py-3 bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-surface-hover)] transition-all"
        >
          Order More Items
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default OrderTracker
