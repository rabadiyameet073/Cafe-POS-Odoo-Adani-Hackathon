import { useState, useEffect } from 'react'
import CashierLayout from '../../components/layouts/CashierLayout'
import { sessionService } from '../../services/api.service'
import Loading from '../../components/Loading'
import { showToast } from '../../components/Toast'
import Icon from '../../components/Icons'

const Session = () => {
  const [activeSession, setActiveSession] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [openingBalance, setOpeningBalance] = useState('')
  const [closingNotes, setClosingNotes] = useState('')

  useEffect(() => { fetchSessions() }, [])

  const fetchSessions = async () => {
    try {
      const [activeRes, allRes] = await Promise.all([
        sessionService.getActiveSession().catch(() => ({ data: null })),
        sessionService.getAllSessions().catch(() => ({ data: [] }))
      ])
      setActiveSession(activeRes.data?.session || activeRes.data || null)
      setSessions(allRes.data?.sessions || allRes.data || [])
    } catch (error) {
      showToast('Failed to load sessions', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenSession = async () => {
    if (!openingBalance) { showToast('Please enter opening balance', 'error'); return }
    try {
      await sessionService.openSession({ opening_balance: parseFloat(openingBalance) })
      showToast('Session opened successfully')
      setOpeningBalance('')
      fetchSessions()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to open session', 'error')
    }
  }

  const handleCloseSession = async () => {
    if (!activeSession) return
    try {
      await sessionService.closeSession(activeSession.id, { notes: closingNotes })
      showToast('Session closed successfully')
      setClosingNotes('')
      fetchSessions()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to close session', 'error')
    }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'

  if (loading) return <CashierLayout><Loading /></CashierLayout>

  return (
    <CashierLayout>
      <div className="animate-slide-up">
        <h1 className="page-title mb-6"><Icon name="timer" className="w-5 h-5 inline" /> Session Management</h1>

        {/* Active Session or Open New */}
        {activeSession ? (
          <div className="section-card p-6 mb-6" style={{ border: '2px solid rgba(0,255,148,0.25)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--accent-emerald)' }}></div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Active Session</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div><p className="text-sm text-[var(--text-muted)]">Opened</p><p className="font-bold">{formatDate(activeSession.opened_at || activeSession.created_at)}</p></div>
              <div><p className="text-sm text-[var(--text-muted)]">Opening Balance</p><p className="font-bold text-[var(--accent-primary)]">₹{parseFloat(activeSession.opening_balance || 0).toFixed(2)}</p></div>
              <div><p className="text-sm text-[var(--text-muted)]">Total Orders</p><p className="font-bold">{activeSession.total_orders || 0}</p></div>
              <div><p className="text-sm text-[var(--text-muted)]">Total Sales</p><p className="font-bold text-[var(--accent-emerald)]">₹{parseFloat(activeSession.total_sales || 0).toFixed(2)}</p></div>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Closing Notes</label>
                <input type="text" value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)} placeholder="Optional closing notes..." className="input-field" />
              </div>
              <button onClick={handleCloseSession} className="px-6 py-2 rounded-lg font-semibold transition-all hover:scale-105" style={{ background: 'var(--accent-rose)', color: '#fff', boxShadow: '0 4px 12px rgba(255,107,157,0.3)' }}>Close Session</button>
            </div>
          </div>
        ) : (
          <div className="section-card p-6 mb-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Open New Session</h2>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Opening Balance (₹)</label>
                <input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="Enter opening cash balance" className="input-field" step="0.01" min="0" />
              </div>
              <button onClick={handleOpenSession} className="px-6 py-2 btn-primary rounded-lg font-semibold hover:shadow-lg transition-all">Open Session</button>
            </div>
          </div>
        )}

        {/* Past Sessions */}
        <div className="section-card p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Past Sessions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="text-left py-3 px-4 text-sm">Opened</th>
                  <th className="text-left py-3 px-4 text-sm">Closed</th>
                  <th className="text-left py-3 px-4 text-sm">Opening</th>
                  <th className="text-left py-3 px-4 text-sm">Sales</th>
                  <th className="text-left py-3 px-4 text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr><td colSpan="5" className="py-8 text-center text-[var(--text-muted)]">No past sessions</td></tr>
                ) : (
                  sessions.map(session => (
                    <tr key={session.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]">
                      <td className="py-3 px-4 text-sm">{formatDate(session.opened_at || session.created_at)}</td>
                      <td className="py-3 px-4 text-sm">{formatDate(session.closed_at)}</td>
                      <td className="py-3 px-4 text-sm">₹{parseFloat(session.opening_balance || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm font-semibold">₹{parseFloat(session.total_sales || 0).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${session.status === 'open' ? 'bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)]' : 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]'}`}>
                          {session.status || 'closed'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </CashierLayout>
  )
}

export default Session
