import { useState } from 'react'
import { api } from '../../utils/api'
import Toast from '../Toast'
import Icon from '../Icons'

const OrderStatusControls = ({ order, onStatusChange }) => {
  const [toast, setToast] = useState(null)
  const [updating, setUpdating] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const updateStatus = async (newStatus) => {
    if (updating) return

    setUpdating(true)
    
    try {
      // Optimistic UI update
      if (onStatusChange) {
        onStatusChange(order.id, newStatus)
      }

      // Call API
      await api.put(`/kitchen/orders/${order.id}/status`, {
        new_status: newStatus
      })

      showToast(`Order marked as ${newStatus}`, 'success')
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update status', 'error')
      
      // Revert optimistic update on error
      if (onStatusChange) {
        onStatusChange(order.id, order.status)
      }
    } finally {
      setUpdating(false)
    }
  }

  const getAvailableActions = () => {
    const actions = []

    switch (order.status) {
      case 'received':
        actions.push({
          label: 'Start Preparing',
          status: 'preparing',
          color: 'bg-amber-600 hover:bg-amber-700',
          icon: '<Icon name="chef" className="w-5 h-5 inline" />'
        })
        break
      case 'preparing':
        actions.push({
          label: 'Mark Ready',
          status: 'ready',
          color: 'bg-emerald-600 hover:bg-emerald-700',
          icon: '<Icon name="checkCircle" className="w-4 h-4 inline" />'
        })
        break
      case 'ready':
        actions.push({
          label: 'Mark Served',
          status: 'served',
          color: 'bg-[var(--accent-primary)] hover:opacity-90',
          icon: '<Icon name="plate" className="w-5 h-5 inline" />'
        })
        break
      default:
        break
    }

    return actions
  }

  const actions = getAvailableActions()

  if (actions.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {actions.map((action) => (
        <button
          key={action.status}
          onClick={() => updateStatus(action.status)}
          disabled={updating}
          className={`w-full py-3 px-4 text-white rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
        >
          <span className="mr-2">{action.icon}</span>
          {updating ? 'Updating...' : action.label}
        </button>
      ))}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default OrderStatusControls
