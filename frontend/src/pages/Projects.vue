<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { PROJECT_STATUSES, getStatusLabel, getStatusClass, healProjectStatus } from '../utils/status-utils.js'

const router = useRouter()
const projects = ref([])
const searchQuery = ref('')
const filterStatus = ref('all')

const statuses = [
  { id: 'all', label: 'Todos' },
  ...PROJECT_STATUSES
]

onMounted(async () => {
  try {
    const data = await api.getProjects()
    projects.value = data.map(p => {
      const { healedProject } = healProjectStatus(p)
      return {
        ...healedProject,
        date: new Date(healedProject.createdAt || Date.now()).toLocaleDateString()
      }
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
  }
})

const updateProjectStatus = async (id, newStatus) => {
  try {
    await api.updateProject(id, { status: newStatus })
    const index = projects.value.findIndex(p => p.id === id)
    if (index !== -1) {
      projects.value[index].status = newStatus
    }
  } catch (error) {
    console.error('Error updating status:', error)
    alert('Error al actualizar el estado')
  }
}

const filteredProjects = computed(() => {
  return projects.value.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesFilter = filterStatus.value === 'all' || p.status === filterStatus.value
    return matchesSearch && matchesFilter
  }).sort((a, b) => new Date(b.date) - new Date(a.date))
})

const getProjectStatusLabel = (statusId) => getStatusLabel(statusId)

const getProjectStatusClass = (statusId) => getStatusClass(statusId)

const deleteProject = async (id) => {
  if (confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
    try {
      await api.deleteProject(id)
      projects.value = projects.value.filter(p => p.id !== id)
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Error al eliminar el proyecto')
    }
  }
}
</script>

<template>
  <div class="projects-hub fadeIn">
    <header class="hub-header">
      <div class="header-main">
        <h1>Gestión de Proyectos</h1>
        <p>Hub centralizado para el seguimiento y ejecución de implementaciones GHL.</p>
      </div>
      <router-link to="/analyzer" class="btn btn-primary">
        <span>+</span> Nuevo Lead
      </router-link>
    </header>

    <div class="hub-filters card">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar cliente..." 
          class="premium-input"
        />
      </div>
      <div class="filter-group">
        <label>Estado:</label>
        <div class="status-filters">
          <button 
            v-for="s in statuses" 
            :key="s.id"
            class="filter-btn"
            :class="{ active: filterStatus === s.id }"
            @click="filterStatus = s.id"
          >
            {{ s.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="projects-grid">
      <div v-for="p in filteredProjects" :key="p.id" class="project-card card">
        <div class="card-header">
          <div class="client-info">
            <span class="date">{{ p.date }}</span>
            <h3>{{ p.name }}</h3>
          </div>
          <div class="status-actions">
            <select 
              :value="p.status" 
              class="status-select" 
              :class="getProjectStatusClass(p.status)"
              @change="e => updateProjectStatus(p.id, e.target.value)"
            >
              <option v-for="s in statuses.slice(1)" :key="s.id" :value="s.id">
                {{ s.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="card-body">
          <div class="metrics-grid">
            <div class="metric">
              <div class="metric-header">
                <span class="label">Complejidad</span>
                <span class="metric-value">{{ p.complexity || p.analysis?.complexity || 5 }}/10</span>
              </div>
              <div class="complexity-bar">
                <div class="inner-bar" :style="{ width: ((p.complexity || p.analysis?.complexity || 5) * 10) + '%' }"></div>
              </div>
            </div>
            <div class="metric">
              <span class="label">Nicho / Industria</span>
              <span class="value-badge">{{ p.niche || p.analysis?.niche || 'N/A' }}</span>
            </div>
          </div>
          
          <div v-if="p.analysis?.implementationType" class="implementation-type">
            <span class="label">Tipo:</span>
            <span class="value">{{ p.analysis.implementationType }}</span>
          </div>
        </div>

        <div class="card-actions">
          <button class="action-btn" @click="router.push(`/project/${p.id}`)">
            🛠️ Estructura
          </button>
          <button class="action-btn" @click="router.push(`/proposal/${p.id}`)">
            📄 Propuesta
          </button>
          <button v-if="p.documentation" class="action-btn highlight-btn" @click="router.push(`/project/${p.id}`)">
            📘 Blueprint
          </button>
          <button class="action-btn icon-btn" @click="deleteProject(p.id)">
            🗑️
          </button>
        </div>
      </div>

      <div v-if="filteredProjects.length === 0" class="empty-state card">
        <p>No se encontraron proyectos que coincidan con los filtros.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.projects-hub {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.hub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-main h1 {
  font-size: 32px;
  margin-bottom: 8px;
}

.header-main p {
  color: var(--text-muted);
}

.hub-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px !important;
}

.search-box {
  position: relative;
  width: 300px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.premium-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  color: #fff;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-filters {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 8px 16px;
  border-radius: 100px;
  border: 1px solid var(--glass-border);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.filter-btn.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
}

.project-card {
  display: flex;
  flex-direction: column;
  gap: 24px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.project-card:hover {
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.client-info .date {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.client-info h3 {
  font-size: 20px;
  margin-top: 4px;
}

.status-select {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  border: 1px solid transparent;
  cursor: pointer;
  background-image: none;
  appearance: none;
  text-align: center;
  transition: all 0.2s;
}

.status-select:focus {
  outline: none;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}

.status-analysis { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border-color: rgba(59, 130, 246, 0.2); }
.status-created { background: rgba(139, 92, 246, 0.1); color: #a78bfa; border-color: rgba(139, 92, 246, 0.2); }
.status-proposal { background: rgba(245, 158, 11, 0.1); color: #fbbf24; border-color: rgba(245, 158, 11, 0.2); }
.status-completed { background: rgba(16, 185, 129, 0.1); color: #34d399; border-color: rgba(16, 185, 129, 0.2); }

.card-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary-light);
}

.metric .label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.complexity-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  overflow: hidden;
}

.inner-bar {
  height: 100%;
  background: linear-gradient(to right, var(--primary), var(--accent));
  box-shadow: 0 0 10px var(--primary);
}

.value-badge {
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #fff;
  border: 1px solid var(--glass-border);
  display: inline-block;
  width: fit-content;
}

.implementation-type {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--glass-border);
}

.implementation-type .label {
  color: var(--text-muted);
}

.implementation-type .value {
  color: var(--primary-light);
  font-weight: 500;
}

.card-actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.action-btn {
  flex: 1;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-btn:hover {
  background: var(--primary);
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(229, 72, 77, 0.3);
}

.icon-btn {
  flex: 0 0 48px;
}

.action-btn.highlight-btn {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.4);
  color: #a78bfa;
}

.action-btn.highlight-btn:hover {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 64px !important;
  color: var(--text-muted);
}

.fadeIn {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
