document.addEventListener('DOMContentLoaded', function () {
    renderSessionState()
    setupEventListeners()
})

function setupEventListeners() {
    document.getElementById('sessionActionBtn').addEventListener('click', function () {
        const session = getSessionFromStorage()
        if (session && session.isOpen) {
            showCloseModal()
        } else {
            showOpenModal()
        }
    })

    document.getElementById('confirmOpenBtn').addEventListener('click', handleOpenSession)
    document.getElementById('confirmCloseBtn').addEventListener('click', handleCloseSession)
}

async function renderSessionState() {
    const sessionIcon = document.getElementById('sessionIcon')
    const sessionTitle = document.getElementById('sessionTitle')
    const sessionSubtitle = document.getElementById('sessionSubtitle')
    const sessionActionBtn = document.getElementById('sessionActionBtn')
    const sessionDetails = document.getElementById('sessionDetails')

    try {
        const response = await api.get('/sessions/active')
        const session = response.data.session

        if (session) {
            // Store session info for closing logic
            localStorage.setItem('activeSession', JSON.stringify(session))

            sessionIcon.className = 'w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600'
            sessionIcon.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
            sessionTitle.textContent = 'Session Active'
            sessionSubtitle.textContent = session.session_number
            sessionActionBtn.className = 'flex items-center gap-2 py-2.5 px-5 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white transition-all'
            sessionActionBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path></svg> Close Session'

            sessionDetails.classList.remove('hidden')
            document.getElementById('openedAt').textContent = formatDateTime(session.opened_at)
            document.getElementById('openingBalance').textContent = formatCurrency(session.opening_balance)
            document.getElementById('currentBalance').textContent = formatCurrency(session.current_balance || session.opening_balance)
        } else {
            localStorage.removeItem('activeSession')
            renderClosedState()
        }
    } catch (error) {
        // If 404 or other error, assume no active session
        localStorage.removeItem('activeSession')
        renderClosedState()
    }

    function renderClosedState() {
        sessionIcon.className = 'w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 text-slate-400'
        sessionIcon.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
        sessionTitle.textContent = 'No Active Session'
        sessionSubtitle.textContent = ''
        sessionActionBtn.className = 'btn-primary flex items-center gap-2'
        sessionActionBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Open Session'
        sessionDetails.classList.add('hidden')
    }
}

function showOpenModal() {
    document.getElementById('openSessionModal').classList.remove('hidden')
}

function closeOpenModal() {
    document.getElementById('openSessionModal').classList.add('hidden')
    document.getElementById('openingBalanceInput').value = ''
}

function showCloseModal() {
    const sessionStr = localStorage.getItem('activeSession')
    if (!sessionStr) return

    const session = JSON.parse(sessionStr)
    const summary = document.getElementById('closingSummary')
    const currentBalance = session.current_balance || session.opening_balance
    const diff = currentBalance - session.opening_balance

    summary.innerHTML = `
        <div class="flex justify-between mb-2">
            <span class="text-slate-600">Opening Balance</span>
            <span class="font-medium">${formatCurrency(session.opening_balance)}</span>
        </div>
        <div class="flex justify-between mb-2">
            <span class="text-slate-600">Current Balance</span>
            <span class="font-medium">${formatCurrency(currentBalance)}</span>
        </div>
        <div class="flex justify-between border-t border-slate-200 pt-2 mt-2">
            <span class="font-medium text-slate-700">Difference</span>
            <span class="font-bold ${diff >= 0 ? 'text-emerald-600' : 'text-red-600'}">${formatCurrency(diff)}</span>
        </div>
    `
    document.getElementById('closeSessionModal').classList.remove('hidden')
}

function closeCloseModal() {
    document.getElementById('closeSessionModal').classList.add('hidden')
    document.getElementById('closingNotesInput').value = ''
}

async function handleOpenSession() {
    const openingBalanceInput = document.getElementById('openingBalanceInput')
    const balance = parseFloat(openingBalanceInput.value)

    if (!balance && balance !== 0) {
        Toast.warning('Please enter a valid opening balance')
        return
    }

    try {
        await api.post('/sessions/open', { opening_balance: balance })
        Toast.success('Session opened successfully')
        closeOpenModal()
        renderSessionState()
    } catch (error) {
        console.error(error)
        Toast.error(error.message || 'Failed to open session')
    }
}

async function handleCloseSession() {
    const sessionStr = localStorage.getItem('activeSession')
    if (!sessionStr) return

    const session = JSON.parse(sessionStr)
    const notes = document.getElementById('closingNotesInput').value

    try {
        await api.post(`/ sessions / ${session.id}/close`, {
            closing_balance: session.current_balance || session.opening_balance,
            notes: notes
        })

        Toast.success('Session closed successfully')
        localStorage.removeItem('activeSession')
        closeCloseModal()
        renderSessionState()
    } catch (error) {
        console.error(error)
        Toast.error(error.message || 'Failed to close session')
    }
}
