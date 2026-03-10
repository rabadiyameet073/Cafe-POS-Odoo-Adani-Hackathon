import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layouts/AdminLayout'
import { reportService } from '../../services/api.service'
import { supabase } from '../../services/supabase.service'
import Loading from '../../components/Loading'
import { showToast } from '../../components/Toast'
import Icon from '../../components/Icons'

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales')
  const [tabKey, setTabKey] = useState(0)
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => { fetchReport() }, [activeTab, dateRange])

  const fetchReport = async () => {
    setLoading(true)
    try {
      let res
      switch (activeTab) {
        case 'sales': res = await reportService.getSalesReport(dateRange); break
        case 'products': res = await reportService.getProductReport(dateRange); break
        case 'payments': res = await reportService.getPaymentReport(dateRange); break
        default: res = await reportService.getSalesReport(dateRange)
      }
      setReportData(res.data)
    } catch {
      // Fallback: build basic report from Supabase-direct queries
      try {
        const fallback = await buildFallbackReport(activeTab, dateRange)
        setReportData(fallback)
      } catch {
        setReportData(null)
        showToast('Failed to load report data', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const buildFallbackReport = async (type, range) => {
    const from = range.start_date
    const to = range.end_date + 'T23:59:59'

    if (type === 'sales' || type === 'payments') {
      const { data: payments } = await supabase
        .from('payments')
        .select('*, orders(table_number, total_amount)')
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: false })

      const total = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0)
      const completed = (payments || []).filter(p => p.status === 'completed' || p.status === 'approved')
      const revenue = completed.reduce((sum, p) => sum + Number(p.amount || 0), 0)

      return {
        summary: {
          total_transactions: (payments || []).length,
          total_amount: total,
          completed_amount: revenue,
          pending: (payments || []).filter(p => p.status === 'pending').length,
        },
        data: (payments || []).map(p => ({
          date: new Date(p.created_at).toLocaleDateString('en-IN'),
          table: p.orders?.table_number || 'N/A',
          amount: p.amount,
          method: p.payment_method,
          status: p.status,
        }))
      }
    }

    if (type === 'products') {
      const { data: products } = await supabase
        .from('products')
        .select('*, product_categories(name)')
        .eq('is_active', true)
        .order('name')

      return {
        summary: {
          total_products: (products || []).length,
          available: (products || []).filter(p => p.is_available).length,
          unavailable: (products || []).filter(p => !p.is_available).length,
        },
        data: (products || []).map(p => ({
          name: p.name,
          category: p.product_categories?.name || 'N/A',
          price: p.price,
          status: p.is_available ? 'Available' : 'Hidden',
        }))
      }
    }

    return null
  }

  const tabs = [
    { key: 'sales', label: '💰 Sales' },
    { key: 'products', label: '📦 Products' },
    { key: 'payments', label: '💳 Payments' }
  ]

  return (
    <AdminLayout>
      <div className="animate-slide-up">
        <h1 className="page-title mb-6">Reports & Analytics</h1>

        {/* Date Range */}
        <div className="section-card p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[var(--text-muted)]">From:</label>
            <input type="date" value={dateRange.start_date} onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })} className="input-field text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[var(--text-muted)]">To:</label>
            <input type="date" value={dateRange.end_date} onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })} className="input-field text-sm" />
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar mb-6 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { if (tab.key !== activeTab) { setActiveTab(tab.key); setTabKey(k => k + 1) } }}
              className={`tab-pill ${activeTab === tab.key ? 'active-amber' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Report Content */}
        <div key={tabKey} className="tab-content-enter">
        {loading ? (
          <Loading />
        ) : !reportData ? (
          <div className="section-card p-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-[var(--text-muted)]">No report data available for the selected period.</p>
          </div>
        ) : (
          <div>
            {/* Summary Stats */}
            {reportData.summary && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {Object.entries(reportData.summary).map(([key, value]) => (
                  <div key={key} className="section-card p-6">
                    <p className="text-sm text-[var(--text-muted)] mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{typeof value === 'number' && key.includes('amount') ? `₹${value.toFixed(2)}` : value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Data Table */}
            {reportData.data && Array.isArray(reportData.data) && reportData.data.length > 0 && (
              <div className="section-card p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)]">
                        {Object.keys(reportData.data[0]).map(key => (
                          <th key={key} className="text-left py-3 px-4 text-sm capitalize">{key.replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data.map((row, i) => (
                        <tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="py-3 px-4 text-sm">{typeof val === 'number' ? val.toLocaleString() : String(val || 'N/A')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Fallback: show raw data */}
            {reportData.data && !Array.isArray(reportData.data) && (
              <div className="section-card p-6">
                <pre className="text-sm text-[var(--text-secondary)] overflow-auto">{JSON.stringify(reportData.data, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
        </div>{/* end tab-content-enter */}

      </div>
    </AdminLayout>
  )
}

export default Reports
