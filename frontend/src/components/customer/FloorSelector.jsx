import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { floorService } from '../../services/api.service'
import { subscribeToTable, unsubscribeFromChannel, invalidateCache } from '../../services/supabase.service'
import { useCachedData } from '../../hooks/useCachedData'
import Loading from '../Loading'
import Toast from '../Toast'
import Icon from '../Icons'

const FloorSelector = () => {
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()

  // Use cached data for floors (static data with 5-minute TTL)
  const { data: floors, loading, error, invalidate } = useCachedData(
    'floors',
    async () => {
      const response = await floorService.getAllFloors()
      return response.data.floors?.filter(f => f.is_active) || []
    }
  )

  useEffect(() => {
    if (error) {
      showToast(error.message || 'Failed to load floors', 'error')
    }
  }, [error])

  useEffect(() => {
    // Set up Supabase subscription to floors table for real-time updates
    const subscription = subscribeToTable('floors', null, (payload) => {
      console.log('Floor change detected:', payload)
      
      // Invalidate cache to trigger refetch with updated data
      invalidate()
    })

    return () => {
      unsubscribeFromChannel(subscription)
    }
  }, [invalidate])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const selectFloor = (floor) => {
    navigate(`/customer/tables?floor=${floor.id}`)
  }

  const getTableCount = (floor) => {
    // This would ideally come from the API response
    return floor.table_count || 0
  }

  const getFloorIcon = (floorName) => {
    const name = floorName.toLowerCase()
    if (name.includes('ground')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 21v-6h6v6" />
          <path d="M9 9h.01" />
          <path d="M15 9h.01" />
          <path d="M9 13h.01" />
          <path d="M15 13h.01" />
        </svg>
      )
    }
    if (name.includes('first') || name.includes('1st') || name.includes('upper') || name.includes('second') || name.includes('2nd')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 5 11 12 2 5" />
          <path d="M2 5v14l9 4 11-4V5" />
          <path d="M11 12v9" />
          <path d="M15 7.5v4" />
          <path d="M15 15h.01" />
        </svg>
      )
    }
    if (name.includes('outdoor') || name.includes('terrace') || name.includes('garden') || name.includes('patio') || name.includes('rooftop')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="3" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="8" y1="10" x2="12" y2="8" />
          <line x1="16" y1="10" x2="12" y2="8" />
          <path d="M6 20c0-4 2.5-6 6-8" />
          <path d="M18 20c0-4-2.5-6-6-8" />
          <path d="M12 12c-1.5 2-4 3.5-4 6h8c0-2.5-2.5-4-4-6z" />
          <line x1="3" y1="20" x2="21" y2="20" />
        </svg>
      )
    }
    // Default building icon
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
      </svg>
    )
  }

  if (loading) return <Loading />

  return (
    <div className="animate-slide-up">
      <h1 className="page-title mb-6">Select Floor</h1>

      {!floors || floors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)] text-lg">No floors available at the moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {floors.map((floor) => (
            <div
              key={floor.id}
              onClick={() => selectFloor(floor)}
              className="section-card p-4 sm:p-6 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-[var(--accent-primary)]"
            >
              <div className="text-center">
                <div className="text-[var(--accent-primary)] mb-4">{getFloorIcon(floor.name)}</div>
                <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-2">{floor.name}</h3>
                {floor.description && (
                  <p className="text-[var(--text-muted)] text-sm mb-4">{floor.description}</p>
                )}
                <div className="flex justify-center items-center gap-2 text-[var(--accent-primary)]">
                  <span className="text-lg font-semibold">{getTableCount(floor)}</span>
                  <span className="text-sm">tables available</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default FloorSelector
