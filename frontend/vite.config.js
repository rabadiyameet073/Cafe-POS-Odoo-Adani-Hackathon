import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const targetUrl = process.env.VITE_BACKEND_URL || 'https://cafe-pos-odoo-adani-hackathon.vercel.app'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: targetUrl,
        changeOrigin: true,
        secure: true
      },
      '/rest': {
        target: targetUrl,
        changeOrigin: true,
        secure: true
      }
    }
  }
})
