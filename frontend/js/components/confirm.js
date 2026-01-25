const Confirm = {
    show(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Confirm',
                message = 'Are you sure?',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                confirmClass = 'btn-primary',
                danger = false
            } = options

            const btnClass = danger ? 'bg-red-500 text-white hover:bg-red-600 rounded-xl px-6 py-3 font-medium transition-colors' : confirmClass

            const content = `
                <div class="text-center">
                    <p class="text-slate-600 mb-6">${message}</p>
                    <div class="flex gap-3 justify-center">
                        <button type="button" class="confirm-cancel btn-secondary">${cancelText}</button>
                        <button type="button" class="confirm-ok ${btnClass}">${confirmText}</button>
                    </div>
                </div>
            `

            const container = Modal.open(content, { title, size: 'sm' })

            const cancelBtn = container.querySelector('.confirm-cancel')
            const okBtn = container.querySelector('.confirm-ok')

            cancelBtn.onclick = () => {
                Modal.close()
                resolve(false)
            }

            okBtn.onclick = () => {
                Modal.close()
                resolve(true)
            }
        })
    },

    async delete(itemName = 'this item') {
        return this.show({
            title: 'Delete Confirmation',
            message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
            confirmText: 'Delete',
            danger: true
        })
    }
}
