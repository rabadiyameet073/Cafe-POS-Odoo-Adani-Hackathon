import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import Icon from '../../components/Icons'

const Payment = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Payment is now handled directly on the Cart page
    // Redirect to cart which includes the payment flow
    const cart = sessionStorage.getItem('cart')
    if (cart && JSON.parse(cart).length > 0) {
      navigate('/customer/cart', { replace: true })
    } else {
      navigate('/customer/browse-menu', { replace: true })
    }
  }, [navigate])

  return (
    <CustomerLayout>
      <div className="animate-slide-up text-center py-12">
        <div className="text-5xl mb-4"><Icon name="refresh" className="w-5 h-5 inline" /></div>
        <p className="text-[var(--text-muted)]">Redirecting to checkout...</p>
      </div>
    </CustomerLayout>
  )
}

export default Payment
