import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { getAllFeedback, getFeedbackStats } from '../../services/cafe.service'

const StarDisplay = ({ rating, max = 5 }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(max)].map((_, i) => (
      <svg key={i} className="w-4 h-4" viewBox="0 0 20 20" fill={i < rating ? '#F5A623' : 'rgba(255,255,255,0.1)'}>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
    <span className="ml-1.5 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{rating}/5</span>
  </div>
)

const StatCard = ({ label, value, color, icon }) => (
  <div className="stat-card p-5">
    <div className="flex items-start justify-between mb-3">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={icon} />
        </svg>
      </div>
    </div>
    <p className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</p>
    <p className="text-xs font-medium mt-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
  </div>
)

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [allFeedback, feedbackStats] = await Promise.all([
        getAllFeedback(),
        getFeedbackStats()
      ])
      setFeedbacks(allFeedback)
      setStats(feedbackStats)
    } catch (err) {
      console.error('Failed to load feedback:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = feedbacks.filter(f => {
    if (filter !== 'all') {
      const rating = f.overall_rating || 0
      if (filter === 'positive' && rating < 4) return false
      if (filter === 'neutral' && (rating < 3 || rating > 3)) return false
      if (filter === 'negative' && rating > 2) return false
    }
    if (search) {
      const s = search.toLowerCase()
      return (
        (f.comment && f.comment.toLowerCase().includes(s)) ||
        (f.suggestions && f.suggestions.toLowerCase().includes(s)) ||
        (f.table_number && String(f.table_number).includes(s))
      )
    }
    return true
  })

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <AdminLayout>
      <div className="animate-slide-up">
        {/* Header */}
        <div className="mb-7 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">Customer Feedback</h1>
            <p className="page-subtitle">All feedback and reviews from customers</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105" style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', color: 'var(--accent-primary)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading feedback…</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <StatCard label="Total Reviews" value={stats.total} color="#F5A623" icon="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                <StatCard label="Avg Overall" value={stats.avgOverall.toFixed(1)} color="#FFD700" icon="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                <StatCard label="Avg Food" value={stats.avgFood.toFixed(1)} color="#FF6B9D" icon="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                <StatCard label="Avg Service" value={stats.avgService.toFixed(1)} color="#00FF94" icon="M13 10V3L4 14h7v7l9-11h-7z" />
                <StatCard label="Avg Wait Time" value={stats.avgWaiting.toFixed(1)} color="#A855F7" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                <StatCard label="Avg Ambience" value={stats.avgAmbience.toFixed(1)} color="#3B82F6" icon="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </div>
            )}

            {/* Filters */}
            <div className="section-card p-4 mb-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                {['all', 'positive', 'neutral', 'negative'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                    style={{
                      background: filter === f ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                      color: filter === f ? '#000' : 'var(--text-secondary)',
                      border: `1px solid ${filter === f ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}`
                    }}
                  >
                    {f === 'positive' ? '★ 4-5' : f === 'neutral' ? '★ 3' : f === 'negative' ? '★ 1-2' : 'All'}
                  </button>
                ))}
              </div>
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search comments, suggestions, table number…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl text-sm outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}
                />
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Feedback List */}
            {filtered.length === 0 ? (
              <div className="section-card p-12 text-center">
                <svg className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>No feedback found</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {filter !== 'all' || search ? 'Try changing the filters or search query' : 'Customer feedback will appear here'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filtered.map((fb) => (
                  <div key={fb.id} className="section-card p-5 transition-all hover:scale-[1.005]">
                    <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold" style={{
                          background: fb.overall_rating >= 4 ? 'rgba(0,255,148,0.12)' : fb.overall_rating >= 3 ? 'rgba(245,166,35,0.12)' : 'rgba(255,107,157,0.12)',
                          color: fb.overall_rating >= 4 ? '#00FF94' : fb.overall_rating >= 3 ? '#F5A623' : '#FF6B9D',
                          border: `1px solid ${fb.overall_rating >= 4 ? 'rgba(0,255,148,0.25)' : fb.overall_rating >= 3 ? 'rgba(245,166,35,0.25)' : 'rgba(255,107,157,0.25)'}`
                        }}>
                          T{fb.table_number || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Table {fb.table_number || 'Unknown'}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(fb.created_at)}</p>
                        </div>
                      </div>
                      <StarDisplay rating={fb.overall_rating || 0} />
                    </div>

                    {/* Rating Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: 'Food Quality', value: fb.food_quality_rating, color: '#FF6B9D' },
                        { label: 'Service Speed', value: fb.service_speed_rating, color: '#00FF94' },
                        { label: 'Waiting Time', value: fb.waiting_time_rating, color: '#A855F7' },
                        { label: 'Ambience', value: fb.ambience_rating, color: '#3B82F6' }
                      ].map(r => (
                        <div key={r.label} className="px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <p className="text-[10px] uppercase tracking-wide font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{r.label}</p>
                          <div className="flex items-center gap-1">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${((r.value || 0) / 5) * 100}%`, background: r.color }} />
                            </div>
                            <span className="text-xs font-bold" style={{ color: r.color }}>{r.value || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Comment & Suggestions */}
                    {(fb.comment || fb.suggestions) && (
                      <div className="space-y-2">
                        {fb.comment && (
                          <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-[10px] uppercase tracking-wide font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Comment</p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{fb.comment}</p>
                          </div>
                        )}
                        {fb.suggestions && (
                          <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.1)' }}>
                            <p className="text-[10px] uppercase tracking-wide font-medium mb-1" style={{ color: '#A855F7' }}>Suggestion</p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{fb.suggestions}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default Feedback
