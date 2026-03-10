import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { getAllPayments } from '../../services/cafe.service'
import { subscribeToTable, unsubscribeFromChannel } from '../../services/supabase.service'
import Loading from '../../components/Loading'
import Icon from '../../components/Icons'
import { showToast } from '../../components/Toast'

const Payments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [filterKey, setFilterKey] = useState(0)

  useEffect(() => {
    fetchPayments()
  }, [])

  // Real-time subscription
  useEffect(() => {
    const sub = subscribeToTable('payments', null, () => fetchPayments())
    return () => unsubscribeFromChannel(sub)
  }, [])

  const fetchPayments = async () => {
    try {
      const data = await getAllPayments()
      setPayments(data)
    } catch (err) {
      showToast(err.message || 'Failed to load', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (ts) => {
    if (!ts) return 'N/A'
    return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const getStatusBadge = (status) => {
    const map = {
      'pending': 'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]',
      'pending_approval': 'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]',
      'approved': 'bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)]',
      'completed': 'bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)]',
      'rejected': 'bg-[var(--accent-rose)]/10 text-[var(--accent-rose)]',
      'failed': 'bg-[var(--accent-rose)]/10 text-[var(--accent-rose)]',
      'refunded': 'bg-[rgba(245,166,35,0.12)] text-[var(--accent-primary)]'
    }
    return map[status] || 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'
  }

  const filtered = filter === 'all'
    ? payments
    : payments.filter(p => p.payment_method === filter)

  const totalRevenue = payments
    .filter(p => ['approved', 'completed'].includes(p.status))
    .reduce((s, p) => s + Number(p.amount), 0)

  if (loading) return <Loading />

  return (
    <AdminLayout>
      <div className="animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="page-title">Payment Monitor</h1>
            <p className="text-[var(--text-muted)]">All payment transactions</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--text-muted)]">Total Revenue</p>
            <p className="text-2xl font-bold text-[var(--accent-primary)]">₹{totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="tab-bar mb-6 w-fit">
          {[
            { key: 'all',  label: 'All' },
            { key: 'cash', label: 'Cash' },
            { key: 'upi',  label: 'UPI' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => { if (f.key !== filter) { setFilter(f.key); setFilterKey(k => k + 1) } }}
              className={`tab-pill ${filter === f.key ? 'active-amber' : ''}`}
            >
              {f.label}
              <span
                className="inline-flex items-center justify-center text-xs font-bold ml-2 rounded-full w-5 h-5"
                style={{
                  background: filter === f.key ? 'var(--bg-surface-hover)' : 'var(--bg-surface-hover)',
                  color: filter === f.key ? 'var(--on-accent-text)' : 'var(--text-muted)',
                  minWidth: '1.25rem'
                }}
              >{f.key === 'all' ? payments.length : payments.filter(p => p.payment_method === f.key).length}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div key={filterKey} className="tab-content-enter">
        <div className="section-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--text-muted)]">Table</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--text-muted)]">Token</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--text-muted)]">Amount</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--text-muted)]">Method</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--text-muted)]">Confirmed By</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--text-muted)]">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[var(--text-muted)]">Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(payment => (
                  <tr key={payment.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]/50">
                    <td className="px-4 py-3 font-bold text-[var(--text-primary)]">Table {payment.table_number}</td>
                    <td className="px-4 py-3 text-xs font-mono text-[var(--text-muted)]">{payment.table_token}</td>
                    <td className="px-4 py-3 font-bold text-[var(--accent-primary)]">₹{Number(payment.amount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${payment.payment_method === 'upi' ? 'bg-[rgba(245,166,35,0.12)] text-[var(--accent-primary)]' : 'bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)]'
                        }`}>
                        {payment.payment_method === 'upi' ? '📱 UPI' : '💵 Cash'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {payment.payment_method === 'upi' ? (
                        <span className="text-[var(--accent-primary)] font-medium">UPI</span>
                      ) : (
                        payment.cashier_name || <span className="text-[var(--text-muted)]">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{formatTime(payment.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">No payments found</p>
            </div>
          )}
        </div>
        </div>{/* end tab-content-enter */}

      </div>
    </AdminLayout>
  )
}

export default Payments
