import { useState, useEffect, useRef } from 'react'
import CashierLayout from '../../components/layouts/CashierLayout'
import { getPendingCashierRequests, approveCashierRequest, rejectCashierRequest } from '../../services/cafe.service'
import { supabase } from '../../services/supabase.service'
import { subscribeToTable, unsubscribeFromChannel } from '../../services/supabase.service'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Loading'
import Icon from '../../components/Icons'
import { showToast } from '../../components/Toast'

const Orders = () => {
  const [requests, setRequests] = useState([])
  const [historyRequests, setHistoryRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [activeTab, setActiveTab] = useState('pending')
  const [tabContentKey, setTabContentKey] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    fetchRequests()
    fetchHistory()
  }, [])

  // Real-time subscription
  useEffect(() => {
    const sub = subscribeToTable('cashier_payment_requests', null, (payload) => {
      if (payload.eventType === 'INSERT') {
        setRequests(prev => [payload.new, ...prev])
        showToast('New payment request received!', 'info')
      } else if (payload.eventType === 'UPDATE') {
        if (payload.new.status === 'pending') {
          setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new : r))
        } else {
          // Moved out of pending → remove from pending, add to history
          setRequests(prev => prev.filter(r => r.id !== payload.new.id))
          setHistoryRequests(prev => [payload.new, ...prev.filter(r => r.id !== payload.new.id)])
        }
      }
    })
    return () => unsubscribeFromChannel(sub)
  }, [])

  const fetchRequests = async () => {
    try {
      const data = await getPendingCashierRequests()
      setRequests(data)
    } catch (err) {
      showToast(err.message || 'Failed to load requests', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('cashier_payment_requests')
        .select('*')
        .in('status', ['approved', 'rejected'])
        .order('responded_at', { ascending: false })
        .limit(50)
      if (!error) setHistoryRequests(data || [])
    } catch (err) {
      // Silently fail for history
    }
  }

  const handleApprove = async (requestId) => {
    if (processing) return
    setProcessing(requestId)
    try {
      const cashierName = user?.full_name || 'Cashier'
      await approveCashierRequest(requestId, cashierName)
      showToast('Payment approved! Order sent to kitchen.')
      // Real-time will move it from pending → history
      setRequests(prev => prev.filter(r => r.id !== requestId))
      fetchHistory()
    } catch (err) {
      showToast(err.message || 'Failed to approve', 'error')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (requestId) => {
    if (processing) return
    setProcessing(requestId)
    try {
      await rejectCashierRequest(requestId, 'Payment declined by cashier')
      showToast('Payment rejected.')
      setRequests(prev => prev.filter(r => r.id !== requestId))
      fetchHistory()
    } catch (err) {
      showToast(err.message || 'Failed to reject', 'error')
    } finally {
      setProcessing(null)
    }
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')

  if (loading) return <Loading />

  return (
    <CashierLayout>
      <div className="animate-slide-up">
        <div className="flex justify-between items-center mb-7">
          <div>
            <h1 className="page-title">Payment Requests</h1>
            <p className="page-subtitle">Approve or reject incoming cash payments</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="px-4 py-2 rounded-xl font-bold text-base"
              style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', color: 'var(--accent-gold)' }}
            >
              {pendingRequests.length} Pending
            </div>
            <button
              onClick={() => { fetchRequests(); fetchHistory() }}
              className="p-2.5 rounded-xl transition-all hover:scale-105"
              style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              <Icon name="refresh" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar mb-6 w-fit">
          {[
            { key: 'pending', label: 'Pending', count: pendingRequests.length },
            { key: 'history', label: 'History', count: historyRequests.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { if (tab.key !== activeTab) { setActiveTab(tab.key); setTabContentKey(k => k + 1) } }}
              className={`tab-pill ${activeTab === tab.key ? 'active-amber' : ''}`}
            >
              {tab.label}
              <span
                className="inline-flex items-center justify-center text-xs font-bold ml-2 rounded-full w-5 h-5"
                style={{
                  background: activeTab === tab.key ? 'var(--bg-surface-hover)' : 'var(--bg-surface-hover)',
                  color: activeTab === tab.key ? 'var(--on-accent-text)' : 'var(--text-muted)',
                  minWidth: '1.25rem'
                }}
              >{tab.count}</span>
            </button>
          ))}
        </div>

        <div key={tabContentKey} className="tab-content-enter">

        {/* Pending */}
        {activeTab === 'pending' && (
          <>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-16 section-card p-10">
                <div className="flex justify-center mb-4"><Icon name="checkCircle" className="w-14 h-14" style={{ color: 'var(--accent-emerald)' }} /></div>
                <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>No pending payment requests</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>New requests will appear here in real-time</p>
              </div>
            ) : (
              <div className="space-y-4 stagger-children">
                {pendingRequests.map(req => (
                  <div
                    key={req.id}
                    className="section-card p-5"
                    style={{ borderLeft: '3px solid var(--accent-gold)' }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Table {req.table_number}</h3>
                        <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{req.table_token}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-extrabold" style={{ color: 'var(--accent-primary)' }}>₹{Number(req.total_amount).toFixed(2)}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatTime(req.created_at)}</p>
                      </div>
                    </div>

                    <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)' }}>
                      <h4 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Order Items</h4>
                      <div className="space-y-1">
                        {(Array.isArray(req.order_summary) ? req.order_summary : []).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span style={{ color: 'var(--text-secondary)' }}>{item.quantity}× {item.product_name}</span>
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>₹{Number(item.line_total).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-sm"
                      style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', color: 'var(--accent-primary)' }}
                    >
                      <Icon name="cash" className="w-4 h-4" /> Cash Payment
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={processing === req.id}
                        className="flex-1 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
                        style={{ background: 'var(--accent-emerald)', color: 'var(--on-accent-text)', boxShadow: '0 4px 16px rgba(0,255,148,0.25)' }}
                      >
                        {processing === req.id ? 'Processing…' : <><Icon name="checkCircle" className="w-4 h-4 inline -mt-0.5" /> Approve Payment</>}
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={processing === req.id}
                        className="px-5 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
                        style={{ background: 'rgba(255,107,157,0.1)', color: 'var(--accent-rose)', border: '1px solid rgba(255,107,157,0.25)' }}
                      >
                        <Icon name="xMark" className="w-4 h-4 inline -mt-0.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <>
            {historyRequests.length === 0 ? (
              <div className="text-center py-16 section-card p-10">
                <p className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>No history yet</p>
              </div>
            ) : (
              <div className="space-y-3 stagger-children">
                {historyRequests.map(req => (
                  <div
                    key={req.id}
                    className="section-card p-4"
                    style={{ borderLeft: `3px solid ${req.status === 'approved' ? 'var(--accent-emerald)' : 'var(--accent-rose)'}` }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="tag-pill"
                            style={req.status === 'approved'
                              ? { background: 'rgba(0,255,148,0.1)', color: 'var(--accent-emerald)', borderColor: 'rgba(0,255,148,0.25)' }
                              : { background: 'rgba(255,107,157,0.1)', color: 'var(--accent-rose)', borderColor: 'rgba(255,107,157,0.25)' }}
                          >
                            {req.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatTime(req.responded_at)}</span>
                        </div>
                        <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Table {req.table_number}</h3>
                        {req.cashier_name && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>By: {req.cashier_name}</p>}
                      </div>
                      <p className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>₹{Number(req.total_amount).toFixed(2)}</p>
                    </div>

                    <details className="mt-3">
                      <summary className="text-xs cursor-pointer transition-all hover:opacity-70" style={{ color: 'var(--text-muted)' }}>View items</summary>
                      <div className="mt-2 rounded-lg p-3 space-y-1" style={{ background: 'var(--bg-surface-hover)' }}>
                        {(Array.isArray(req.order_summary) ? req.order_summary : []).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span style={{ color: 'var(--text-secondary)' }}>{item.quantity}× {item.product_name}</span>
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>₹{Number(item.line_total).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        </div>{/* end tab-content-enter */}

      </div>
    </CashierLayout>
  )
}

export default Orders
