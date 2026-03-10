/**
 * Error Boundary Component
 * 
 * Catches React errors and displays user-friendly error messages
 * Requirement 18.2
 */

import { Component } from 'react'
import { handleReactError, logError } from '../utils/errorHandler'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    handleReactError(error, errorInfo)

    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })

    // Optionally reload the page
    if (this.props.resetOnError) {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
          <div className="max-w-md w-full backdrop-blur-xl border border-[var(--border-subtle)] rounded-2xl shadow-lg p-8 text-center" style={{ background: 'var(--bg-surface)' }}>
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-[var(--accent-rose)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Oops! Something went wrong
            </h2>

            <p className="text-[rgba(255,210,145,0.55)] mb-6">
              We're sorry for the inconvenience. The error has been logged and we'll look into it.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-[rgba(229,62,62,0.12)] rounded-lg text-left border border-[rgba(229,62,62,0.25)]">
                <p className="text-sm font-mono text-[var(--accent-rose)] break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2 btn-primary rounded-xl hover:shadow-lg hover:shadow-red-900/30 transition-all font-medium"
              >
                Try Again
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-2 bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-xl hover:bg-[rgba(255,255,255,0.08)] transition-all font-medium"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
