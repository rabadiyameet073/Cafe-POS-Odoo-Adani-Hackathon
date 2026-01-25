const DEMO_FLOORS = [
    { id: 'f1', name: 'Ground Floor' },
    { id: 'f2', name: 'First Floor' },
    { id: 'f3', name: 'Terrace' }
]

const DEMO_TABLES = [
    { id: 't1', table_number: '1', seats: 4, floor_id: 'f1', floor_name: 'Ground Floor', status: 'available' },
    { id: 't2', table_number: '2', seats: 2, floor_id: 'f1', floor_name: 'Ground Floor', status: 'occupied' },
    { id: 't3', table_number: '3', seats: 6, floor_id: 'f1', floor_name: 'Ground Floor', status: 'available' },
    { id: 't4', table_number: '4', seats: 4, floor_id: 'f2', floor_name: 'First Floor', status: 'reserved' },
    { id: 't5', table_number: '5', seats: 8, floor_id: 'f3', floor_name: 'Terrace', status: 'available' }
]

const STATUS_STYLES = { available: 'bg-emerald-50 border-emerald-200 text-emerald-700', occupied: 'bg-red-50 border-red-200 text-red-700', reserved: 'bg-amber-50 border-amber-200 text-amber-700' }

let floors = [], tables = [], selectedFloor = 'all', editingTable = null

document.addEventListener('DOMContentLoaded', function () {
    loadData()
    document.getElementById('floorFilter').addEventListener('change', e => { selectedFloor = e.target.value; renderTables() })
    document.getElementById('saveTableBtn').addEventListener('click', handleSave)
})

async function loadData() {
    try { floors = await api.get('/floors') } catch { floors = DEMO_FLOORS }
    try { tables = await api.get('/tables') } catch { tables = DEMO_TABLES }
    renderFloorFilter()
    renderTables()
}

function renderFloorFilter() {
    const filterEl = document.getElementById('floorFilter')
    const modalEl = document.getElementById('tableFloor')
    filterEl.innerHTML = '<option value="all">All Floors</option>' + floors.map(f => `<option value="${f.id}">${f.name}</option>`).join('')
    modalEl.innerHTML = '<option value="">Select floor</option>' + floors.map(f => `<option value="${f.id}">${f.name}</option>`).join('')
}

function renderTables() {
    const filtered = selectedFloor === 'all' ? tables : tables.filter(t => t.floor_id === selectedFloor)
    document.getElementById('tablesGrid').innerHTML = filtered.map(table => `
        <div class="aspect-square p-4 rounded-2xl border-2 ${STATUS_STYLES[table.status]} flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-all" onclick="openEditModal('${table.id}')">
            <p class="text-2xl font-bold">${table.table_number}</p>
            <div class="flex items-center gap-1 mt-2 text-sm"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292"></path></svg><span>${table.seats}</span></div>
            <p class="text-xs mt-1 opacity-75">${table.floor_name}</p>
        </div>
    `).join('')
}

function openAddModal() {
    editingTable = null
    document.getElementById('modalTitle').textContent = 'Add Table'
    document.getElementById('saveTableBtn').textContent = 'Create Table'
    document.getElementById('tableNumber').value = ''
    document.getElementById('tableSeats').value = '4'
    document.getElementById('tableFloor').value = ''
    document.getElementById('tableModal').classList.remove('hidden')
}

function openEditModal(tableId) {
    const table = tables.find(t => t.id === tableId)
    if (!table) return
    editingTable = table
    document.getElementById('modalTitle').textContent = 'Edit Table'
    document.getElementById('saveTableBtn').textContent = 'Update Table'
    document.getElementById('tableNumber').value = table.table_number
    document.getElementById('tableSeats').value = table.seats
    document.getElementById('tableFloor').value = table.floor_id
    document.getElementById('tableModal').classList.remove('hidden')
}

function closeModal() { document.getElementById('tableModal').classList.add('hidden'); editingTable = null }

async function handleSave() {
    const table_number = document.getElementById('tableNumber').value.trim()
    const seats = parseInt(document.getElementById('tableSeats').value)
    const floor_id = document.getElementById('tableFloor').value
    if (!table_number || !seats || !floor_id) { Toast.warning('Please fill all fields'); return }
    const floor = floors.find(f => f.id === floor_id)
    const data = { table_number, seats, floor_id }

    try {
        if (editingTable) { await api.put(`/tables/${editingTable.id}`, data); Toast.success('Table updated') }
        else { await api.post('/tables', data); Toast.success('Table created') }
        closeModal(); loadData()
    } catch {
        if (editingTable) Object.assign(editingTable, { ...data, floor_name: floor?.name })
        else tables.push({ id: 't' + Date.now(), ...data, floor_name: floor?.name, status: 'available' })
        Toast.success(editingTable ? 'Table updated' : 'Table created')
        closeModal(); renderTables()
    }
}
