import { API_URL } from './constants'
import { getUserFriendlyMessage, handleTokenExpiration, logError } from './errorHandler'

class ApiService {
  constructor() {
    this.baseURL = API_URL
    this.timeout = 10000
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    }
    const token = localStorage.getItem('token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

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
        const errorMessage = responseData.message || responseData.error || 'An error occurred'
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          
          // Log the error
          logError({
            type: 'authentication_error',
            status: 401,
            message: errorMessage,
            endpoint,
            method
          })
          
          if (!window.location.pathname.includes('login')) {
            window.location.href = '/login'
          }
          throw new Error(`401: ${errorMessage}`)
        }
        
        // Handle 400 Bad Request - check for token errors
        if (response.status === 400 && errorMessage.toLowerCase().includes('token')) {
          logError({
            type: 'token_error',
            status: 400,
            message: errorMessage,
            endpoint,
            method
          })
          
          // Token expiration will be handled by the component using handleTokenExpiration
          throw new Error(errorMessage)
        }
        
        // Log other errors
        logError({
          type: 'api_error',
          status: response.status,
          message: errorMessage,
          endpoint,
          method
        })
        
        throw new Error(errorMessage)
      }

      return responseData
    } catch (error) {
      // Handle network errors
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        logError({
          type: 'network_error',
          message: 'No response from server',
          endpoint,
          method
        })
        throw new Error('No response from server. Please check your connection.')
      }
      
      throw error
    }
  }

  get(endpoint) {
    return this.request('GET', endpoint)
  }

  post(endpoint, data) {
    return this.request('POST', endpoint, data)
  }

  put(endpoint, data) {
    return this.request('PUT', endpoint, data)
  }

  patch(endpoint, data) {
    return this.request('PATCH', endpoint, data)
  }

  delete(endpoint) {
    return this.request('DELETE', endpoint)
  }
}

export const api = new ApiService()
