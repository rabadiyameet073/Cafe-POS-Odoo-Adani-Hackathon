/**
 * Frontend Error Handling Utilities
 * 
 * Provides user-friendly error messages, automatic recovery for token expiration,
 * reconnection logic for lost connections, and error logging to monitoring service.
 * 
 * Requirements: 18.2
 */

import { reconnectAllSubscriptions } from '../services/supabase.service'
import { API_URL } from './constants'

/**
 * Error types and their user-friendly messages
 */
const ERROR_MESSAGES = {
  // Token errors (400)
  INVALID_TOKEN: 'Your session has expired. Please select a table again.',
  TOKEN_EXPIRED: 'Your table session has expired. Please select a new table.',
  TOKEN_REVOKED: 'Your table session is no longer valid. Please select a new table.',
  
  // State errors (400)
  INVALID_STATE: 'This operation cannot be performed at this time.',
  TABLE_NOT_OCCUPIED: 'Table must be occupied to place an order.',
  PAYMENT_NOT_CONFIRMED: 'Payment must be confirmed before proceeding.',
  
  // Validation errors (400)
  VALIDATION_ERROR: 'Please check your input and try again.',
  CART_EMPTY: 'Your cart is empty. Please add items before checking out.',
  
  // Authorization errors (403)
  UNAUTHORIZED: 'You do not have permission to perform this action.',
  ACCESS_DENIED: 'Access denied. Please log in with appropriate credentials.',
  
  // Not found errors (404)
  NOT_FOUND: 'The requested resource was not found.',
  TABLE_NOT_FOUND: 'Table not found. Please try again.',
  ORDER_NOT_FOUND: 'Order not found.',
  
  // Conflict errors (409)
  CONFLICT: 'This resource already exists.',
  TABLE_OCCUPIED: 'This table is already occupied. Please select another table.',
  
  // Payment errors (400/402)
  PAYMENT_FAILED: 'Payment processing failed. Please try again.',
  PAYMENT_EXPIRED: 'Payment QR code has expired. Please generate a new one.',
  PAYMENT_REQUIRED: 'Payment is required to proceed.',
  
  // Server errors (500)
  SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  DATABASE_ERROR: 'Database error occurred. Please try again.',
  
  // Network errors
  NETWORK_ERROR: 'Network connection lost. Please check your internet connection.',
  CONNECTION_LOST: 'Connection to server lost. Attempting to reconnect...',
  TIMEOUT: 'Request timed out. Please try again.',
  
  // Default
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
}

/**
 * Parse error from API response and return user-friendly message
 * @param {Error|Object} error - Error object or API error response
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyMessage(error) {
  // Handle network errors
  if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
    return ERROR_MESSAGES.NETWORK_ERROR
  }
  
  // Handle timeout errors
  if (error.message?.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT
  }
  
  // Handle API error responses
  const errorMessage = error.message || error.error || ''
  
  // Token errors
  if (errorMessage.includes('token') && errorMessage.includes('expired')) {
    return ERROR_MESSAGES.TOKEN_EXPIRED
  }
  if (errorMessage.includes('token') && errorMessage.includes('invalid')) {
    return ERROR_MESSAGES.INVALID_TOKEN
  }
  if (errorMessage.includes('token') && errorMessage.includes('revoked')) {
    return ERROR_MESSAGES.TOKEN_REVOKED
  }
  
  // State errors
  if (errorMessage.includes('not occupied')) {
    return ERROR_MESSAGES.TABLE_NOT_OCCUPIED
  }
  if (errorMessage.includes('payment') && errorMessage.includes('confirmed')) {
    return ERROR_MESSAGES.PAYMENT_NOT_CONFIRMED
  }
  
  // Cart errors
  if (errorMessage.includes('cart') && errorMessage.includes('empty')) {
    return ERROR_MESSAGES.CART_EMPTY
  }
  
  // Table errors
  if (errorMessage.includes('table') && errorMessage.includes('occupied')) {
    return ERROR_MESSAGES.TABLE_OCCUPIED
  }
  if (errorMessage.includes('table') && errorMessage.includes('not found')) {
    return ERROR_MESSAGES.TABLE_NOT_FOUND
  }
  
  // Payment errors
  if (errorMessage.includes('payment') && errorMessage.includes('failed')) {
    return ERROR_MESSAGES.PAYMENT_FAILED
  }
  if (errorMessage.includes('payment') && errorMessage.includes('expired')) {
    return ERROR_MESSAGES.PAYMENT_EXPIRED
  }
  
  // Authorization errors
  if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
    return ERROR_MESSAGES.UNAUTHORIZED
  }
  if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
    return ERROR_MESSAGES.ACCESS_DENIED
  }
  
  // Not found errors
  if (errorMessage.includes('404') || errorMessage.includes('not found')) {
    return ERROR_MESSAGES.NOT_FOUND
  }
  
  // Conflict errors
  if (errorMessage.includes('409') || errorMessage.includes('conflict')) {
    return ERROR_MESSAGES.CONFLICT
  }
  
  // Server errors
  if (errorMessage.includes('500') || errorMessage.includes('server error')) {
    return ERROR_MESSAGES.SERVER_ERROR
  }
  if (errorMessage.includes('database')) {
    return ERROR_MESSAGES.DATABASE_ERROR
  }
  
  // Return the original message if it's user-friendly, otherwise return default
  if (errorMessage && errorMessage.length < 100 && !errorMessage.includes('Error:')) {
    return errorMessage
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR
}

/**
 * Handle token expiration with automatic recovery
 * @param {Function} navigate - React Router navigate function
 * @param {string} currentPath - Current path to return to after recovery
 */
