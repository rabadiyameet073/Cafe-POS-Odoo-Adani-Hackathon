let floors = []
let selectedFloor = null
let tables = []

document.addEventListener('DOMContentLoaded', function () {
    loadData()
})

async function loadData() {
    try {
        const response = await api.get('/floors')
        floors = response.data.floors || []
    } catch (error) {
        console.error(error)
        floors = []
        Toast.error('Failed to load floors')
    }

    renderFloorSelector()
    if (floors.length > 0) {
        selectFloor(floors[0])
    }
}

function renderFloorSelector() {
    document.getElementById('floorSelector').innerHTML = floors.map(floor => `
        <button onclick="selectFloor(${JSON.stringify(floor).replace(/"/g, '&quot;')})" 
                class="floor-btn px-4 py-2 rounded-xl transition-all ${selectedFloor?.id === floor.id ? 'bg-slate-900 text-white' : 'bg-white/60 text-slate-600 hover:bg-white/80'}">
            ${floor.name}
        </button>
    `).join('')
}

async function selectFloor(floor) {
    selectedFloor = floor
    renderFloorSelector()

    try {
        const response = await api.get(`/tables/floor/${floor.id}`)
        tables = response.data.tables || []
    } catch (error) {
        console.error(error)
        tables = []
        Toast.error('Failed to load tables')
    }

    renderStats()
    renderTables()
}

function renderStats() {
    const available = tables.filter(t => t.status === 'available').length
    const occupied = tables.filter(t => t.status === 'occupied').length
    const reserved = tables.filter(t => t.status === 'reserved').length

    document.getElementById('statsGrid').innerHTML = `
        <div class="glass-card-static p-4">
            <p class="text-sm text-slate-500">Total</p>
            <p class="text-2xl font-bold text-slate-800">${tables.length}</p>
        </div>
        <div class="glass-card-static p-4">
            <p class="text-sm text-emerald-600">Available</p>
            <p class="text-2xl font-bold text-emerald-600">${available}</p>
        </div>
        <div class="glass-card-static p-4">
            <p class="text-sm text-red-600">Occupied</p>
            <p class="text-2xl font-bold text-red-600">${occupied}</p>
        </div>
        <div class="glass-card-static p-4">
            <p class="text-sm text-amber-600">Reserved</p>
            <p class="text-2xl font-bold text-amber-600">${reserved}</p>
        </div>
    `
}

function renderTables() {
    const tablesGrid = document.getElementById('tablesGrid')
    const emptyState = document.getElementById('emptyState')

    if (tables.length === 0) {
        tablesGrid.innerHTML = ''
        emptyState.classList.remove('hidden')
        return
    }

    emptyState.classList.add('hidden')
    tablesGrid.innerHTML = tables.map(table => `
        <button onclick="handleTableClick('${table.id}', '${table.table_number}', '${table.status}')"
                class="aspect-square p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center hover:scale-105 hover:shadow-lg cursor-pointer ${TABLE_STATUS_COLORS[table.status] || 'border-slate-200 bg-white text-slate-700'}">
            <p class="text-2xl font-bold">${table.table_number}</p>
            <div class="flex items-center gap-1 mt-2 text-sm">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"></path></svg>
                <span>${table.seats}</span>
            </div>
            ${table.status === 'occupied' ? `
                <div class="mt-2 flex items-center gap-1 text-xs">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <span>View</span>
                </div>
            ` : ''}
        </button>
    `).join('')
}

function handleTableClick(tableId, tableNumber, status) {
    if (status === 'occupied') {
        window.location.href = `cashier-orders.html?tableId=${tableId}`
    } else if (status === 'available') {
        window.location.href = `cashier-orders.html?tableId=${tableId}&tableNumber=${tableNumber}`
    } else {
        Toast.info('This table is reserved')
    }
}
