import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { createOrder, createPayment, createCashierRequest, completeUPIPayment, buildUPIString, getQRCodeURL } from '../../services/cafe.service'
import { subscribeToTable, unsubscribeFromChannel } from '../../services/supabase.service'
import { showToast } from '../../components/Toast'

const PaymentPage = () => {
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [qrData, setQrData] = useState(null)
  const [paymentId, setPaymentId] = useState(null)
  const [orderId, setOrderId] = useState(null)
  // Cash payment: wait for cashier approval
  const [waitingForCashier, setWaitingForCashier] = useState(false)
  const [cashierStatus, setCashierStatus] = useState(null) // 'pending' | 'approved' | 'rejected'
  const navigate = useNavigate()

  const tableToken = sessionStorage.getItem('table_token')
  const tableNumber = sessionStorage.getItem('table_number')

  useEffect(() => {
    if (!tableToken) {
      sessionStorage.setItem('_toast', 'Please select a table before ordering.')
      navigate('/customer/select-floor', { replace: true })
      return
    }
    const saved = sessionStorage.getItem('cafe_cart')
    if (!saved || JSON.parse(saved).length === 0) {
      navigate('/customer/browse-menu', { replace: true })
      return
    }
    setCart(JSON.parse(saved))
  }, [])

  // Subscribe to cashier_payment_requests for real-time approval
  useEffect(() => {
    if (!waitingForCashier || !paymentId) return

    const sub = subscribeToTable('cashier_payment_requests', `payment_id=eq.${paymentId}`, (payload) => {
      if (payload.new && payload.new.status === 'approved') {
        setCashierStatus('approved')
        showToast('Payment approved by cashier!')
        sessionStorage.removeItem('cafe_cart')
        setTimeout(() => navigate('/customer/order-tracking'), 1500)
      } else if (payload.new && payload.new.status === 'rejected') {
        setCashierStatus('rejected')
        showToast('Payment rejected by cashier.', 'error')
        setWaitingForCashier(false)
      }
    })

    // Also subscribe to payment updates directly
    const sub2 = subscribeToTable('payments', `id=eq.${paymentId}`, (payload) => {
      if (payload.new && ['approved', 'completed'].includes(payload.new.status)) {
        setCashierStatus('approved')
        showToast('Payment confirmed!')
        sessionStorage.removeItem('cafe_cart')
        setTimeout(() => navigate('/customer/order-tracking'), 1500)
      }
    })

    return () => {
      unsubscribeFromChannel(sub)
      unsubscribeFromChannel(sub2)
    }
  }, [waitingForCashier, paymentId])

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const tax = subtotal * 0.05
  const total = subtotal + tax

  const handlePay = async () => {
    if (!paymentMethod) { showToast('Please select a payment method', 'error'); return }
    if (processing) return
    setProcessing(true)

    try {
      // 1. Create order
      const order = await createOrder(tableToken, cart, subtotal, tax, total)

      // 2. Create payment
      const payment = await createPayment(order.id, paymentMethod, total, tableToken, tableNumber)

      if (paymentMethod === 'cash') {
        // 3a. Cash: create cashier request → STAY on this page waiting for approval
        await createCashierRequest(payment.id, order.id, tableToken, tableNumber, total, cart)
        setPaymentId(payment.id)
        setOrderId(order.id)
        setCashierStatus('pending')
        setWaitingForCashier(true)
        setProcessing(false)
        showToast('Cash payment request sent to cashier. Please wait...')
      } else {
        // 3b. UPI: show QR
        const upiString = buildUPIString(total, tableToken)
        setQrData({
          url: getQRCodeURL(upiString),
          upiString,
          amount: total
        })
        setPaymentId(payment.id)
        setOrderId(order.id)
        setShowQR(true)
        setProcessing(false)
      }
    } catch (err) {
      showToast(err.message || 'Payment failed', 'error')
      setProcessing(false)
    }
  }

  const handleUPIDone = async () => {
    setProcessing(true)
    try {
      await completeUPIPayment(paymentId, orderId)
      sessionStorage.removeItem('cafe_cart')
      setShowQR(false)
      showToast('Payment recorded! Redirecting...')
      setTimeout(() => navigate('/customer/order-tracking'), 1200)
    } catch (err) {
      showToast(err.message || 'Failed to confirm payment', 'error')
      setProcessing(false)
    }
  }

  // ─── Cashier Wait Screen ───
  if (waitingForCashier) {
    return (
      <CustomerLayout>
        <div className="pay-page">
          <div className="pay-wait-card">
            {cashierStatus === 'approved' ? (
              <div className="pay-wait-content pay-wait-approved">
                <div className="pay-wait-icon-wrap">
                  <div className="pay-wait-icon" style={{background:'#10b981'}}>
                    <span className="pay-wait-letter">✓</span>
                  </div>
                </div>
                <h2 className="pay-wait-title" style={{color:'var(--accent-emerald)'}}>Payment Approved!</h2>
                <p className="pay-wait-desc">Your order has been sent to the kitchen.</p>
                <div className="pay-redirect-badge">
                  <div className="pay-redirect-dot" /> Redirecting to order tracking...
                </div>
              </div>
            ) : cashierStatus === 'rejected' ? (
              <div className="pay-wait-content pay-wait-rejected">
                <div className="pay-wait-icon-wrap">
                  <div className="pay-wait-icon" style={{background:'var(--accent-red)'}}>
                    <span className="pay-wait-letter">×</span>
                  </div>
                </div>
                <h2 className="pay-wait-title" style={{color:'var(--accent-red)'}}>Payment Rejected</h2>
                <p className="pay-wait-desc">The cashier declined your payment request.</p>
                <button onClick={() => { setWaitingForCashier(false); setCashierStatus(null) }} className="pay-cta-btn" style={{background:'var(--accent-red)'}}>
                  Try Again
                </button>
              </div>
            ) : (
              <div className="pay-wait-content">
                <div className="pay-wait-icon-wrap">
                  <div className="pay-wait-icon pay-wait-pulse" style={{background:'var(--accent-primary)'}}>
                    <span className="pay-wait-letter">…</span>
                  </div>
                  <div className="pay-wait-ring" />
                </div>
                <h2 className="pay-wait-title">Waiting for Cashier</h2>
                <p className="pay-wait-desc">Please pay <span className="pay-amount-highlight">₹{total.toFixed(2)}</span> at the cashier counter</p>

                <div className="pay-info-card">
                  <span className="pay-info-dot" style={{background:'var(--accent-primary)'}} />
                  <div>
                    <p className="pay-info-text">Walk to the cashier and pay in cash</p>
                    <p className="pay-info-sub">You'll be automatically redirected once confirmed</p>
                  </div>
                </div>

                <div className="pay-listening-row">
                  <div className="pay-listening-dots">
                    <span style={{animationDelay:'0ms'}} />
                    <span style={{animationDelay:'150ms'}} />
                    <span style={{animationDelay:'300ms'}} />
                  </div>
                  <span>Listening for approval...</span>
                </div>

                <p className="pay-table-info">Table {tableNumber}</p>
              </div>
            )}
          </div>
        </div>

      </CustomerLayout>
    )
  }

  // ─── Main Payment Page ───
  return (
    <CustomerLayout>
      <div className="pay-page">
        {/* Header */}
        <div className="pay-header">
          <button onClick={() => navigate('/customer/shopping-cart')} className="pay-back-btn">
            <span className="pay-back-arrow">←</span>
          </button>
          <div>
            <h1 className="pay-title">Checkout</h1>
            <p className="pay-table-label">Table {tableNumber}</p>
          </div>
        </div>

        <div className="pay-grid">
          {/* ═══ Order Summary Card ═══ */}
          <div className="pay-card pay-summary-card">
            <div className="pay-card-header">
              <div className="pay-card-dot" style={{background:'var(--accent-primary)'}} />
              <h2>Order Summary</h2>
              <span className="pay-item-count">{cart.length} items</span>
            </div>

            <div className="pay-items-list">
              {cart.map((item, idx) => (
                <div key={item.product_id} className="pay-item-row" style={{animationDelay:`${idx * 50}ms`}}>
                  <div className="pay-item-left">
                    <span className="pay-item-qty">{item.quantity}×</span>
                    <span className="pay-item-name">{item.name}</span>
                  </div>
                  <span className="pay-item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pay-summary-footer">
              <div className="pay-summary-line"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="pay-summary-line"><span>Tax (5%)</span><span>₹{tax.toFixed(2)}</span></div>
              <div className="pay-total-line">
                <span>Total</span>
                <span className="pay-total-value">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* ═══ Payment Method Card ═══ */}
          <div className="pay-card pay-method-card">
            <div className="pay-card-header">
              <div className="pay-card-dot" style={{background:'var(--accent-emerald)'}} />
              <h2>Payment Method</h2>
            </div>

            <div className="pay-methods">
              {/* UPI Option */}
              <button onClick={() => setPaymentMethod('upi')} className={`pay-method-option ${paymentMethod === 'upi' ? 'pay-method-selected' : ''}`}>
                <div className="pay-radio">{paymentMethod === 'upi' && <div className="pay-radio-dot" />}</div>
                <div className="pay-method-icon-box" style={{background:'#6366f1'}}>
                  <span className="pay-method-letter">U</span>
                </div>
                <div className="pay-method-info">
                  <p className="pay-method-name">UPI / QR Code</p>
                  <p className="pay-method-desc">Google Pay, PhonePe, Paytm</p>
                </div>
                {paymentMethod === 'upi' && <span className="pay-check">✓</span>}
              </button>

              {/* Cash Option */}
              <button onClick={() => setPaymentMethod('cash')} className={`pay-method-option ${paymentMethod === 'cash' ? 'pay-method-selected' : ''}`}>
                <div className="pay-radio">{paymentMethod === 'cash' && <div className="pay-radio-dot" />}</div>
                <div className="pay-method-icon-box" style={{background:'#10b981'}}>
                  <span className="pay-method-letter">₹</span>
                </div>
                <div className="pay-method-info">
                  <p className="pay-method-name">Cash</p>
                  <p className="pay-method-desc">Pay at the cashier counter</p>
                </div>
                {paymentMethod === 'cash' && <span className="pay-check">✓</span>}
              </button>
            </div>

            {paymentMethod === 'cash' && (
              <div className="pay-info-card pay-info-small">
                <span className="pay-info-dot" style={{background:'var(--accent-primary)'}} />
                <p className="pay-info-text">Go to the cashier and pay the amount. The cashier will confirm your payment.</p>
              </div>
            )}

            <button onClick={handlePay} disabled={processing || !paymentMethod} className="pay-submit-btn">
              {processing ? (
                <span className="pay-processing"><span className="pay-spinner" /> Processing...</span>
              ) : (
                <>Pay ₹{total.toFixed(2)}</>
              )}
            </button>
          </div>
        </div>

        {/* ═══ UPI QR Modal ═══ */}
        {showQR && qrData && (
          <div className="pay-modal-overlay">
            <div className="pay-modal-backdrop" onClick={handleUPIDone} />
            <div className="pay-modal">
              <button onClick={handleUPIDone} className="pay-modal-close">✕</button>

              <div className="pay-qr-header">
                <h2>Scan to Pay</h2>
                <p className="pay-qr-amount">₹{qrData.amount.toFixed(2)}</p>
              </div>

              <div className="pay-qr-wrap">
                <div className="pay-qr-frame">
                  <img src={qrData.url} alt="UPI QR Code" className="pay-qr-img" />
                </div>
              </div>

              <div className="pay-qr-info">
                <p>UPI ID: <strong>rabadiyameet09@okaxis</strong></p>
                <p className="pay-qr-hint">Scan with any UPI app</p>
              </div>

              <button onClick={handleUPIDone} disabled={processing} className="pay-done-btn">
                {processing ? (
                  <span className="pay-processing"><span className="pay-spinner" /> Confirming...</span>
                ) : (
                  <>I have paid</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Toast */}
      </div>
    </CustomerLayout>
  )
}

export default PaymentPage
