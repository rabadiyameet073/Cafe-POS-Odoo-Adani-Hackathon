const api = {
    baseURL: '/api',
    timeout: 10000,

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        }
        const token = localStorage.getItem('token')
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }
        return headers
    },

    async request(method, endpoint, data = null) {
        const url = `${this.baseURL}${endpoint}`
        const options = {
            method,
            headers: this.getHeaders()
        }

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data)
        }

        try {
            const response = await fetch(url, options)
            const responseData = await response.json().catch(() => ({}))

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token')
                    if (!window.location.pathname.includes('login')) {
                        window.location.href = 'login.html'
                    }
                }
                throw new Error(responseData.message || responseData.error || 'An error occurred')
            }

            return responseData
        } catch (error) {
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                throw new Error('No response from server. Please check your connection.')
            }
            throw error
        }
    },

    get(endpoint) {
        return this.request('GET', endpoint)
    },

    post(endpoint, data) {
        return this.request('POST', endpoint, data)
    },

    put(endpoint, data) {
        return this.request('PUT', endpoint, data)
    },

    patch(endpoint, data) {
        return this.request('PATCH', endpoint, data)
    },

    delete(endpoint) {
        return this.request('DELETE', endpoint)
    }
}