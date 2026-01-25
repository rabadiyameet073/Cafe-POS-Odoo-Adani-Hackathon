const Loading = {
    overlay: null,

    show(message = 'Loading...') {
        if (this.overlay) return

        this.overlay = document.createElement('div')
        this.overlay.className = 'fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center'
        this.overlay.innerHTML = `
            <div class="flex flex-col items-center gap-4">
                <div class="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                <p class="text-slate-600 font-medium">${message}</p>
            </div>
        `
        document.body.appendChild(this.overlay)
        document.body.style.overflow = 'hidden'
    },

    hide() {
        if (this.overlay) {
            this.overlay.remove()
            this.overlay = null
            document.body.style.overflow = ''
        }
    },

    showButton(button) {
        if (!button) return
        button.dataset.originalText = button.innerHTML
        button.disabled = true
        button.innerHTML = `
            <span class="flex items-center gap-2">
                <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                <span>Loading...</span>
            </span>
        `
    },

    hideButton(button) {
        if (!button || !button.dataset.originalText) return
        button.disabled = false
        button.innerHTML = button.dataset.originalText
        delete button.dataset.originalText
    }
}
