/**
 * useErrorHandler Hook
 * 
 * Custom React hook for handling errors in components
 * Provides user-friendly error messages and automatic recovery
 * 
 * Requirement 18.2
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserFriendlyMessage, handleTokenExpiration, logError } from '../utils/errorHandler'

export function useErrorHandler() {
  const [error, setError] = useState(null)
  const [isError, setIsError] = useState(false)
  const navigate = useNavigate()

  /**
   * Handle error with user-friendly message
   * @param {Error|Object} err - Error object
   * @param {Object} context - Additional context for logging
   */
  const handleError = useCallback((err, context = {}) => {
    const friendlyMessage = getUserFriendlyMessage(err)
    
    // Log the error
    logError({
      type: 'component_error',
      message: err.message || err.error || 'Unknown error',
      friendlyMessage,
      ...context,
      timestamp: new Date().toISOString()
    })
    
    // Check if it's a token expiration error
    if (err.message?.toLowerCase().includes('token') && 
        (err.message.includes('expired') || err.message.includes('invalid'))) {
      handleTokenExpiration(navigate, context.currentPath)
      return
    }
    
    // Set error state
    setError(friendlyMessage)
    setIsError(true)
    
    // Auto-clear error after 5 seconds
    setTimeout(() => {
      clearError()
    }, 5000)
  }, [navigate])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
    setIsError(false)
  }, [])

  /**
   * Wrap async function with error handling
   * @param {Function} fn - Async function to wrap
   * @param {Object} context - Additional context for logging
   * @returns {Function} Wrapped function
   */
  const withErrorHandling = useCallback((fn, context = {}) => {
    return async (...args) => {
      try {
        return await fn(...args)
      } catch (err) {
        handleError(err, context)
        throw err // Re-throw so caller can handle if needed
      }
    }
  }, [handleError])

  return {
    error,
    isError,
    handleError,
    clearError,
    withErrorHandling
  }
}

export default useErrorHandler
