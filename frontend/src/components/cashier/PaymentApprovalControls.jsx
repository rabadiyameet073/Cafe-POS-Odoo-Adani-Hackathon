import { useState } from 'react'
import { api } from '../../utils/api'
import Toast from '../Toast'

const PaymentApprovalControls = ({ request, onApproved, onRejected }) => {
  const [toast, setToast] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleApprove = async () => {
    if (processing) return

    setProcessing(true)
    
    try {
      // Get cashier info from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const cashierId = user.id || user.user_id

      if (!cashierId) {
        showToast('Cashier ID not found. Please log in again.', 'error')
        return
      }

      // Call API to approve payment
      await api.post('/payments/cash/approve', {
        payment_id: request.payment_id,
        cashier_id: cashierId
      })

      showToast('Payment approved successfully!', 'success')
      
      // Notify parent component
      if (onApproved) {
        onApproved(request.id)
      }
    } catch (error) {
      showToast(error.message || 'Failed to approve payment', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectClick = () => {
    setShowRejectModal(true)
  }

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'error')
      return
    }

    if (processing) return

    setProcessing(true)
    
    try {
      // Get cashier info from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const cashierId = user.id || user.user_id

      if (!cashierId) {
        showToast('Cashier ID not found. Please log in again.', 'error')
        return
      }

      // Call API to reject payment
      await api.post('/payments/cash/reject', {
        payment_id: request.payment_id,
        cashier_id: cashierId,
        rejection_reason: rejectionReason.trim()
      })

      showToast('Payment rejected', 'success')
      
      // Notify parent component
      if (onRejected) {
        onRejected(request.id)
      }

      // Close modal and reset
      setShowRejectModal(false)
      setRejectionReason('')
    } catch (error) {
      showToast(error.message || 'Failed to reject payment', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectCancel = () => {
    setShowRejectModal(false)
    setRejectionReason('')
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleApprove}
          disabled={processing}
          className="py-3 px-4 bg-[var(--accent-emerald)] text-[var(--on-accent-text)] rounded-lg hover:opacity-90 transition-all font-semibold transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {processing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            <>
              <span className="mr-2">✓</span>
              Approve Payment
            </>
          )}
        </button>
        
        <button
          onClick={handleRejectClick}
          disabled={processing}
          className="py-3 px-4 rounded-lg transition-all font-semibold transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" style={{ background: 'var(--accent-rose)', color: '#fff' }}
        >
          <span className="mr-2">✗</span>
          Reject Payment
        </button>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              Reject Payment Request
            </h3>
            
            <div className="mb-4">
              <p className="text-[var(--text-muted)] mb-2">
                Table {request.table_number} - ₹{parseFloat(request.total_amount).toFixed(2)}
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                Please provide a reason for rejecting this payment:
              </p>
            </div>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Insufficient cash, Wrong amount, Customer cancelled..."
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none resize-none" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              rows="4"
              autoFocus
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleRejectCancel}
                disabled={processing}
                className="flex-1 py-3 bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-surface-hover)] transition-all font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 py-3 rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'var(--accent-rose)', color: '#fff' }}
              >
                {processing ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  )
}

export default PaymentApprovalControls
