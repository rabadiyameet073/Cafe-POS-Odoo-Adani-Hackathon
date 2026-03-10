import { useState } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import OccupiedTablesView from '../../components/admin/OccupiedTablesView'
import TimerMonitorPanel from '../../components/admin/TimerMonitorPanel'
import TableManagementPanel from '../../components/admin/TableManagementPanel'
import PaymentMonitorPanel from '../../components/admin/PaymentMonitorPanel'
import Icon from '../../components/Icons'

const RealtimeDashboard = () => {
  const [activeTab, setActiveTab] = useState('occupied')
  const [tabKey, setTabKey] = useState(0)

  const tabs = [
    { id: 'occupied', label: 'Occupied Tables', icon: '<Icon name="chair" className="w-5 h-5 inline" />' },
    { id: 'timers', label: 'Timer Monitor', icon: '<Icon name="timer" className="w-5 h-5 inline" />' },
    { id: 'tables', label: 'Table Management', icon: '<Icon name="clipboard" className="w-5 h-5 inline" />' },
    { id: 'payments', label: 'Payment Monitor', icon: '<Icon name="cash" className="w-5 h-5 inline" />' }
  ]

  return (
    <AdminLayout>
      <div className="animate-slide-up">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="page-title mb-2">
            Real-Time Dashboard
          </h1>
          <p className="text-[var(--text-muted)]">
            Monitor tables, timers, and payments in real-time
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-bar mb-6 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { if (tab.id !== activeTab) { setActiveTab(tab.id); setTabKey(k => k + 1) } }}
              className={`tab-pill ${activeTab === tab.id ? 'active-amber' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div key={tabKey} className="tab-content-enter min-h-[60vh]">
          {activeTab === 'occupied' && <OccupiedTablesView />}
          {activeTab === 'timers' && <TimerMonitorPanel />}
          {activeTab === 'tables' && <TableManagementPanel />}
          {activeTab === 'payments' && <PaymentMonitorPanel />}
        </div>
      </div>
    </AdminLayout>
  )
}

export default RealtimeDashboard
