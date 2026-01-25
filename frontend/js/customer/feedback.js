let selectedRating = 0
let orderId = null

function setRating(rating) {
    selectedRating = rating

    document.querySelectorAll('.rating-btn').forEach((btn, index) => {
        if (index < rating) {
            btn.classList.add('border-amber-400', 'bg-amber-50')
            btn.classList.remove('border-slate-200')
        } else {
            btn.classList.remove('border-amber-400', 'bg-amber-50')
            btn.classList.add('border-slate-200')
        }
    })
}

document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search)
    orderId = urlParams.get('order_id') || localStorage.getItem('pendingFeedbackOrderId')
    
    if (!orderId) {
        setTimeout(() => {
            window.location.href = 'customer-menu.html'
        }, 1500)
        return
    }

    document.getElementById('submitFeedbackBtn').addEventListener('click', async function () {
        if (selectedRating === 0) {
            Toast.warning('Please select a rating')
            return
        }

        const comments = document.getElementById('comments').value.trim()

        Loading.showButton(this)

        try {
            await api.post('/feedback', {
                order_id: orderId,
                overall_rating: selectedRating,
                comments: comments
            })

            localStorage.removeItem('pendingFeedbackOrderId')
            Toast.success('Thank you for your feedback!')

            setTimeout(() => {
                window.location.href = 'customer-menu.html'
            }, 1000)
        } catch (error) {
            console.error('Feedback submission error:', error)
            Toast.success('Thank you for your feedback!')
            localStorage.removeItem('pendingFeedbackOrderId')

            setTimeout(() => {
                window.location.href = 'customer-menu.html'
            }, 1000)
        }
    })
})
