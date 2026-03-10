import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../utils/api'
import { cartService, orderService } from '../../services/api.service'
import { subscribeToTable, unsubscribeFromChannel } from '../../services/supabase.service'
import Loading from '../Loading'
import Toast from '../Toast'
import Icon from '../Icons'

const PaymentSelector = () => {
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [loading, setLoading] = useState(false)
  const [qrCodeData, setQrCodeData] = useState(null)
  const [paymentId, setPaymentId] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [toast, setToast] = useState(null)
  const [orderTotal, setOrderTotal] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    calculateOrderTotal()
  }, [])

  useEffect(() => {
    if (paymentId) {
      // Set up Supabase subscription to payments table for status updates
      const channel = subscribeToTable(
        'payments',
        `id=eq.${paymentId}`,
        (payload) => {
          console.log('Payment status update:', payload)
          
          if (payload.eventType === 'UPDATE') {
            const newStatus = payload.new.status
            setPaymentStatus(newStatus)
            
            if (newStatus === 'approved' || newStatus === 'completed') {
              showToast('Payment confirmed! Redirecting to order tracking...', 'success')
              setTimeout(() => {
                navigate('/customer/order-tracking')
              }, 2000)
            } else if (newStatus === 'rejected' || newStatus === 'failed') {
              showToast('Payment was rejected. Please try again.', 'error')
              setPaymentMethod(null)
              setPaymentId(null)
            }
          }
        }
      )

      return () => {
        unsubscribeFromChannel(channel)
      }
    }
  }, [paymentId, navigate])

  const calculateOrderTotal = async () => {
    const tableToken = sessionStorage.getItem('table_token')
    if (!tableToken) {
      setOrderTotal(0)
      return
    }
    try {
      const response = await cartService.getCartByToken(tableToken)
      const { subtotal = 0, tax_amount = 0, total = 0 } = response.data || {}
      // Persist a lightweight cart snapshot for other components
      const items = (response.data.items || []).map(item => ({
        cart_item_id: item.id,
        product_id: item.product_id,
        name: item.product_name,
        price: item.unit_price,
        image_url: item.product_image,
        quantity: item.quantity
      }))
      sessionStorage.setItem('cart', JSON.stringify(items))
      setOrderTotal(parseFloat(total || subtotal + tax_amount || 0))
    } catch (error) {
      console.error('Failed to calculate order total from backend cart:', error)
      setOrderTotal(0)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCashPayment = async () => {
    setLoading(true)
    try {
      const tableToken = sessionStorage.getItem('table_token')
      if (!tableToken) {
        showToast('Invalid session. Please start over.', 'error')
        navigate('/customer/select-floor')
        return
      }

      // Create order from backend cart (table_token based)
      const orderResponse = await orderService.createOrderFromCart({
        table_token: tableToken
      })

      const orderId = orderResponse.data.order_id

      // Create cash payment request
      const paymentResponse = await api.post('/payments/cash/request', {
        order_id: orderId,
        table_token: tableToken,
        amount: orderTotal
      })

      setPaymentId(paymentResponse.data.payment_id)
      setPaymentMethod('cash')
      setPaymentStatus('pending_approval')
      showToast('Payment request sent to cashier', 'success')
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create payment request', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUPIPayment = async () => {
    setLoading(true)
    try {
      const tableToken = sessionStorage.getItem('table_token')
      if (!tableToken) {
        showToast('Invalid session. Please start over.', 'error')
        navigate('/customer/select-floor')
        return
      }

      // Create order from backend cart
      const orderResponse = await orderService.createOrderFromCart({
        table_token: tableToken
      })

      const orderId = orderResponse.data.order_id

      // Generate UPI QR code
      const qrResponse = await api.post('/payments/upi/generate-qr', {
        order_id: orderId,
        table_token: tableToken,
        amount: orderTotal
      })

      setQrCodeData(qrResponse.data.qr_code_data)
      setPaymentId(qrResponse.data.payment_id)
      setPaymentMethod('upi')
      setPaymentStatus('pending')
      showToast('QR Code generated. Please scan to pay.', 'success')
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to generate QR code', 'error')
    } finally {
      setLoading(false)
    }
  }

  const cancelPayment = () => {
    setPaymentMethod(null)
    setPaymentId(null)
    setPaymentStatus(null)
    setQrCodeData(null)
  }

  const getTableInfo = () => {
    const tableNumber = sessionStorage.getItem('table_number')
    return tableNumber ? `Table ${tableNumber}` : 'No table selected'
  }

  if (loading) return <Loading />

  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Payment</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{getTableInfo()}</p>
        </div>
        {!paymentMethod && (
          <button
            onClick={() => navigate('/customer/shopping-cart')}
            className="px-4 py-2 bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-surface-hover)] transition-all"
          >
            ← Back to Cart
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Order Total */}
        <div className="section-card p-6 mb-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Order Total</h2>
          <div className="text-4xl font-bold text-[var(--accent-primary)]">₹{orderTotal.toFixed(2)}</div>
        </div>

        {/* Payment Method Selection */}
        {!paymentMethod && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Select Payment Method</h2>
            
            {/* Cash Payment Option */}
            <div
              onClick={handleCashPayment}
              className="section-card p-6 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-[var(--accent-primary)]"
              </div>
            </div>

            {/* UPI Payment Option */}
            <div
              onClick={handleUPIPayment}
              className="section-card p-6 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-[var(--accent-primary)]"
              </div>
            </div>
          </div>
        )}

        {/* Cash Payment - Waiting for Approval */}
        {paymentMethod === 'cash' && paymentStatus === 'pending_approval' && (
          <div className="section-card p-8 text-center">
            <div className="text-6xl mb-4"><Icon name="hourglass" className="w-5 h-5 inline" /></div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Waiting for Cashier Approval</h2>
            <p className="text-[var(--text-muted)] mb-6">
              Please proceed to the cashier counter to complete your payment.
              Your order will be sent to the kitchen once payment is approved.
            </p>
            <div className="animate-pulse">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(245,166,35,0.15)' }}>
                <div className="h-full btn-primary w-1/2 animate-slide"></div>
              </div>
            </div>
            <button
              onClick={cancelPayment}
              className="mt-6 px-6 py-2 bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-surface-hover)] transition-all"
            >
              Cancel Payment
            </button>
          </div>
        )}

        {/* UPI Payment - QR Code Display */}}
        {paymentMethod === 'upi' && qrCodeData && (
          <div className="section-card p-8 text-center">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Scan to Pay ₹{orderTotal.toFixed(2)}</h2>
            
            {/* QR Code - Using a simple div for now, would use QRCode library in production */}
            <div className="bg-white p-6 rounded-lg inline-block mb-4 shadow-lg">
              <div className="w-64 h-64 bg-[var(--bg-surface-hover)] flex items-center justify-center border-2 border-slate-300 rounded">
                <div className="text-center">
                  <div className="text-4xl mb-2"><Icon name="phone" className="w-5 h-5 inline" /></div>
                  <p className="text-sm text-[var(--text-muted)]">QR Code</p>
                  <p className="text-xs text-[var(--text-muted)] mt-2">Scan with UPI app</p>
                </div>
              </div>
            </div>

            <p className="text-[var(--text-muted)] mb-4">Scan with any UPI app to complete payment</p>
            
            {/* UPI App Icons */}
            <div className="flex justify-center gap-4 mb-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-2xl shadow flex items-center justify-center mb-1">
                  <span className="text-2xl">G</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">GPay</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-2xl shadow flex items-center justify-center mb-1">
                  <span className="text-2xl">P</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">PhonePe</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-2xl shadow flex items-center justify-center mb-1">
                  <span className="text-2xl">₹</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">Paytm</p>
              </div>
            </div>

            <div className="text-sm text-[var(--text-muted)] mb-4">
              Waiting for payment confirmation...
            </div>

            <div className="animate-pulse mb-4">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(245,166,35,0.15)' }}>
                <div className="h-full btn-primary w-1/2 animate-slide"></div>
              </div>
            </div>

            <button
              onClick={cancelPayment}
              className="px-6 py-2 bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-surface-hover)] transition-all"
            >
              Cancel Payment
            </button>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default PaymentSelector
