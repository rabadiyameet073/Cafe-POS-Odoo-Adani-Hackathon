const authService = {
    async login(credentials) {
        try {
            const response = await api.post('/auth/login', credentials)
            return response
        } catch (error) {
            throw error
        }
    },

    async signup(userData) {
        try {
            const response = await api.post('/auth/signup', userData)
            return response
        } catch (error) {
            throw error
        }
    },

    async logout() {
        try {
            await api.post('/auth/logout')
        } catch (error) {
        }
        localStorage.removeItem('token')
        window.location.href = 'login.html'
    },

    async getCurrentUser() {
        const token = localStorage.getItem('token')
        if (!token) return null

        try {
            const response = await api.get('/auth/me')
            return response.data.user
        } catch (error) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            return null
        }
    },

    isAuthenticated() {
        return !!localStorage.getItem('token')
    },

    async protectPage(allowedRoles = []) {
        const user = await this.getCurrentUser()

        if (!user) {
            window.location.href = 'login.html'
            return null
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            window.location.href = getDefaultRoute(user.role)
            return null
        }

        return user
    }
}
