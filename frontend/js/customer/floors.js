let floors = []
let selectedFloor = null

document.addEventListener('DOMContentLoaded', async function () {
    await loadFloors()
})

async function loadFloors() {
    const loadingEl = document.getElementById('loadingState')
    const floorsContent = document.getElementById('floorsContent')
    const floorsGrid = document.getElementById('floorsGrid')

    try {
        const response = await api.get('/floors')
        floors = response.data.floors || []

        if (!floors || floors.length === 0) {
            floorsGrid.innerHTML = '<div class="col-span-full text-center py-8 text-slate-500">No floors found</div>'
        } else {
            floorsGrid.innerHTML = floors.map(floor => `
                <div class="glass-card p-6 cursor-pointer group" onclick="selectFloor('${floor.id}')">
                    <div class="flex items-start justify-between">
                        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFDEE9] to-[#B5FFFC] flex items-center justify-center">
                            <svg class="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                        </div>
                        <svg class="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                    <h3 class="text-xl font-semibold text-slate-800 mt-4">${floor.name}</h3>
                    <p class="text-slate-500 text-sm mt-1">${floor.description || 'Click to view tables'}</p>
                </div>
            `).join('')
        }

        loadingEl.classList.add('hidden')
        floorsContent.classList.remove('hidden')
    } catch (error) {
        console.error(error)
        Toast.error('Failed to load floors')
        loadingEl.classList.add('hidden')
    }
}

async function selectFloor(floorId) {
    const floor = floors.find(f => f.id === floorId)
    if (!floor) return

    selectedFloor = floor
    const floorsContent = document.getElementById('floorsContent')
    const tablesContent = document.getElementById('tablesContent')
    const floorNameEl = document.getElementById('floorName')
    const tablesGrid = document.getElementById('tablesGrid')
    const noTablesEl = document.getElementById('noTables')

    floorNameEl.textContent = floor.name
    floorsContent.classList.add('hidden')
    tablesContent.classList.remove('hidden')

    tablesGrid.innerHTML = '<div class="col-span-full flex justify-center py-8"><div class="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div></div>'

    let tables = []
    try {
        const response = await api.get(`/tables/floor/${floorId}`)
        tables = response.data.tables || []
    } catch (error) {
        console.error(error)
        Toast.error('Failed to load tables')
        tables = []
    }

    if (!tables || tables.length === 0) {
        tablesGrid.innerHTML = ''
        noTablesEl.classList.remove('hidden')
        return
    }

    noTablesEl.classList.add('hidden')
    tablesGrid.innerHTML = tables.map(table => {
        const statusClasses = {
            available: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:scale-105 hover:shadow-lg cursor-pointer',
            occupied: 'bg-red-100 text-red-700 border-red-200 opacity-60 cursor-not-allowed',
            reserved: 'bg-amber-100 text-amber-700 border-amber-200 opacity-60 cursor-not-allowed'
        }

        return `
            <button 
                onclick="selectTable('${table.id}', '${table.table_number}', '${table.status}')"
                ${table.status !== 'available' ? 'disabled' : ''}
                class="p-4 rounded-2xl border-2 transition-all ${statusClasses[table.status] || statusClasses.available}"
            >
                <p class="text-2xl font-bold">${table.table_number}</p>
                <div class="flex items-center justify-center gap-1 mt-2 text-sm">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path></svg>
                    <span>${table.seats} seats</span>
                </div>
            </button>
        `
    }).join('')
}

function selectTable(tableId, tableNumber, status) {
    if (status !== 'available') {
        Toast.warning(`Table ${tableNumber} is ${status}`)
        return
    }

    localStorage.setItem('selectedTable', JSON.stringify({ id: tableId, number: tableNumber }))
    Toast.success(`Table ${tableNumber} selected`)
    window.location.href = 'customer-menu.html'
}

document.getElementById('backToFloors').addEventListener('click', function () {
    selectedFloor = null
    document.getElementById('floorsContent').classList.remove('hidden')
    document.getElementById('tablesContent').classList.add('hidden')
})
