const Toast = {
    container: null,

    init() {
        if (this.container) return
        this.container = document.createElement('div')
        this.container.id = 'toast-container'
        this.container.className = 'fixed right-4 flex flex-col gap-2'
        this.container.style.cssText = 'position:fixed;top:76px;right:16px;z-index:99999;display:flex;flex-direction:column;gap:8px'
        document.body.appendChild(this.container)
    },

    show(message, type = 'info') {
        this.init()

        const toast = document.createElement('div')
        toast.className = `
            flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg
            bg-white/90 backdrop-blur-sm border border-slate-100
            animate-slide-up max-w-sm
        `.replace(/\s+/g, ' ').trim()

        const iconColors = {
            success: 'text-emerald-500',
            error: 'text-red-500',
            warning: 'text-amber-500',
            info: 'text-sky-500'
        }

        const icons = {
            success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
            error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
            warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
            info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
        }

        toast.innerHTML = `
            <span class="${iconColors[type] || iconColors.info}">${icons[type] || icons.info}</span>
            <span class="text-slate-700 text-sm font-medium">${message}</span>
        `

        this.container.appendChild(toast)

        setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity', 'duration-300')
            setTimeout(() => toast.remove(), 300)
        }, 3000)
    },

    success(message) {
        this.show(message, 'success')
    },

    error(message) {
        this.show(message, 'error')
    },

    warning(message) {
        this.show(message, 'warning')
    },

    info(message) {
        this.show(message, 'info')
    }
}
