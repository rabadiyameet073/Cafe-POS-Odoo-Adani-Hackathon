const Modal = {
    overlay: null,
    onCloseCallback: null,

    open(contentHtml, options = {}) {
        this.close()

        const { title, size = 'md', onClose } = options
        this.onCloseCallback = onClose

        this.overlay = document.createElement('div')
        this.overlay.className = 'modal-overlay'
        this.overlay.onclick = (e) => {
            if (e.target === this.overlay) this.close()
        }

        const sizeClasses = {
            sm: 'max-w-sm',
            md: 'max-w-lg',
            lg: 'max-w-2xl',
            xl: 'max-w-4xl',
            full: 'max-w-full mx-8'
        }

        const container = document.createElement('div')
        container.className = `modal-container ${sizeClasses[size] || sizeClasses.md}`

        let headerHtml = ''
        if (title) {
            headerHtml = `
                <div class="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 class="text-lg font-semibold text-slate-900">${title}</h2>
                    <button type="button" class="modal-close-btn p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            `
        }

        container.innerHTML = `
            ${headerHtml}
            <div class="p-6">${contentHtml}</div>
        `

        this.overlay.appendChild(container)
        document.body.appendChild(this.overlay)
        document.body.style.overflow = 'hidden'

        const closeBtn = container.querySelector('.modal-close-btn')
        if (closeBtn) {
            closeBtn.onclick = () => this.close()
        }

        document.addEventListener('keydown', this.handleEscape)

        return container
    },

    handleEscape(e) {
        if (e.key === 'Escape') {
            Modal.close()
        }
    },

    close() {
        if (this.overlay) {
            this.overlay.remove()
            this.overlay = null
            document.body.style.overflow = ''
            document.removeEventListener('keydown', this.handleEscape)

            if (this.onCloseCallback) {
                this.onCloseCallback()
                this.onCloseCallback = null
            }
        }
    },

    getContainer() {
        return this.overlay?.querySelector('.modal-container')
    }
}