export function handleTokenExpiration(navigate, currentPath = null) {
  // Clear expired token from localStorage
  const tableToken = localStorage.getItem('tableToken')
  if (tableToken) {
    localStorage.removeItem('tableToken')
    localStorage.removeItem('sessionId')
  }
  
  // Clear cart
  localStorage.removeItem('cart')
  
  // Log the expiration
  logError({
    type: 'token_expiration',
    message: 'Table token expired',
    path: currentPath,
    timestamp: new Date().toISOString()
  })
  
  // Redirect to table selection
  navigate('/customer/floors', {
    state: {
      message: ERROR_MESSAGES.TOKEN_EXPIRED,
      returnPath: currentPath
    }
  })
}

/**
 * Handle connection loss with automatic reconnection
 * @param {Function} onReconnect - Callback to execute after successful reconnection
 * @returns {Object} Reconnection controller
 */
export function handleConnectionLoss(onReconnect) {
  let reconnectAttempts = 0
  const maxAttempts = 10
  const initialDelay = 1000
  const maxDelay = 30000
  const backoffMultiplier = 2
  
  let reconnectTimeout = null
  let isReconnecting = false
  
  const attemptReconnect = () => {
    if (reconnectAttempts >= maxAttempts) {
      logError({
        type: 'connection_failure',
        message: 'Max reconnection attempts reached',
        attempts: reconnectAttempts,
        timestamp: new Date().toISOString()
      })
      return
    }
    
    reconnectAttempts++
    isReconnecting = true
    
    const delay = Math.min(
      initialDelay * Math.pow(backoffMultiplier, reconnectAttempts - 1),
      maxDelay
    )
    
    console.log(`Attempting to reconnect (${reconnectAttempts}/${maxAttempts}) in ${delay}ms...`)
    
    reconnectTimeout = setTimeout(async () => {
      try {
        // Test connection by making a simple API call against the same API base URL
        // that the rest of the app is using (works locally and on Vercel).
        const base = API_URL || ''
        const healthUrl = `${base.replace(/\/+$/, '')}/health`
        const response = await fetch(healthUrl)
        
        if (response.ok) {
          console.log('Connection restored!')
          isReconnecting = false
          reconnectAttempts = 0
          
          // Reconnect all Supabase subscriptions
          reconnectAllSubscriptions()
          
          // Execute callback
          if (onReconnect) {
            onReconnect()
          }
        } else {
          attemptReconnect()
        }
      } catch (error) {
        console.error('Reconnection attempt failed:', error)
        attemptReconnect()
      }
    }, delay)
  }
  
  // Start reconnection
  attemptReconnect()
  
  // Return controller
  return {
    cancel: () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
      isReconnecting = false
      reconnectAttempts = 0
    },
    isReconnecting: () => isReconnecting,
    getAttempts: () => reconnectAttempts
  }
}

/**
 * Log error to monitoring service
 * In production, this would send to services like Sentry, LogRocket, etc.
 * @param {Object} errorDetails - Error details to log
 */
export function logError(errorDetails) {
  const logEntry = {
    ...errorDetails,
    timestamp: errorDetails.timestamp || new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'anonymous'
  }
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Error logged:', logEntry)
  }
  
  // TODO: Send to monitoring service in production
  // Examples:
  // - Sentry.captureException(error)
  // - LogRocket.captureException(error)
  // - Custom analytics endpoint
  
  // For now, store in localStorage for debugging (limit to last 50 errors)
  try {
    const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]')
    errorLog.unshift(logEntry)
    if (errorLog.length > 50) {
      errorLog.pop()
    }
    localStorage.setItem('errorLog', JSON.stringify(errorLog))
  } catch (e) {
    console.error('Failed to log error:', e)
  }
}

/**
 * Global error handler for uncaught errors
 */
export function setupGlobalErrorHandler() {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    logError({
      type: 'uncaught_error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    })
  })
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError({
      type: 'unhandled_rejection',
      message: event.reason?.message || 'Unhandled promise rejection',
      reason: event.reason
    })
  })
  
  // Handle online/offline events
  window.addEventListener('offline', () => {
    console.warn('Connection lost')
    logError({
      type: 'connection_lost',
      message: 'Network connection lost'
    })
  })
  
  window.addEventListener('online', () => {
    console.log('Connection restored')
    reconnectAllSubscriptions()
  })
}

/**
 * Error boundary helper for React components
 * @param {Error} error - Error object
 * @param {Object} errorInfo - React error info
 */
export function handleReactError(error, errorInfo) {
  logError({
    type: 'react_error',
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack
  })
}

export default {
  getUserFriendlyMessage,
  handleTokenExpiration,
  handleConnectionLoss,
  logError,
  setupGlobalErrorHandler,
  handleReactError,
  ERROR_MESSAGES
}
