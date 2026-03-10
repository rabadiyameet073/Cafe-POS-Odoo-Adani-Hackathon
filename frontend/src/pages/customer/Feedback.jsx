import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerLayout from '../../components/layouts/CustomerLayout'
import { submitFeedback } from '../../services/cafe.service'
import Icon from '../../components/Icons'
import { showToast } from '../../components/Toast'

const ratingLabels = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent!'
}

const categories = [
  { key: 'food_quality_rating', label: 'Food Quality', iconName: 'plate', desc: 'How was the taste & presentation?' },
  { key: 'service_speed_rating', label: 'Service Speed', iconName: 'fire', desc: 'How fast was your order served?' },
  { key: 'waiting_time_rating', label: 'Waiting Time', iconName: 'hourglass', desc: 'Was the wait time reasonable?' },
  { key: 'ambience_rating', label: 'Ambience', iconName: 'sparkle', desc: 'How was the atmosphere & cleanliness?' },
  { key: 'overall_rating', label: 'Overall Experience', iconName: 'star', desc: 'Your overall rating' }
]

const Feedback = () => {
  const [ratings, setRatings] = useState({
    food_quality_rating: 0,
    service_speed_rating: 0,
    waiting_time_rating: 0,
    ambience_rating: 0,
    overall_rating: 0
  })
  const [hoverRatings, setHoverRatings] = useState({})
  const [comment, setComment] = useState('')
  const [suggestions, setSuggestions] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()

  const tableToken = sessionStorage.getItem('table_token')
  const tableNumber = sessionStorage.getItem('table_number')

  const setRating = (key, value) => {
    setRatings(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (ratings.overall_rating === 0) {
      showToast('Please rate your overall experience', 'error')
      return
    }
    setSubmitting(true)
    try {
      await submitFeedback({
        table_token: tableToken,
        table_number: tableNumber,
        order_id: null,
        session_id: sessionStorage.getItem('session_id') || null,
        ...ratings,
        comment,
        suggestions
      })
      setSubmitted(true)
      showToast('Thank you for your feedback!')

      // Clear session data
      sessionStorage.removeItem('table_token')
      sessionStorage.removeItem('table_number')
      sessionStorage.removeItem('table_id')
      sessionStorage.removeItem('session_id')
      sessionStorage.removeItem('floor_name')
      sessionStorage.removeItem('cafe_cart')
    } catch (error) {
      showToast(error.message || 'Failed to submit feedback', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Thank You Screen ───
  if (submitted) {
    return (
      <CustomerLayout>
        <div className="animate-slide-up text-center py-16">
          <div className="flex justify-center mb-6"><Icon name="sparkle" className="w-20 h-20 text-[var(--accent-rose)]" /></div>
          <h1 className="page-title mb-3">Thank You!</h1>
          <p className="text-[var(--text-muted)] text-lg mb-2">Your feedback helps us serve you better.</p>
          <p className="text-[var(--text-muted)] mb-8">We appreciate your visit to our cafe!</p>
          <button
            onClick={() => navigate('/customer/select-floor')}
            className="px-8 py-3 btn-primary rounded-xl hover:shadow-lg transition-all font-semibold text-lg"
          >
            <Icon name="building" className="w-5 h-5 inline -mt-0.5" /> Back to Home
          </button>
        </div>
      </CustomerLayout>
    )
  }

  // ─── Feedback Form ───
  return (
    <CustomerLayout>
      <div className="animate-slide-up max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="page-title">Share Your Experience</h1>
          <p className="text-[var(--text-muted)] mt-1">Table {tableNumber} • We'd love to hear from you!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ─── Rating Categories ─── */}
          {categories.map(cat => {
            const currentRating = ratings[cat.key]
            const hover = hoverRatings[cat.key] || 0
            const isRequired = cat.key === 'overall_rating'

            return (
              <div key={cat.key} className={`section-card p-5 rounded-2xl ${isRequired ? 'border-2 border-[rgba(214,158,46,0.30)]' : ''
                }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon name={cat.iconName} className="w-6 h-6" />
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)]">
                      {cat.label}
                      {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">{cat.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(cat.key, star)}
                        onMouseEnter={() => setHoverRatings(prev => ({ ...prev, [cat.key]: star }))}
                        onMouseLeave={() => setHoverRatings(prev => ({ ...prev, [cat.key]: 0 }))}
                        className="text-3xl transition-transform hover:scale-125 focus:outline-none"
                      >
                        {star <= (hover || currentRating) ? <Icon name="starFilled" className="w-7 h-7 text-amber-400" /> : <Icon name="star" className="w-7 h-7 text-slate-300" />}
                      </button>
                    ))}
                  </div>
                  {currentRating > 0 && (
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-lg ${currentRating >= 4 ? 'bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)]'
                      : currentRating >= 3 ? 'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]'
                        : 'bg-[var(--accent-rose)]/10 text-[var(--accent-rose)]'
                      }`}>
                      {ratingLabels[currentRating]}
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {/* ─── Comment ─── */}
          <div className="section-card p-5 rounded-2xl">
            <h3 className="font-bold text-[var(--text-primary)] mb-2"><Icon name="chatBubble" className="w-5 h-5 inline -mt-0.5" /> What did you like?</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you enjoyed about your visit..."
              rows="3"
              className="w-full px-4 py-3 border border-[var(--border-subtle)] rounded-xl focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent resize-none bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* ─── Suggestions ─── */}
          <div className="section-card p-5 rounded-2xl">
            <h3 className="font-bold text-[var(--text-primary)] mb-2"><Icon name="lightbulb" className="w-5 h-5 inline -mt-0.5" /> Any suggestions?</h3>
            <textarea
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="How can we improve? Any dishes you'd like to see?"
              rows="2"
              className="w-full px-4 py-3 border border-[var(--border-subtle)] rounded-xl focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent resize-none bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* ─── Submit ─── */}
          <button
            type="submit"
            disabled={submitting || ratings.overall_rating === 0}
            className="w-full py-4 btn-primary rounded-xl hover:shadow-lg transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : <><Icon name="send" className="w-5 h-5 inline -mt-0.5" /> Submit Feedback</>}
          </button>

          <button
            type="button"
            onClick={() => navigate('/customer/select-floor')}
            className="w-full py-3 bg-[var(--bg-surface-hover)] text-[var(--text-muted)] rounded-xl hover:bg-[var(--bg-surface-hover)] transition-all font-medium"
          >
            Skip & Go Home
          </button>
        </form>

      </div>
    </CustomerLayout>
  )
}

export default Feedback
