/**
 * Cafe POS Frontend - Entry Point
 * 
 * Bootstraps the React 18 application with light theme default.
 * See App.jsx for routes, contexts, and layout structure.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Ensure light mode is applied on load
const root = document.getElementById('root')

// Apply light class immediately
document.documentElement.classList.add('light')
document.documentElement.setAttribute('data-theme', 'light')

if (!root) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

