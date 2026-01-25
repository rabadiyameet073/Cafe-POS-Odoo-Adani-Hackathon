function initCashierLayout() {
    authService.getCurrentUser().then(userData => {
        if (!userData) {
            window.location.href = 'login.html'
            return
        }

        if (userData.role !== 'cashier' && userData.role !== 'admin') {
            window.location.href = getDefaultRoute(userData.role)
            return
        }

        const userNameEl = document.getElementById('userName')
        const userRoleEl = document.getElementById('userRole')
        if (userNameEl) userNameEl.textContent = userData.full_name || 'Cashier'
        if (userRoleEl) userRoleEl.textContent = userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
    })

    const logoutBtn = document.getElementById('logoutBtn')
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            authService.logout()
        })
    }

    updateCashierNavActive()
    updateSessionStatus()
}

function updateCashierNavActive() {
    const currentPath = window.location.pathname
    const slug = (href) => (href || '').replace('.html', '')

    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href')
        if (currentPath.includes(slug(href))) {
            link.classList.add('bg-slate-900', 'text-white')
            link.classList.remove('text-slate-600', 'hover:bg-white/60', 'hover:text-slate-900')
        } else {
            link.classList.remove('bg-slate-900', 'text-white')
            link.classList.add('text-slate-600', 'hover:bg-white/60', 'hover:text-slate-900')
        }
    })
}

function getSessionFromStorage() {
    const stored = localStorage.getItem('pos_session')
    if (stored) return JSON.parse(stored)
    return null
}

function saveSessionToStorage(session) {
    localStorage.setItem('pos_session', JSON.stringify(session))
    updateSessionStatus()
}

function clearSession() {
    localStorage.removeItem('pos_session')
    updateSessionStatus()
}

function updateSessionStatus() {
    const session = getSessionFromStorage()
    const statusEl = document.getElementById('sessionStatus')

    if (statusEl) {
        if (session && session.isOpen) {
            statusEl.className = 'px-3 py-2 rounded-xl text-sm bg-emerald-50 text-emerald-700'
            statusEl.innerHTML = `
                <p class="font-medium">● Session Open</p>
                <p class="text-xs mt-1 opacity-80">${session.sessionNumber || ''}</p>
            `
        } else {
            statusEl.className = 'px-3 py-2 rounded-xl text-sm bg-amber-50 text-amber-700'
            statusEl.innerHTML = '<p class="font-medium">○ No Active Session</p>'
        }
    }
}

function isSessionOpen() {
    const session = getSessionFromStorage()
    return session && session.isOpen
}

document.addEventListener('DOMContentLoaded', initCashierLayout)
