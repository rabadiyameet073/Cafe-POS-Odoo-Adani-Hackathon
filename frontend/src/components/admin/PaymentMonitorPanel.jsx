import { useState, useEffect } from 'react'
import { api } from '../../utils/api'
import { subscribeToTable, unsubscribeFromChannel } from '../../services/supabase.service'
import Loading from '../Loading'
import Toast from '../Toast'
import Icon from '../Icons'

const PaymentMonitorPanel = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [filters, setFilters] = useState({
    payment_method: 'all',
    status: 'all',
    from_date: '',
    to_date: ''
  })

  useEffect(() => {
    fetchPayments()

    // Subscribe to payments table
    const channel = subscribeToTable('payments', null, (payload) => {
      console.log('Payment change detected:', payload)
      
      if (payload.eventType === 'INSERT') {
        setPayments(prev => [payload.new, ...prev])
      } else if (payload.eventType === 'UPDATE') {
        setPayments(prev => prev.map(p => 
          p.id === payload.new.id ? payload.new : p
        ))
      } else if (payload.eventType === 'DELETE') {
        setPayments(prev => prev.filter(p => p.id !== payload.old.id))
      }
    })

    return () => {
      unsubscribeFromChannel(channel)
    }
  }, [])

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams()
      
      if (filters.payment_method !== 'all') {
        params.append('payment_method', filters.payment_method)
      }
      if (filters.status !== 'all') {
        params.append('status', filters.status)
      }
      if (filters.from_date) {
        params.append('from_date', filters.from_date)
      }
      if (filters.to_date) {
        params.append('to_date', filters.to_date)
      }

      const response = await api.get(`/admin/payments/monitor?${params.toString()}`)
      setPayments(response.data.payments || response.payments || [])
    } catch (error) {
      showToast('Failed to load payments', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    setLoading(true)
    fetchPayments()
  }

  const clearFilters = () => {
    setFilters({
      payment_method: 'all',
      status: 'all',
      from_date: '',
      to_date: ''
    })
    setTimeout(() => {
      setLoading(true)
      fetchPayments()
    }, 100)
  }

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)]'
      case 'pending':
      case 'pending_approval':
        return 'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]'
      case 'rejected':
      case 'failed':
        return 'bg-[var(--accent-rose)]/10 text-[var(--accent-rose)]'
      case 'refunded':
        return 'bg-[var(--bg-surface-hover)] text-[var(--text-primary)]'
      default:
        return 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'
    }
  }

  const getPaymentMethodBadge = (method) => {
    const colors = {
      cash: 'bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)]',
      upi: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
    }
    return colors[method] || 'bg-[var(--bg-surface-hover)] text-[var(--text-primary)]'
  }

  if (loading) return <Loading />

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Payment Monitor
        </h2>
        <p className="text-[var(--text-muted)]">
          {payments.length} payment{payments.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Filters */}
      <div className="section-card p-4 mb-6">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Payment Method Filter */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
              Payment Method
            </label>
            <select
              value={filters.payment_method}
              onChange={(e) => handleFilterChange('payment_method', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* From Date Filter */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.from_date}
              onChange={(e) => handleFilterChange('from_date', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
            />
          </div>

          {/* To Date Filter */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.to_date}
              onChange={(e) => handleFilterChange('to_date', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={applyFilters}
            className="px-4 py-2 btn-primary rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-surface-hover)] transition-all font-semibold"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Payments Table */}
      {payments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4"><Icon name="cash" className="w-5 h-5 inline" /></div>
          <p className="text-[var(--text-muted)] text-lg">
            No payments found
          </p>
          <p className="text-[var(--text-muted)] text-sm mt-2">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className="section-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-surface-hover)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[var(--text-secondary)]">
                    Table
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[var(--text-secondary)]">
                    Token
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[var(--text-secondary)]">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[var(--text-secondary)]">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[var(--text-secondary)]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[var(--text-secondary)]">
                    Cashier/Source
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[var(--text-secondary)]">
                    Date/Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                      Table {payment.table_number}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-[var(--text-muted)]">
                      {payment.table_token}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-[var(--accent-emerald)]">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${getPaymentMethodBadge(payment.payment_method)}`}>
                        {payment.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {payment.payment_method === 'upi' 
                        ? 'UPI' 
                        : payment.cashier_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                      {new Date(payment.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default PaymentMonitorPanel
