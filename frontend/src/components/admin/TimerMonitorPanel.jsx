import { useState, useEffect } from 'react'
import { api } from '../../utils/api'
import { subscribeToTable, unsubscribeFromChannel } from '../../services/supabase.service'
import Loading from '../Loading'
import Toast from '../Toast'
import Icon from '../Icons'

const TimerMonitorPanel = () => {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [extensionMinutes, setExtensionMinutes] = useState(10)

  useEffect(() => {
    fetchActiveSessions()

    // Subscribe to table_sessions filtered by timer_status='running'
    const channel = subscribeToTable(
      'table_sessions',
      'timer_status=eq.running',
      (payload) => {
        console.log('Timer session change detected:', payload)
        
        if (payload.eventType === 'INSERT') {
          setSessions(prev => [...prev, payload.new])
        } else if (payload.eventType === 'UPDATE') {
          setSessions(prev => prev.map(s => 
            s.id === payload.new.id ? payload.new : s
          ))
        } else if (payload.eventType === 'DELETE') {
          setSessions(prev => prev.filter(s => s.id !== payload.old.id))
        }
      }
    )

    return () => {
      unsubscribeFromChannel(channel)
    }
  }, [])

  const fetchActiveSessions = async () => {
    try {
      const response = await api.get('/timers/active')
      const timers = response.data.timers || response.timers || []
      
      // Convert timers to sessions format
      const sessions = timers.map(timer => ({
        id: timer.sessionId,
        table_id: timer.tableId,
        table_number: timer.tableNumber,
        timer_started_at: timer.timerStartedAt,
        timer_ends_at: timer.timerEndsAt,
        timer_status: 'running'
      }))
      
      setSessions(sessions)
    } catch (error) {
      showToast('Failed to load active timers', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleResetTimer = async (sessionId, tableNumber) => {
    if (!confirm(`Reset timer for Table ${tableNumber} to 39 minutes?`)) {
      return
    }

    try {
      await api.post('/timers/reset', { session_id: sessionId })
      showToast('Timer reset successfully', 'success')
      fetchActiveSessions()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to reset timer', 'error')
    }
  }

  const handleExtendTimer = async (e) => {
    e.preventDefault()
    
    if (!selectedSession || extensionMinutes <= 0) {
      showToast('Invalid extension time', 'error')
      return
    }

    try {
      await api.post('/timers/extend', {
        session_id: selectedSession.id,
        extension_minutes: extensionMinutes
      })
      showToast(`Timer extended by ${extensionMinutes} minutes`, 'success')
      setShowExtendModal(false)
      setSelectedSession(null)
      setExtensionMinutes(10)
      fetchActiveSessions()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to extend timer', 'error')
    }
  }

  const handleStopTimer = async (sessionId, tableNumber) => {
    const reason = prompt(`Enter reason for stopping timer for Table ${tableNumber}:`)
    if (!reason) return

    try {
      await api.post('/timers/stop', {
        session_id: sessionId,
        reason: reason
      })
      showToast('Timer stopped and table freed', 'success')
      fetchActiveSessions()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to stop timer', 'error')
    }
  }

  const openExtendModal = (session) => {
    setSelectedSession(session)
    setShowExtendModal(true)
  }

  if (loading) return <Loading />

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Active Timers Monitor
        </h2>
        <p className="text-[var(--text-muted)]">
          {sessions.length === 0 
            ? 'No active timers' 
            : `${sessions.length} active timer${sessions.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Timers Grid */}
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4"><Icon name="timer" className="w-5 h-5 inline" /></div>
          <p className="text-[var(--text-muted)] text-lg">
            No active table timers
          </p>
          <p className="text-[var(--text-muted)] text-sm mt-2">
            Timers start automatically after payment confirmation
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sessions.map((session) => {
            const now = new Date()
            const endsAt = new Date(session.timer_ends_at)
            const startedAt = new Date(session.timer_started_at)
            const remainingSeconds = Math.max(0, Math.floor((endsAt - now) / 1000))
            
            const minutes = Math.floor(remainingSeconds / 60)
            const seconds = remainingSeconds % 60
            const isExpiring = remainingSeconds < 300 // Less than 5 minutes

            return (
              <TimerCard
                key={session.id}
                session={session}
                minutes={minutes}
                seconds={seconds}
                isExpiring={isExpiring}
                startedAt={startedAt}
                onReset={() => handleResetTimer(session.id, session.table_number)}
                onExtend={() => openExtendModal(session)}
                onStop={() => handleStopTimer(session.id, session.table_number)}
              />
            )
          })}
        </div>
      )}

      {/* Extend Timer Modal */}
      {showExtendModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              Extend Timer - Table {selectedSession.table_number}
            </h3>
            
            <form onSubmit={handleExtendTimer} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
                  Extension Time (minutes)
                </label>
                <input
                  type="number"
                  value={extensionMinutes}
                  onChange={(e) => setExtensionMinutes(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  min="1"
                  max="120"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 btn-primary rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  Extend Timer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExtendModal(false)
                    setSelectedSession(null)
                    setExtensionMinutes(10)
                  }}
                  className="flex-1 py-2 bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-surface-hover)] transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

// Separate component for timer card with its own countdown state
const TimerCard = ({ session, minutes: initialMinutes, seconds: initialSeconds, isExpiring: initialIsExpiring, startedAt, onReset, onExtend, onStop }) => {
  const [remainingSeconds, setRemainingSeconds] = useState(initialMinutes * 60 + initialSeconds)

  useEffect(() => {
    // Calculate remaining time every second
    const calculateRemaining = () => {
      const now = new Date()
      const endsAt = new Date(session.timer_ends_at)
      const diff = Math.max(0, Math.floor((endsAt - now) / 1000))
      setRemainingSeconds(diff)
    }

    calculateRemaining()
    const interval = setInterval(calculateRemaining, 1000)

    return () => clearInterval(interval)
  }, [session.timer_ends_at])

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const isExpiring = remainingSeconds < 300

  return (
    <div
      className={`section-card p-4 border-2 transition-all ${
        isExpiring 
          ? 'border-[var(--accent-rose)] bg-[rgba(255,107,157,0.12)] animate-pulse' 
          : 'border-[var(--accent-emerald)] bg-[rgba(0,255,148,0.10)]'
      }`}
    >
      {/* Timer Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">
            Table {session.table_number}
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            {session.floor_name || 'Floor'}
          </p>
        </div>
        {isExpiring && (
          <span className="px-2 py-1 text-white text-xs font-bold rounded-full animate-pulse" style={{ background: 'var(--accent-rose)' }}>
            EXPIRING
          </span>
        )}
      </div>

      {/* Countdown Display */}
      <div className="mb-4 p-4 bg-[var(--bg-surface)] bg-opacity-50 rounded-lg text-center">
        <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Time Remaining</p>
        <p className={`text-4xl font-mono font-bold ${isExpiring ? 'text-[var(--accent-rose)]' : 'text-[var(--accent-emerald)]'}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </p>
      </div>

      {/* Start Time */}
      <div className="mb-4 text-sm">
        <p className="text-[var(--text-muted)]">
          <span className="font-semibold">Started:</span>{' '}
          {startedAt.toLocaleTimeString()}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onReset}
          className="w-full py-2 bg-[var(--accent-gold)] text-[var(--on-accent-text)] rounded-lg hover:opacity-90 transition-all text-sm font-semibold"
        >
          Reset to 39 min
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onExtend}
            className="py-2 bg-[var(--accent-gold)] text-[var(--on-accent-text)] rounded-lg hover:opacity-90 transition-all text-sm font-semibold"
          >
            Extend
          </button>
          <button
            onClick={onStop}
            className="py-2 rounded-lg transition-all text-sm font-semibold" style={{ background: 'var(--accent-rose)', color: '#fff' }}
          >
            Stop & Free
          </button>
        </div>
      </div>
    </div>
  )
}

export default TimerMonitorPanel
