import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/api.service'
import { socketService } from '../services/socket.service'
import { getDefaultRoute } from '../utils/constants'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (!token) {
      setLoading(false)
      return
    }

    // Set user from localStorage immediately to prevent redirect
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Failed to parse stored user:', e)
      }
    }

    try {
      const response = await authService.getCurrentUser()
      setUser(response.data.user)
      // Update localStorage with fresh user data
      localStorage.setItem('user', JSON.stringify(response.data.user))
      
      // Connect socket after authentication
      socketService.connect(token)
      socketService.joinRole(response.data.user.role, response.data.user.id)
    } catch (error) {
      console.error('Auth check failed:', error)
      // Only clear auth if it's a 401 (unauthorized) error
      if (error.message && error.message.startsWith('401:')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        socketService.disconnect()
        setUser(null)
      }
      // Otherwise keep the user logged in (network issues, etc.)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    const response = await authService.login(credentials)
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    setUser(response.data.user)
    
    // Connect socket after login
    socketService.connect(response.data.token)
    socketService.joinRole(response.data.user.role, response.data.user.id)
    
    return response.data
  }

  const signup = async (userData) => {
    const response = await authService.signup(userData)
    return response.data
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    socketService.disconnect()
    setUser(null)
    window.location.href = '/login'
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
