function initAdminLayout() {
    authService.getCurrentUser().then(userData => {
        if (!userData) {
            window.location.href = 'login.html'
            return
        }

        if (userData.role !== 'admin') {
            window.location.href = getDefaultRoute(userData.role)
            return
        }

        const userNameEl = document.getElementById('userName')
        if (userNameEl) {
            userNameEl.textContent = userData.full_name || 'Admin'
        }
    })

    const sidebarToggle = document.getElementById('sidebarToggle')
    const sidebarClose = document.getElementById('sidebarClose')
    const sidebar = document.getElementById('sidebar')
    const sidebarOverlay = document.getElementById('sidebarOverlay')

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full')
            if (sidebarOverlay) sidebarOverlay.classList.remove('hidden')
        })
    }

    if (sidebarClose && sidebar) {
        sidebarClose.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full')
            if (sidebarOverlay) sidebarOverlay.classList.add('hidden')
        })
    }

    if (sidebarOverlay && sidebar) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full')
            sidebarOverlay.classList.add('hidden')
        })
    }

    const logoutBtn = document.getElementById('logoutBtn')
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            authService.logout()
        })
    }

    updateAdminNavActive()
}

function updateAdminNavActive() {
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

document.addEventListener('DOMContentLoaded', initAdminLayout)
