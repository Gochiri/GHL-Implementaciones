<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import { getStatusLabel, getStatusColor } from '../utils/status-utils.js'

const projects = ref([])
const selectedProjectId = ref(null)
const selectedTask = ref(null)
const showSidePanel = ref(false)
const draggedTask = ref(null)
const searchQuery = ref('')

const columns = ref([
  { id: 'todo', title: 'Por Hacer', color: 'info' },
  { id: 'inprogress', title: 'En Progreso', color: 'warning' },
  { id: 'review', title: 'Revisión', color: 'primary' },
  { id: 'done', title: 'Completado', color: 'success' }
])

onMounted(() => {
  const savedProjects = localStorage.getItem('projects')
  if (savedProjects) {
    projects.value = JSON.parse(savedProjects)
    const lastId = localStorage.getItem('last-project-id')
    if (lastId && projects.value.some(p => p.id === lastId)) {
      selectedProjectId.value = lastId
    } else if (projects.value.length > 0) {
      selectedProjectId.value = projects.value[0].id
    }
  }
})

watch(selectedProjectId, (newId) => {
  if (newId) localStorage.setItem('last-project-id', newId)
})

const currentProject = computed(() => {
  return projects.value.find(p => p.id === selectedProjectId.value)
})

const allProjectTasks = computed(() => {
  if (!currentProject.value) return []
  if (currentProject.value.tasks) return currentProject.value.tasks
  if (currentProject.value.weeks) {
    return currentProject.value.weeks.flatMap(w => w.tasks.map(t => ({
      ...t,
      status: t.status || 'todo',
      description: t.description || 'Sin descripción técnica aún.'
    })))
  }
  return []
})

const filteredTasks = computed(() => {
  if (!allProjectTasks.value) return []
  if (!searchQuery.value) return allProjectTasks.value
  
  const query = searchQuery.value.toLowerCase()
  return allProjectTasks.value.filter(t => 
    t.name.toLowerCase().includes(query) || 
    (t.metadata?.field_type?.toLowerCase().includes(query))
  )
})

const getTasksByStatus = (status) => {
  return filteredTasks.value.filter(t => t.status === status)
}


// Drag and Drop Logic
const onDragStart = (task) => {
  draggedTask.value = task
}

const onDragOver = (event) => {
  event.preventDefault()
}

const onDrop = (status) => {
  if (draggedTask.value) {
    moveTask(draggedTask.value, status)
    draggedTask.value = null
  }
}

const priorities = [
  { id: 1, label: 'Crítico/Bloqueante', color: 'danger' },
  { id: 2, label: 'Media', color: 'warning' },
  { id: 3, label: 'Estándar', color: 'info' }
]

const findAndUpdateTask = (taskId, updates) => {
  if (!currentProject.value) return
  
  // Try finding in project.tasks (legacy)
  if (currentProject.value.tasks) {
    const task = currentProject.value.tasks.find(t => t.id === taskId)
    if (task) {
      Object.assign(task, updates)
      saveProjects()
      return task
    }
  }
  
  // Try finding in project.weeks
  if (currentProject.value.weeks) {
    for (const week of currentProject.value.weeks) {
      const task = week.tasks.find(t => t.id === taskId)
      if (task) {
        Object.assign(task, updates)
        saveProjects()
        return task
      }
    }
  }
  return null
}

const selectTask = (task) => {
  selectedTask.value = task
  showSidePanel.value = true
}

const updatePriority = (task, priority) => {
  const updated = findAndUpdateTask(task.id, { 
    metadata: { ...(task.metadata || {}), priority_ghl: priority } 
  })
  if (updated) selectedTask.value = updated
}

const syncClickUpStatus = async (task) => {
  if (!task.clickupId) return
  
  try {
    const settings = JSON.parse(localStorage.getItem('ghl-settings') || '{}')
    await axios.put(`http://localhost:3001/api/clickup/task/${task.clickupId}/status`, {
      status: task.status,
      apiToken: settings.clickup?.apiToken
    })
    console.log(`✅ Synced task ${task.id} to ClickUp status: ${task.status}`)
  } catch (error) {
    console.error(`❌ Failed to sync task ${task.id} to ClickUp:`, error)
  }
}

const updateTaskContent = (taskId, fields) => {
  findAndUpdateTask(taskId, fields)
}

const moveTask = (task, newStatus) => {
  const updated = findAndUpdateTask(task.id, { status: newStatus })
  if (updated) {
    syncClickUpStatus(updated)
    if (selectedTask.value?.id === task.id) selectedTask.value = updated
  }
}

const saveProjects = () => {
  localStorage.setItem('projects', JSON.stringify(projects.value))
}

const getStatusLabelClass = (color) => {
  return `status-dot bg-${color}`
}
</script>

