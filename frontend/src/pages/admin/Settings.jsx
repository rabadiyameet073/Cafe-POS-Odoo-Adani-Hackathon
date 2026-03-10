import { useState } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { showToast } from '../../components/Toast'

const SETTINGS_KEY = 'cafe_pos_settings'

const defaultSettings = {
    cafe_name: 'Odoo Cafe',
    tax_rate: 5,
    timer_duration: 39,
    upi_id: 'rabadiyameet09@okaxis',
    currency: 'INR',
    auto_accept_orders: false,
    enable_notifications: true
  }

const Settings = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
    } catch {
      return defaultSettings
    }
  })

  const handleSave = (e) => {
    e.preventDefault()
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      showToast('Settings saved successfully')
    } catch {
      showToast('Failed to save settings', 'error')
    }
  }

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <AdminLayout>
      <div className="animate-slide-up">
        <h1 className="page-title mb-6">Settings</h1>

        <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
          {/* General Settings */}
          <div className="section-card p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">General</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Cafe Name</label>
                <input type="text" value={settings.cafe_name} onChange={(e) => handleChange('cafe_name', e.target.value)} className="input-field" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Tax Rate (%)</label>
                  <input type="number" value={settings.tax_rate} onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value))} className="input-field" step="0.1" min="0" max="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Currency</label>
                  <select value={settings.currency} onChange={(e) => handleChange('currency', e.target.value)} className="input-field">
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Timer & Table Settings */}
          <div className="section-card p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Table & Timer</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Table Release Timer (minutes)</label>
                <input type="number" value={settings.timer_duration} onChange={(e) => handleChange('timer_duration', parseInt(e.target.value))} className="input-field" min="1" />
                <p className="text-xs text-[var(--text-muted)] mt-1">Tables will be auto-released after this duration of inactivity.</p>
              </div>
            </div>
          </div>

          {/* Payment Settings */}
          <div className="section-card p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Payment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">UPI ID</label>
                <input type="text" value={settings.upi_id} onChange={(e) => handleChange('upi_id', e.target.value)} className="input-field" />
                <p className="text-xs text-[var(--text-muted)] mt-1">Used for generating UPI QR codes for customer payments.</p>
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="section-card p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Preferences</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-[var(--text-secondary)]">Auto-accept Orders</p>
                  <p className="text-xs text-[var(--text-muted)]">Automatically send orders to kitchen without cashier approval</p>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition-all ${settings.auto_accept_orders ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-surface-hover)]'}`} onClick={() => handleChange('auto_accept_orders', !settings.auto_accept_orders)}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-[var(--bg-surface)] rounded-full shadow transition-all ${settings.auto_accept_orders ? 'left-6' : 'left-0.5'}`}></div>
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-[var(--text-secondary)]">Enable Notifications</p>
                  <p className="text-xs text-[var(--text-muted)]">Show browser notifications for new orders and payments</p>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition-all ${settings.enable_notifications ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-surface-hover)]'}`} onClick={() => handleChange('enable_notifications', !settings.enable_notifications)}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-[var(--bg-surface)] rounded-full shadow transition-all ${settings.enable_notifications ? 'left-6' : 'left-0.5'}`}></div>
                </div>
              </label>
            </div>
          </div>

          <button type="submit" className="w-full py-3 btn-primary rounded-lg hover:shadow-lg transition-all font-semibold text-lg">
            Save Settings
          </button>
        </form>

      </div>
    </AdminLayout>
  )
}

export default Settings
