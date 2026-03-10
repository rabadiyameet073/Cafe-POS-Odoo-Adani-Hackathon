import { useState, useEffect } from 'react'
import { api } from '../../utils/api'
import { subscribeToTable, unsubscribeFromChannel } from '../../services/supabase.service'
import Loading from '../Loading'
import Toast from '../Toast'

const TableManagementPanel = () => {
  const [tables, setTables] = useState([])
  const [floors, setFloors] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTable, setNewTable] = useState({
    floor_id: '',
    table_number: '',
    seats: 2
  })

  useEffect(() => {
    fetchFloors()
    fetchTables()

    // Subscribe to tables changes
    const tablesChannel = subscribeToTable('tables', null, (payload) => {
      console.log('Table change detected:', payload)
      
      if (payload.eventType === 'INSERT') {
        setTables(prev => [...prev, payload.new])
      } else if (payload.eventType === 'UPDATE') {
        setTables(prev => prev.map(t => 
          t.id === payload.new.id ? payload.new : t
        ))
      } else if (payload.eventType === 'DELETE') {
        setTables(prev => prev.filter(t => t.id !== payload.old.id))
      }
    })

    // Subscribe to table_sessions changes
    const sessionsChannel = subscribeToTable('table_sessions', null, (payload) => {
      console.log('Table session change detected:', payload)
      // Refresh tables to get updated session info
      fetchTables()
    })

    return () => {
      unsubscribeFromChannel(tablesChannel)
      unsubscribeFromChannel(sessionsChannel)
    }
  }, [])

  const fetchFloors = async () => {
    try {
      const response = await api.get('/floors')
      setFloors(response.data.floors || response.floors || [])
    } catch (error) {
      showToast('Failed to load floors', 'error')
    }
  }

  const fetchTables = async () => {
    try {
      const response = await api.get('/tables')
      setTables(response.data.tables || response.tables || [])
    } catch (error) {
      showToast('Failed to load tables', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAddTable = async (e) => {
    e.preventDefault()
    
    if (!newTable.floor_id || !newTable.table_number) {
      showToast('Please fill all required fields', 'error')
      return
    }

    try {
      await api.post('/tables/create', newTable)
      showToast('Table added successfully', 'success')
      setShowAddModal(false)
      setNewTable({ floor_id: '', table_number: '', seats: 2 })
      fetchTables()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to add table', 'error')
    }
  }

  const handleDeleteTable = async (tableId, tableName) => {
    if (!confirm(`Are you sure you want to delete ${tableName}? This action cannot be undone.`)) {
      return
    }

    try {
      await api.delete(`/tables/${tableId}`)
      showToast('Table deleted successfully', 'success')
      fetchTables()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete table', 'error')
    }
  }

  const handleFreeTable = async (tableId, tableName) => {
    if (!confirm(`Are you sure you want to manually free ${tableName}?`)) {
      return
    }

    try {
      await api.post('/tables/release', {
        table_id: tableId,
        reason: 'Manual admin release'
      })
      showToast('Table freed successfully', 'success')
      fetchTables()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to free table', 'error')
    }
  }

  const handleChangeFloor = async (tableId, currentFloorId) => {
    const newFloorId = prompt('Enter new floor ID:')
    if (!newFloorId || newFloorId === currentFloorId) return

    try {
      await api.put(`/tables/${tableId}/floor`, { floor_id: newFloorId })
      showToast('Floor assignment updated', 'success')
      fetchTables()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to change floor', 'error')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-[rgba(0,255,148,0.1)] border-[var(--accent-emerald)] text-[var(--accent-emerald)]'
      case 'occupied':
        return 'bg-[var(--accent-rose)]/10 border-[var(--accent-rose)] text-[var(--accent-rose)]'
      case 'reserved':
        return 'bg-[rgba(59,130,246,0.1)] border-[var(--accent-blue)] text-[var(--accent-blue)]'
      case 'cleaning':
        return 'bg-[var(--bg-surface-hover)] border-[var(--border-subtle)] text-[var(--text-primary)]'
      default:
        return 'bg-[var(--bg-surface-hover)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
    }
  }

  const getTimerRemaining = (occupiedUntil) => {
    if (!occupiedUntil) return null
    
    const now = new Date()
    const endsAt = new Date(occupiedUntil)
    const diffSeconds = Math.max(0, Math.floor((endsAt - now) / 1000))
    
    const minutes = Math.floor(diffSeconds / 60)
    const seconds = diffSeconds % 60
    
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const groupTablesByFloor = () => {
    const grouped = {}
    
    floors.forEach(floor => {
      grouped[floor.id] = {
        floor: floor,
        tables: tables.filter(t => t.floor_id === floor.id)
      }
    })
    
    return grouped
  }

  if (loading) return <Loading />

  const groupedTables = groupTablesByFloor()

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Table Management</h2>
          <p className="text-[var(--text-muted)]">
            {tables.length} total tables across {floors.length} floors
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 btn-primary rounded-lg hover:shadow-lg transition-all font-semibold"
        >
          + Add Table
        </button>
      </div>

      {/* Tables by Floor */}
      <div className="space-y-6">
        {Object.values(groupedTables).map(({ floor, tables: floorTables }) => (
          <div key={floor.id} className="section-card p-6">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              {floor.name} ({floorTables.length} tables)
            </h3>
            
            {floorTables.length === 0 ? (
              <p className="text-[var(--text-muted)] text-center py-4">No tables on this floor</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {floorTables.map((table) => (
                  <div
                    key={table.id}
                    className={`p-4 border-2 rounded-lg ${getStatusColor(table.status)}`}
                  >
                    {/* Table Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-xl font-bold">Table {table.table_number}</h4>
                        <p className="text-sm">{table.seats} seats</p>
                      </div>
                      <span className="px-2 py-1 bg-[var(--bg-surface)] bg-opacity-50 rounded text-xs font-bold uppercase">
                        {table.status}
                      </span>
                    </div>

                    {/* Timer Display */}
                    {table.status === 'occupied' && table.occupied_until && (
                      <div className="mb-3 p-2 bg-[var(--bg-surface)] bg-opacity-30 rounded">
                        <p className="text-xs font-semibold mb-1">Timer Remaining:</p>
                        <p className="text-lg font-mono font-bold">
                          {getTimerRemaining(table.occupied_until)}
                        </p>
                      </div>
                    )}

                    {/* Order Status */}
                    {table.status === 'occupied' && table.order_status && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold">Order Status:</p>
                        <p className="text-sm capitalize">{table.order_status}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {table.status === 'occupied' && (
                        <button
                          onClick={() => handleFreeTable(table.id, `Table ${table.table_number}`)}
                          className="w-full py-2 rounded transition-all text-sm font-semibold" style={{ background: 'var(--accent-rose)', color: '#fff' }}
                        >
                          Free Table
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleChangeFloor(table.id, table.floor_id)}
                          className="py-1 bg-[var(--accent-gold)] text-[var(--on-accent-text)] rounded hover:opacity-90 transition-all text-xs font-semibold"
                          disabled={table.status === 'occupied'}
                        >
                          Change Floor
                        </button>
                        <button
                          onClick={() => handleDeleteTable(table.id, `Table ${table.table_number}`)}
                          className="py-1 rounded transition-all text-xs font-semibold" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Add New Table</h3>
            
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
                  Floor *
                </label>
                <select
                  value={newTable.floor_id}
                  onChange={(e) => setNewTable({ ...newTable, floor_id: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  required
                >
                  <option value="">Select Floor</option>
                  {floors.map(floor => (
                    <option key={floor.id} value={floor.id}>{floor.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
                  Table Number *
                </label>
                <input
                  type="text"
                  value={newTable.table_number}
                  onChange={(e) => setNewTable({ ...newTable, table_number: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  placeholder="e.g., 1, A1, T-01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
                  Seats
                </label>
                <input
                  type="number"
                  value={newTable.seats}
                  onChange={(e) => setNewTable({ ...newTable, seats: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  min="1"
                  max="20"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 btn-primary rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  Add Table
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setNewTable({ floor_id: '', table_number: '', seats: 2 })
                  }}
                  className="flex-1 py-2 bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-surface-hover)] transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default TableManagementPanel