<template>
  <div class="kanban-container fadeIn">
    <!-- Left Sidebar: Technical Context -->
    <aside class="technical-sidebar">
      <div class="sidebar-section">
        <h3>📘 Contexto Técnico</h3>
        <div v-if="currentProject?.analysis" class="blueprint-extract">
          <div class="extract-item">
            <span class="label">Nicho:</span>
            <span class="value">{{ currentProject.analysis.niche || 'GHL Focus' }}</span>
          </div>
          <div class="extract-item">
            <span class="label">Complejidad:</span>
            <span class="value">{{ currentProject.analysis.complexity }}/10</span>
          </div>
          <div class="extract-item">
            <span class="label">Estado del Proyecto:</span>
            <span class="status-badge-mini" :class="getStatusColor(currentProject.status)">
              {{ getStatusLabel(currentProject.status) }}
            </span>
          </div>
          <div class="pipelines-list">
            <h4>Pipelines:</h4>
            <div v-for="p in currentProject.analysis.pipelines" :key="p" class="p-tag">{{ p }}</div>
          </div>
        </div>
        <div v-else class="empty-context">Sin análisis técnico previo.</div>
      </div>
    </aside>

    <div class="kanban-main">
      <header class="kanban-header">
        <div class="project-selector">
          <label>Campaña Actual:</label>
          <select v-model="selectedProjectId" class="premium-select">
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="kanban-tools">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Buscar tarea o tipo..." 
              class="premium-input search-input"
            />
          </div>
          <button class="btn btn-secondary sync-btn">🔄 Sincronizar ClickUp</button>
        </div>
      </header>

      <div class="kanban-board">
        <div 
          v-for="col in columns" 
          :key="col.id" 
          class="kanban-column"
          @dragover="onDragOver"
          @drop="onDrop(col.id)"
        >
          <div class="column-header">
            <div :class="getStatusLabelClass(col.color)"></div>
            <h3>{{ col.title }}</h3>
            <span class="task-count">{{ getTasksByStatus(col.id).length }}</span>
          </div>

          <div class="task-list">
            <div 
              v-for="task in getTasksByStatus(col.id)" 
              :key="task.id" 
              class="task-card"
              draggable="true"
              @dragstart="onDragStart(task)"
              @click="selectTask(task)"
            >
              <div class="task-card-header">
                <span class="task-id">#{{ task.id }}</span>
                <div class="task-priority" :class="'p-' + (task.metadata?.priority_ghl || 3)"></div>
              </div>
              <p class="task-name">{{ task.name }}</p>
              <div v-if="task.metadata?.field_type" class="tech-badge" :data-type="task.metadata.field_type.toLowerCase()">
                {{ task.metadata.field_type }}
              </div>
              <div class="task-footer">
                <span class="task-time">⏱️ {{ task.hours }}h</span>
                <span v-if="task.clickupUrl" class="clickup-link">🔗 ClickUp</span>
              </div>
            </div>

            <div v-if="getTasksByStatus(col.id).length === 0" class="empty-column">
              Suelte aquí
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Side Panel: Task Details -->
    <div class="task-side-panel" :class="{ open: showSidePanel }">
      <div v-if="selectedTask" class="panel-content">
        <header class="panel-header">
          <button class="close-btn" @click="showSidePanel = false">×</button>
          <div class="panel-title-area">
            <span class="task-id">Tarea #{{ selectedTask.id }}</span>
            <input 
              v-model="selectedTask.name" 
              class="editable-title" 
              @input="updateTaskContent(selectedTask.id, { name: selectedTask.name })"
            />
          </div>
        </header>
        
        <div class="panel-body">
          <!-- Main Action: Technical Documentation -->
          <div class="panel-section highlight">
            <label>Instrucciones de Implementación (GHL SOP)</label>
            <div class="sop-content-scroller">
              <textarea 
                v-model="selectedTask.description" 
                class="editable-sop"
                @input="updateTaskContent(selectedTask.id, { description: selectedTask.description })"
                placeholder="Escribe el SOP técnico aquí..."
              ></textarea>
            </div>
          </div>

          <!-- Operational Controls -->
          <div class="panel-section">
            <label>Prioridad Técnica</label>
            <div class="priority-selector">
              <div v-for="p in priorities" :key="p.id" 
                   class="priority-opt" 
                   :class="[p.color, { active: selectedTask.metadata?.priority_ghl === p.id }]"
                   @click="updatePriority(selectedTask, p.id)"
              >
                {{ p.label }}
              </div>
            </div>
          </div>

          <div class="panel-section">
            <label>Sincronización de Flujo</label>
            <div class="flow-actions">
              <button class="action-btn next" @click="moveTask(selectedTask, columns[Math.min(columns.findIndex(c => c.id === selectedTask.status) + 1, columns.length - 1)].id)">
                Avanzar Etapa ➔
              </button>
              <button v-if="selectedTask.clickupUrl" class="action-btn secondary" @click="window.open(selectedTask.clickupUrl, '_blank')">
                Ver en ClickUp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kanban-container {
  display: flex;
  gap: 20px;
  height: calc(100vh - 140px);
  overflow: hidden;
}

