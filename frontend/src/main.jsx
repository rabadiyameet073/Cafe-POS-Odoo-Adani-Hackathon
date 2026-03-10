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

