import { useState, useEffect } from 'react'
import { api } from '../../utils/api'
import { subscribeToTable, unsubscribeFromChannel } from '../../services/supabase.service'
import Loading from '../Loading'
import Toast from '../Toast'
import Icon from '../Icons'

const PaymentRequestQueue = ({ onApprove, onReject }) => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchPendingRequests()

    // Set up Supabase subscription to cashier_payment_requests table
    const channel = subscribeToTable(
      'cashier_payment_requests',
      'status=eq.pending',
      (payload) => {
        console.log('Payment request change detected:', payload)
        
        if (payload.eventType === 'INSERT') {
          setRequests(prev => [...prev, payload.new].sort((a, b) => 
            new Date(a.created_at) - new Date(b.created_at)
          ))
          playNotificationSound()
          showToast('New payment request received!', 'info')
        } else if (payload.eventType === 'UPDATE') {
          // Remove request from queue if status changed (approved/rejected)
          if (payload.new.status !== 'pending') {
            setRequests(prev => prev.filter(r => r.id !== payload.new.id))
          } else {
            setRequests(prev => prev.map(r => 
              r.id === payload.new.id ? payload.new : r
            ))
          }
        } else if (payload.eventType === 'DELETE') {
          setRequests(prev => prev.filter(r => r.id !== payload.old.id))
        }
      }
    )

    return () => {
      unsubscribeFromChannel(channel)
    }
  }, [])

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get('/payments/cash/requests?status=pending')
      const fetchedRequests = response.data?.requests || response.requests || []
      
      // Sort requests chronologically (oldest first)
      const sortedRequests = fetchedRequests.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      )
      
      setRequests(sortedRequests)
    } catch (error) {
      showToast(error.message || 'Failed to load payment requests', 'error')
    } finally {
      setLoading(false)
    }
  }

  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.error('Failed to play notification sound:', error)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleApprove = (request) => {
    if (onApprove) {
      onApprove(request)
    }
  }

  const handleReject = (request) => {
    if (onReject) {
      onReject(request)
    }
  }

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`
  }

  const getTimeSinceCreated = (createdAt) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffMinutes = Math.floor((now - created) / 60000)
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes === 1) return '1 min ago'
    return `${diffMinutes} mins ago`
  }

  if (loading) return <Loading />

  return (
    <div className="animate-slide-up">
      {/* Queue Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Payment Requests Queue
        </h2>
        <p className="text-[var(--text-muted)]">
          {requests.length === 0 
            ? 'No pending payment requests' 
            : `${requests.length} pending request${requests.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Requests Grid */}
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4"><Icon name="cash" className="w-5 h-5 inline" /></div>
          <p className="text-[var(--text-muted)] text-lg">
            No pending cash payment requests
          </p>
          <p className="text-[var(--text-muted)] text-sm mt-2">
            New requests will appear here automatically
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {requests.map((request) => {
            const orderSummary = typeof request.order_summary === 'string' 
              ? JSON.parse(request.order_summary) 
              : request.order_summary

            return (
              <div
                key={request.id}
                className="section-card p-5 border-2 border-[rgba(245,166,35,0.4)] bg-[rgba(245,166,35,0.08)] hover:shadow-xl transition-all"
              >
                {/* Request Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                      Table {request.table_number}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] font-semibold">
                      {getTimeSinceCreated(request.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[var(--accent-emerald)]">
                      {formatCurrency(request.total_amount)}
                    </div>
                    <span className="inline-block px-2 py-1 bg-[rgba(245,166,35,0.2)] text-[var(--accent-primary)] text-xs font-bold rounded-full mt-1">
                      PENDING
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-2">Order Items:</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {orderSummary?.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="flex justify-between items-start bg-[var(--bg-surface)] p-2 rounded text-sm"
                      >
                        <div className="flex-1">
                          <span className="font-semibold text-[var(--text-primary)]">
                            {item.quantity || item.qty}x {item.product_name || item.product}
                          </span>
                          {item.variant_name && (
                            <span className="text-xs text-[var(--text-muted)] ml-1">
                              ({item.variant_name})
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-[var(--text-secondary)] ml-2">
                          {formatCurrency(item.price || item.line_total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleApprove(request)}
                    className="py-3 bg-[var(--accent-emerald)] text-[var(--on-accent-text)] rounded-lg hover:opacity-90 transition-all font-semibold transform hover:scale-105"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(request)}
                    className="py-3 rounded-lg transition-all font-semibold transform hover:scale-105" style={{ background: 'var(--accent-rose)', color: '#fff' }}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default PaymentRequestQueue
