import { useState, useEffect } from 'react'
import { api } from '../../utils/api'
import { subscribeToTable, unsubscribeFromChannel } from '../../services/supabase.service'
import Loading from '../Loading'
import Toast from '../Toast'
import Icon from '../Icons'

const OccupiedTablesView = () => {
  const [occupiedTables, setOccupiedTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchOccupiedTables()

    // Subscribe to tables table for status changes
    const channel = subscribeToTable('tables', null, (payload) => {
      console.log('Table change detected:', payload)
      
      // Refresh occupied tables when any table status changes
      if (payload.eventType === 'UPDATE') {
        // Check if status changed to or from 'occupied'
        const wasOccupied = payload.old?.status === 'occupied'
        const isOccupied = payload.new?.status === 'occupied'
        
        if (wasOccupied || isOccupied) {
          fetchOccupiedTables()
        }
      }
    })

    return () => {
      unsubscribeFromChannel(channel)
    }
  }, [])

  const fetchOccupiedTables = async () => {
    try {
      const response = await api.get('/admin/occupied-tables')
      setOccupiedTables(response.data.tables || response.tables || [])
    } catch (error) {
      showToast('Failed to load occupied tables', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  if (loading) return <Loading />

  return (
    <div className="animate-slide-up">
      {/* Header with Count */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Occupied Tables
        </h2>
        <div className="flex items-center gap-4">
          <p className="text-[var(--text-muted)]">
            {occupiedTables.length} table{occupiedTables.length !== 1 ? 's' : ''} currently occupied
          </p>
          <div className="px-4 py-2 btn-primary rounded-lg font-bold text-lg">
            {occupiedTables.length}
          </div>
        </div>
      </div>

      {/* Occupied Tables Grid */}
      {occupiedTables.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4"><Icon name="chair" className="w-5 h-5 inline" /></div>
          <p className="text-[var(--text-muted)] text-lg">
            No tables currently occupied
          </p>
          <p className="text-[var(--text-muted)] text-sm mt-2">
            Occupied tables will appear here automatically
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {occupiedTables.map((table) => (
            <OccupiedTableCard key={table.table_id} table={table} />
          ))}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

// Separate component for each occupied table card with live timer
const OccupiedTableCard = ({ table }) => {
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  useEffect(() => {
    if (!table.timer_remaining) return

    // Calculate remaining time every second
    const calculateRemaining = () => {
      if (!table.occupied_until) {
        setRemainingSeconds(0)
        return
      }

      const now = new Date()
      const endsAt = new Date(table.occupied_until)
      const diff = Math.max(0, Math.floor((endsAt - now) / 1000))
      setRemainingSeconds(diff)
    }

    calculateRemaining()
    const interval = setInterval(calculateRemaining, 1000)

    return () => clearInterval(interval)
  }, [table.occupied_until, table.timer_remaining])

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const isExpiring = remainingSeconds < 300 // Less than 5 minutes

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'received':
        return 'text-[var(--accent-primary)]'
      case 'preparing':
        return 'text-[var(--accent-gold)]'
      case 'ready':
        return 'text-[var(--accent-emerald)]'
      case 'served':
        return 'text-[var(--text-secondary)]'
      default:
        return 'text-[var(--text-muted)]'
    }
  }

  const getOrderStatusLabel = (status) => {
    const labels = {
      'received': 'Order Received',
      'preparing': 'Preparing',
      'ready': 'Ready',
      'served': 'Served',
      'pending_payment': 'Pending Payment',
      'paid': 'Paid'
    }
    return labels[status] || status
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-[var(--accent-emerald)]'
      case 'pending':
      case 'pending_cash':
      case 'pending_upi':
        return 'text-[var(--accent-gold)]'
      case 'failed':
        return 'text-[var(--accent-rose)]'
      default:
        return 'text-[var(--text-muted)]'
    }
  }

  const getPaymentStatusLabel = (status) => {
    const labels = {
      'paid': 'Paid',
      'pending': 'Pending',
      'pending_cash': 'Pending Cash',
      'pending_upi': 'Pending UPI',
      'failed': 'Failed'
    }
    return labels[status] || status
  }

  return (
    <div
      className={`section-card p-4 border-2 transition-all ${
        isExpiring 
          ? 'border-[var(--accent-rose)] bg-[rgba(255,107,157,0.12)]' 
          : 'border-[var(--accent-rose)] bg-[rgba(255,107,157,0.08)]'
      }`}
    >
      {/* Table Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">
            Table {table.table_number}
          </h3>
          <p className="text-sm text-[var(--text-muted)] font-semibold">
            {table.floor_name || 'Floor'}
          </p>
        </div>
        <span className="px-2 py-1 text-white text-xs font-bold rounded-full" style={{ background: 'var(--accent-rose)' }}>
          OCCUPIED
        </span>
      </div>

      {/* Timer Display */}
      {table.occupied_until && (
        <div className={`mb-3 p-3 rounded-lg text-center ${
          isExpiring ? 'bg-[var(--accent-rose)]/10' : 'bg-[var(--bg-surface)] bg-opacity-50'
        }`}>
          <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">
            Timer Remaining
          </p>
          <p className={`text-3xl font-mono font-bold ${
            isExpiring ? 'text-[var(--accent-rose)] animate-pulse' : 'text-[var(--text-primary)]'
          }`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </p>
          {isExpiring && (
            <p className="text-xs text-[var(--accent-rose)] font-bold mt-1">
              <Icon name="warning" className="w-5 h-5 inline" /> EXPIRING SOON
            </p>
          )}
        </div>
      )}

      {/* Session Start Time */}
      {table.session_start && (
        <div className="mb-3 text-sm">
          <p className="text-[var(--text-muted)]">
            <span className="font-semibold">Session Started:</span>{' '}
            {new Date(table.session_start).toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Order Status */}
      <div className="mb-2">
        <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Order Status:</p>
        <p className={`text-sm font-bold ${getOrderStatusColor(table.order_status)}`}>
          {getOrderStatusLabel(table.order_status) || 'No Order'}
        </p>
      </div>

      {/* Payment Status */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Payment Status:</p>
        <p className={`text-sm font-bold ${getPaymentStatusColor(table.payment_status)}`}>
          {getPaymentStatusLabel(table.payment_status) || 'No Payment'}
        </p>
      </div>
    </div>
  )
}

export default OccupiedTablesView
