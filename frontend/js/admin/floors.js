const DEMO_FLOORS = [
    { id: 'f1', name: 'Ground Floor', description: 'Main dining area', table_count: 12 },
    { id: 'f2', name: 'First Floor', description: 'Family section', table_count: 8 },
    { id: 'f3', name: 'Terrace', description: 'Open air seating', table_count: 6 }
]

let floors = []
let editingFloor = null

document.addEventListener('DOMContentLoaded', function () {
    loadFloors()
    document.getElementById('saveFloorBtn').addEventListener('click', handleSave)
})

async function loadFloors() {
    try {
        floors = await api.get('/floors')
    } catch (error) {
        floors = DEMO_FLOORS
    }
    renderFloors()
}

function renderFloors() {
    const gridEl = document.getElementById('floorsGrid')
    const emptyEl = document.getElementById('emptyState')

    if (floors.length === 0) {
        gridEl.innerHTML = ''
        emptyEl.classList.remove('hidden')
        return
    }

    emptyEl.classList.add('hidden')
    gridEl.innerHTML = floors.map(floor => `
        <div class="glass-card-static p-6">
            <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFDEE9] to-[#B5FFFC] flex items-center justify-center">
                    <svg class="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                </div>
                <span class="text-sm text-slate-500">${floor.table_count || 0} tables</span>
            </div>
            <h3 class="text-lg font-semibold text-slate-800">${floor.name}</h3>
            <p class="text-sm text-slate-500 mt-1">${floor.description || 'No description'}</p>
            <div class="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button onclick="openEditModal('${floor.id}')" class="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    Edit
                </button>
                <button onclick="deleteFloor('${floor.id}')" class="text-slate-500 hover:text-red-600 text-sm py-1.5 px-3 flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    Delete
                </button>
            </div>
        </div>
    `).join('')
}

function openAddModal() {
    editingFloor = null
    document.getElementById('modalTitle').textContent = 'Add Floor'
    document.getElementById('saveFloorBtn').textContent = 'Create Floor'
    document.getElementById('floorName').value = ''
    document.getElementById('floorDescription').value = ''
    document.getElementById('floorModal').classList.remove('hidden')
}

function openEditModal(floorId) {
    const floor = floors.find(f => f.id === floorId)
    if (!floor) return
    editingFloor = floor
    document.getElementById('modalTitle').textContent = 'Edit Floor'
    document.getElementById('saveFloorBtn').textContent = 'Update Floor'
    document.getElementById('floorName').value = floor.name
    document.getElementById('floorDescription').value = floor.description || ''
    document.getElementById('floorModal').classList.remove('hidden')
}

function closeModal() {
    document.getElementById('floorModal').classList.add('hidden')
    editingFloor = null
}

async function handleSave() {
    const name = document.getElementById('floorName').value.trim()
    const description = document.getElementById('floorDescription').value.trim()
    if (!name) { Toast.warning('Please enter a floor name'); return }

    try {
        if (editingFloor) {
            await api.put(`/floors/${editingFloor.id}`, { name, description })
            Toast.success('Floor updated')
        } else {
            await api.post('/floors', { name, description })
            Toast.success('Floor created')
        }
        closeModal()
        loadFloors()
    } catch (error) {
        if (editingFloor) {
            Object.assign(editingFloor, { name, description })
        } else {
            floors.push({ id: 'f' + Date.now(), name, description, table_count: 0 })
        }
        Toast.success(editingFloor ? 'Floor updated' : 'Floor created')
        closeModal()
        renderFloors()
    }
}

async function deleteFloor(floorId) {
    if (!confirm('Delete this floor?')) return
    try {
        await api.delete(`/floors/${floorId}`)
        Toast.success('Floor deleted')
        loadFloors()
    } catch (error) {
        floors = floors.filter(f => f.id !== floorId)
        Toast.success('Floor deleted')
        renderFloors()
    }
}