/* Technical Context Sidebar */
.technical-sidebar {
  width: 240px;
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.technical-sidebar h3 {
  font-size: 14px;
  color: var(--primary-light);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.blueprint-extract {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.extract-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.extract-item .label {
  font-size: 11px;
  color: var(--text-muted);
}

.extract-item .value {
  font-size: 13px;
  font-weight: 600;
}

.pipelines-list {
  margin-top: 12px;
}

.p-tag {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  margin-bottom: 6px;
}

.status-badge-mini {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.status-badge-mini.info { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
.status-badge-mini.primary { background: rgba(139, 92, 246, 0.1); color: #a78bfa; }
.status-badge-mini.warning { background: rgba(245, 158, 11, 0.1); color: #fbbf24; }
.status-badge-mini.success { background: rgba(16, 185, 129, 0.1); color: #34d399; }

/* Kanban Main */
.kanban-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-x: auto;
}

.kanban-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8px;
}

.project-selector {
  display: flex;
  align-items: center;
  gap: 16px;
}

.project-selector label {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--text-muted);
  font-size: 14px;
}

.premium-select {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 10px 20px;
  color: #fff;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.kanban-tools {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 14px;
  color: var(--text-muted);
}

.search-input {
  padding-left: 36px !important;
  width: 250px;
  background: rgba(255, 255, 255, 0.03) !important;
}

.sync-btn {
  font-size: 13px;
  padding: 8px 16px;
}

/* Kanban Board */
.kanban-board {
  display: flex;
  gap: 24px;
  flex: 1;
  padding-bottom: 20px;
}

.kanban-column {
  flex: 1;
  min-width: 300px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--glass-border);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.bg-info { background: var(--info); box-shadow: 0 0 10px var(--info); }
.bg-warning { background: var(--warning); box-shadow: 0 0 10px var(--warning); }
.bg-primary { background: var(--primary); box-shadow: 0 0 10px var(--primary); }
.bg-success { background: var(--success); box-shadow: 0 0 10px var(--success); }

.column-header h3 {
  font-size: 14px;
  font-weight: 700;
  flex: 1;
}

.task-count {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 8px;
  border-radius: 10px;
  color: var(--text-muted);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 100px;
}

.task-card {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s;
  cursor: grab;
}

.task-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-id {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
}

.task-priority {
  width: 24px;
  height: 4px;
  border-radius: 2px;
}

.task-priority.p-1 { background: var(--danger); box-shadow: 0 0 8px var(--danger); }
.task-priority.p-2 { background: var(--warning); box-shadow: 0 0 8px var(--warning); }
.task-priority.p-3 { background: var(--info); box-shadow: 0 0 8px var(--info); }

.task-name {
  font-size: 14px;
  line-height: 1.4;
  font-weight: 500;
  color: #fff;
}

.tech-badge {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
}

.tech-badge[data-type*="workflow"] { background: rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.3); color: #c4b5fd; }
.tech-badge[data-type*="pipeline"] { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: #6ee7b7; }
.tech-badge[data-type*="integration"] { background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3); color: #fcd34d; }
.tech-badge[data-type*="field"] { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3); color: #93c5fd; }


.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.task-time {
  font-size: 11px;
  color: var(--text-secondary);
}

.clickup-link {
  font-size: 10px;
  color: var(--accent-light);
  font-weight: 600;
}

.empty-column {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  border: 2px dashed rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  font-size: 11px;
  color: var(--text-disabled);
}

/* Task Side Panel */
.task-side-panel {
  position: fixed;
  top: 0;
  right: -420px;
  width: 420px;
  height: 100vh;
  background: var(--bg-elevated);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-left: 1px solid var(--glass-border);
  z-index: 1000;
  transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: -20px 0 50px rgba(0,0,0,0.5);
}

.task-side-panel.open {
  right: 0;
}

.panel-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 30px;
  border-bottom: 1px solid var(--glass-border);
  position: relative;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 32px;
  cursor: pointer;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #fff;
}

.panel-title-area h2 {
  font-size: 24px;
  margin-top: 12px;
}

.panel-body {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.panel-section label {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 16px;
}

.panel-section.highlight {
  background: rgba(139, 92, 246, 0.05);
  margin: -30px -30px 0 -30px;
  padding: 30px;
  border-bottom: 1px solid var(--glass-border);
}

.sop-content-scroller {
  max-height: 300px;
  overflow-y: auto;
  background: var(--bg-dark);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--glass-border);
}

.editable-title {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #fff;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  width: 100%;
  margin-top: 12px;
  transition: all 0.2s;
}

.editable-title:focus {
  outline: none;
  border-bottom-color: var(--primary);
  background: rgba(255, 255, 255, 0.03);
}

.editable-sop {
  width: 100%;
  min-height: 200px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
}

.editable-sop:focus {
  outline: none;
}

.sop-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.priority-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.priority-opt {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
}

.priority-opt::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.priority-opt.danger::before { background: var(--danger); }
.priority-opt.warning::before { background: var(--warning); }
.priority-opt.info::before { background: var(--info); }

.priority-opt:hover {
  background: rgba(255, 255, 255, 0.07);
  transform: translateX(4px);
}

.priority-opt.active {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--primary);
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
}

.flow-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-btn {
  background: var(--primary);
  border: none;
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  transition: all 0.2s;
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
}

.action-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
}

.fadeIn {
  animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

</style>
