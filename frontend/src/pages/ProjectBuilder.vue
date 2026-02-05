<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api.js'

const route = useRoute()
const router = useRouter()

const clientName = ref('')
const projectType = ref('automation')
const isCreating = ref(false)
const isApproving = ref(false)
const projectDocumentation = ref('')
const isEditingBlueprint = ref(false)
const allProjects = ref([])
const showSelector = ref(false)
const isLoading = ref(true)

const weeks = ref([])
const projectAnalysis = ref(null)
const totalTasks = ref(0)
const totalHours = ref(0)
const totalDuration = ref('')
const projectQuotation = ref(null)
const isGeneratingQuote = ref(false)

const getSettings = () => {
  const saved = localStorage.getItem('ghl-settings')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      return {}
    }
  }
  return {}
}

const getLocalAnalysis = (id) => {
  const saved = localStorage.getItem('last-analysis')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed.id === id) return parsed
    } catch (e) {}
  }
  return null
}

const setWeeks = (rawWeeks) => {
  weeks.value = (rawWeeks || []).map((w, wIdx) => ({
    id: w.id || wIdx + 1,
    name: w.name || w.weekNumber,
    collapsed: false,
    tasks: (w.tasks || []).map((t, tIdx) => ({
      id: t.id || (wIdx + 1) * 100 + (tIdx + 1),
      name: t.name,
      hours: typeof t.hours === 'number' ? t.hours : (t.estimate ? parseInt(t.estimate) : 1),
      completed: t.completed || false,
      description: t.description || '',
      metadata: t.metadata || {}
    }))
  }))
  updateStats()
}

const updateStats = () => {
  totalTasks.value = weeks.value.reduce((total, week) => total + week.tasks.length, 0)
  totalHours.value = weeks.value.reduce((total, week) => {
    return total + week.tasks.reduce((wTotal, task) => wTotal + task.hours, 0)
  }, 0)
  totalDuration.value = `${weeks.value.length}`
}

const loadProject = async () => {
  const projectId = route.params.id
  
  if (!projectId) {
    const lastId = localStorage.getItem('last-project-id')
    if (lastId) {
      router.replace(`/project/${lastId}`)
      return
    } else {
      try {
        const projects = await api.getProjects()
        allProjects.value = projects
        if (projects.length > 0) {
          showSelector.value = true
        }
      } catch (e) {
        console.warn('Error loading projects:', e)
      }
    }
    isLoading.value = false
    return
  }

  // Always hide selector when we have a projectId
  showSelector.value = false
  
  try {
    // First, try to load from localStorage (fastest, most reliable for new projects)
    const localAnalysis = getLocalAnalysis(projectId)
    const savedWeeks = localStorage.getItem(`project-weeks-${projectId}`)
    
    if (localAnalysis) {
      clientName.value = localAnalysis.clientName || 'Nuevo Cliente'
      projectAnalysis.value = localAnalysis
    }
    
    if (savedWeeks) {
      try {
        setWeeks(JSON.parse(savedWeeks))
      } catch (e) {
        console.warn('Error parsing saved weeks:', e)
      }
    }

    // Then try to enrich from backend API
    try {
      const project = await api.getProject(projectId)
      if (project && project.id) {
        localStorage.setItem('last-project-id', project.id)
        clientName.value = project.name || project.clientName || clientName.value || 'Sin Nombre'
        
        if (project.weeks && project.weeks.length > 0) {
          setWeeks(project.weeks)
        }
        
        if (project.projectType) projectType.value = project.projectType
        if (project.analysis) projectAnalysis.value = project.analysis
        if (project.documentation) projectDocumentation.value = project.documentation
      }
    } catch (error) {
      console.warn('API fetch failed, using localStorage data:', error)
    }
    
    // If still no weeks, generate default structure
    if (weeks.value.length === 0) {
      console.log('No weeks found, generating default structure...')
      const defaultWeeks = [
        { name: 'Fase 1 — Setup Base', tasks: [{ name: 'Configurar Subcuenta GHL', hours: 2 }, { name: 'Dominio y Email', hours: 1 }] },
        { name: 'Fase 2 — CRM & Pipelines', tasks: [{ name: 'Configurar Pipeline Ventas', hours: 3 }, { name: 'Custom Fields', hours: 2 }] },
        { name: 'Fase 3 — Automatizaciones', tasks: [{ name: 'Workflow Captura Leads', hours: 4 }] },
        { name: 'Fase 4 — Go-Live', tasks: [{ name: 'Testing Final', hours: 2 }, { name: 'Sesión Capacitación', hours: 2 }] }
      ]
      setWeeks(defaultWeeks)
      localStorage.setItem(`project-weeks-${projectId}`, JSON.stringify(defaultWeeks))
    }
    
    // Set a default client name if still empty
    if (!clientName.value) {
      clientName.value = 'Nuevo Proyecto'
    }
    
  } finally {
    isLoading.value = false
    
    // Auto-generate quotation if we have weeks (fire and forget, don't block)
    if (weeks.value.length > 0 && !projectQuotation.value) {
      generateQuotation().catch(e => console.warn('Quotation generation failed:', e))
    }
  }
}

const saveProjectState = async (newStatus = null) => {
  const projectId = route.params.id
  if (!projectId) return

  const data = {
    id: projectId,
    name: clientName.value || 'Nuevo Proyecto',
    weeks: weeks.value,
    projectType: projectType.value,
    documentation: projectDocumentation.value,
    analysis: projectAnalysis.value,
    date: new Date().toISOString()
  }
  if (newStatus) data.status = newStatus

  // Always save to localStorage for offline/fallback
  try {
    // Save project-specific data
    localStorage.setItem(`project-${projectId}`, JSON.stringify(data))
    localStorage.setItem(`project-weeks-${projectId}`, JSON.stringify(weeks.value))
    
    // Update project list in localStorage
    const projectsListKey = 'ghl-projects-list'
    let projectsList = []
    try {
      const saved = localStorage.getItem(projectsListKey)
      if (saved) projectsList = JSON.parse(saved)
    } catch (e) {}
    
    const existingIdx = projectsList.findIndex(p => p.id === projectId)
    const projectSummary = {
      id: projectId,
      name: data.name,
      status: data.status || 'building',
      date: data.date,
      weeksCount: weeks.value.length,
      tasksCount: totalTasks.value
    }
    
    if (existingIdx >= 0) {
      projectsList[existingIdx] = projectSummary
    } else {
      projectsList.unshift(projectSummary)
    }
    localStorage.setItem(projectsListKey, JSON.stringify(projectsList))
    
    console.log('✅ Proyecto guardado en localStorage:', projectId)
  } catch (e) {
    console.warn('Error saving to localStorage:', e)
  }

  // Try API as well
  try {
    await api.updateProject(projectId, data)
    console.log('✅ Proyecto sincronizado con API')
  } catch (error) {
    console.warn('API sync failed, data saved locally:', error)
  }
}

watch([clientName, weeks, projectDocumentation], () => {
  saveProjectState()
  updateStats()
}, { deep: true })

onMounted(() => {
  loadProject()
})


const tags = ref([
  { name: 'Urgente', color: '#ff7675' },
  { name: 'En Progreso', color: '#fdcb6e' },
  { name: 'Bloqueado', color: '#e17055' },
  { name: 'Completado', color: '#00b894' }
])

const customFields = ref([
  { name: 'Prioridad', type: 'dropdown', options: ['Alta', 'Media', 'Baja'] },
  { name: 'Tipo', type: 'dropdown', options: ['Setup', 'Automatización', 'Integración', 'Testing'] },
  { name: 'Horas Estimadas', type: 'number' },
  { name: 'Responsable', type: 'text' }
])

const showAddTaskModal = ref(false)
const selectedWeek = ref(null)
const newTaskName = ref('')
const newTaskHours = ref(1)

const sendingToClickUp = ref(false)
const clickupSuccess = ref(false)

const toggleWeek = (week) => {
  week.collapsed = !week.collapsed
}

const addTask = (weekId) => {
  selectedWeek.value = weeks.value.find(w => w.id === weekId)
  showAddTaskModal.value = true
}

const confirmAddTask = () => {
  if (newTaskName.value.trim() && selectedWeek.value) {
    const allTaskIds = weeks.value.flatMap(w => w.tasks.map(t => t.id))
    const newId = allTaskIds.length > 0 ? Math.max(...allTaskIds) + 1 : 1
    selectedWeek.value.tasks.push({
      id: newId,
      name: newTaskName.value,
      completed: false,
      hours: newTaskHours.value
    })
    newTaskName.value = ''
    newTaskHours.value = 1
    showAddTaskModal.value = false
  }
}

const removeTask = (weekId, taskId) => {
  const week = weeks.value.find(w => w.id === weekId)
  week.tasks = week.tasks.filter(t => t.id !== taskId)
}

const addWeek = () => {
  const weekIds = weeks.value.map(w => w.id)
  const newId = weekIds.length > 0 ? Math.max(...weekIds) + 1 : 1
  weeks.value.push({
    id: newId,
    name: `Semana ${newId}: Nueva Fase`,
    tasks: [],
    collapsed: false
  })
}

const generateBlueprint = async () => {
  const projectId = route.params.id
  if (!projectId || !projectAnalysis.value) {
    alert('❌ Error: El análisis del proyecto no está cargado. Prueba recargar la página.')
    return
  }
  
  const projectData = {
    clientName: clientName.value,
    weeks: weeks.value.map(w => ({
      name: w.name,
      tasks: w.tasks.map(t => ({
        name: t.name,
        hours: t.hours,
        description: t.description,
        metadata: t.metadata
      }))
    }))
  }

  isApproving.value = true
  
  try {
    console.log('🚀 Generando Blueprint Técnico...')
    const result = await api.generateDocumentation(projectAnalysis.value, projectData, [], projectId)
    
    if (result.success) {
      projectDocumentation.value = result.documentation
      await saveProjectState('approved')
      alert('🚀 ¡Blueprint Técnico generado exitosamente!')
    } else {
      throw new Error(result.error || 'Error desconocido')
    }
  } catch (error) {
    console.error('❌ Error en generación de blueprint:', error)
    alert(`❌ Error al generar blueprint: ${error.message}`)
  } finally {
    isApproving.value = false
  }
}

const copyDocumentation = () => {
  navigator.clipboard.writeText(projectDocumentation.value)
  alert('📋 ¡Blueprint copiado al portapapeles!')
}

const deleteBlueprint = () => {
  if (confirm('¿Estás seguro de que deseas eliminar el Blueprint técnico? Esta acción no se puede deshacer.')) {
    projectDocumentation.value = ''
    saveProjectState()
  }
}

const renderMarkdown = (text) => {
  if (!text) return ''
  
  let html = text
    // Escapar HTML básico para evitar inyecciones pero permitir nuestro renderizado
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    
    // Headers
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    
    // Bold / Italic
    .replace(/\*\*\*(.*)\*\*\*/gim, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    
    // Code blocks
    .replace(/```(.*?)\n([\s\S]*?)```/gim, '<pre class="code-block">$2</pre>')
    
    // Inline code
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    
    // Lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    
    // Wrap lists (very basic approach: look for consecutive <li>)
    .replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>')
    .replace(/<\/ul>\s*<ul>/gim, '')
    
    // Line breaks
    .replace(/\n/gim, '<br>')

  return html
}

const sendToClickUp = async () => {
  const settings = getSettings() || {}
  
  sendingToClickUp.value = true
  
  try {
    const projectData = {
      clientName: clientName.value,
      documentation: projectDocumentation.value,
      weeks: weeks.value.map(w => ({
        name: w.name,
        tasks: w.tasks.map(t => ({
          name: t.name,
          estimatedHours: t.hours,
          tags: tags.value.map(tag => tag.name)
        }))
      }))
    }

    // Si settings es null, enviamos vacío y el backend usará el .env
    // Si settings es null, enviamos vacío y el backend usará el .env
    const clickupConfig = {
      apiToken: settings.clickup?.apiToken || '',
      spaceId: settings.clickup?.workspaceId || ''
    }

    console.log('🚀 Enviando a ClickUp con config:', clickupConfig)
    console.log('📦 Datos del proyecto:', projectData)

    const result = await api.createClickUpProject(projectData, clickupConfig)
    
    console.log('✅ Resultado del backend:', result)

    if (result.success) {
      clickupSuccess.value = true
      alert(`✅ ¡Proyecto creado con éxito en ClickUp!`)
    } else {
      console.error('❌ Error devuelto por el backend:', result.error)
      throw new Error(result.error || 'Error desconocido en el servidor')
    }
  } catch (error) {
    console.error('❌ Error capturado en el frontend:', error)
    alert(`❌ Error al crear proyecto en ClickUp: ${error.message}`)
  } finally {
    sendingToClickUp.value = false
  }
}
const generateQuotation = async () => {
  const projectId = route.params.id
  if (!projectId || !projectAnalysis.value) return

  isGeneratingQuote.value = true
  try {
    const quote = await api.quotation(projectAnalysis.value, weeks.value, projectId)
    projectQuotation.value = quote
  } catch (error) {
    console.warn('Error generating quotation:', error)
  } finally {
    isGeneratingQuote.value = false
  }
}
</script>

<template>
  <div class="project-builder">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-card">
        <div class="loading-spinner-large"></div>
        <p>Cargando proyecto...</p>
      </div>
    </div>

    <!-- Empty State / Project Selector -->
    <div v-else-if="showSelector" class="selector-overlay">
      <div class="selector-card blur-card">
        <span class="selector-icon">📋</span>
        <h2>Selecciona un Proyecto</h2>
        <p>No hay un proyecto activo. Selecciona uno para continuar con la estructura técnica.</p>
        <div class="projects-grid">
          <div v-for="p in allProjects" :key="p.id" class="p-card" @click="router.push(`/project/${p.id}`)">
            <strong>{{ p.name }}</strong>
            <span>{{ p.date }}</span>
          </div>
        </div>
        <router-link to="/analyzer" class="btn btn-primary">Analizar Nuevo Lead</router-link>
      </div>
    </div>

    <!-- Header -->
    <div v-if="!showSelector && !isLoading" class="builder-header premium-header">
      <div class="project-info">
        <div class="client-badge">
          {{ clientName }} (cliente final)
        </div>
      </div>
      <div class="project-stats">
        <div class="stat">
          <span class="stat-number cyan-glow">{{ totalDuration }}</span>
          <span class="stat-label">Semanas</span>
        </div>
        <div class="stat">
          <span class="stat-number cyan-glow">{{ totalTasks }}</span>
          <span class="stat-label">Tareas</span>
        </div>
        <div class="stat">
          <span class="stat-number cyan-glow">{{ totalHours }}h</span>
          <span class="stat-label">Horas Est.</span>
        </div>
      </div>
    </div>

    <div class="builder-content">
      <!-- Left: Weeks & Tasks -->
      <div class="weeks-panel">
        <div class="panel-header">
          <h2>📋 Estructura del Proyecto</h2>
          <button class="btn btn-secondary" @click="addWeek">+ Semana</button>
        </div>

        <div class="weeks-list">
          <div v-for="week in weeks" :key="week.id" class="week-card">
            <div class="week-header" @click="toggleWeek(week)">
              <span class="collapse-icon">{{ week.collapsed ? '▶' : '▼' }}</span>
              <input 
                v-model="week.name"
                class="week-name-input"
                @click.stop
              />
              <span class="task-count">{{ week.tasks.length }} tareas</span>
            </div>
            
            <div v-if="!week.collapsed" class="week-tasks">
              <div v-for="task in week.tasks" :key="task.id" class="task-item">
                <input 
                  type="checkbox" 
                  v-model="task.completed"
                  class="task-checkbox"
                />
                <input 
                  v-model="task.name"
                  class="task-name-input"
                  :class="{ completed: task.completed }"
                />
                <span class="task-hours">{{ task.hours }}h</span>
                <button class="remove-btn" @click="removeTask(week.id, task.id)">×</button>
              </div>
              <button class="add-task-btn" @click="addTask(week.id)">
                + Agregar tarea
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Config & Preview -->
      <div class="config-panel">
        <!-- Quotation Section -->
        <div class="config-section quote-section fadeIn">
          <div class="section-header">
            <h3>💰 Cotización Estratégica</h3>
            <button 
              class="btn btn-secondary btn-sm" 
              @click="generateQuotation"
              :disabled="isGeneratingQuote"
            >
              {{ isGeneratingQuote ? 'Calculando...' : 'Recalcular' }}
            </button>
          </div>
          
          <div v-if="projectQuotation" class="quote-content expanded">
            <div class="quote-stat-row">
              <div class="quote-stat primary">
                <span class="q-label">Inversión Setup</span>
                <span class="q-value">${{ projectQuotation.investment?.toLocaleString() || '0' }}</span>
              </div>
              <div class="quote-stat">
                <span class="q-label">Fee Mensual</span>
                <span class="q-value">${{ projectQuotation.monthlyFee?.toLocaleString() || '97' }}/mes</span>
              </div>
              <div class="quote-stat">
                <span class="q-label">ROI Est.</span>
                <span class="q-value green">{{ projectQuotation.roi?.multiplier || '3-5' }}x</span>
              </div>
            </div>
            
            <div class="quote-solutions">
              <div v-for="(sol, i) in projectQuotation.solutions?.slice(0, 5)" :key="i" class="sol-item">
                <span class="sol-dot"></span>
                {{ sol.name || sol }}
              </div>
            </div>

            <details v-if="projectQuotation.html" class="quote-details">
              <summary>📋 Ver desglose completo</summary>
              <div class="quote-preview-box" v-html="projectQuotation.html"></div>
            </details>
          </div>
          <div v-else class="quote-empty">
            <span v-if="isGeneratingQuote" class="loading-spinner"></span>
            <p v-else>Haz clic en Recalcular para generar la cotización...</p>
          </div>
        </div>

        <!-- Tags -->
        <div class="config-section">
          <h3>🏷️ Tags del Proyecto</h3>
          <div class="tags-list">
            <span 
              v-for="tag in tags" 
              :key="tag.name" 
              class="tag-chip"
              :style="{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }"
            >
              {{ tag.name }}
            </span>
          </div>
        </div>

        <!-- ClickUp Integration -->
        <div class="config-section clickup-section">
          <h3>🚀 Enviar a ClickUp</h3>
          
          <div v-if="clickupSuccess" class="success-message">
            <span class="success-icon">✅</span>
            <div>
              <strong>¡Proyecto creado exitosamente!</strong>
              <p>Se han creado {{ totalTasks }} tareas en ClickUp</p>
            </div>
          </div>
          
          <div v-else class="clickup-preview">
            <div class="preview-item">
              <span class="preview-label">Carpeta:</span>
              <span class="preview-value">{{ clientName }} - Implementación GHL</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">Blueprint:</span>
              <span class="preview-value">Auto-generado con IA</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">Tareas:</span>
              <span class="preview-value">{{ totalTasks }} tareas totales</span>
            </div>
            
            <div class="action-buttons">
              <button 
                class="btn btn-primary approve-btn pulse-btn"
                @click="generateBlueprint"
                :disabled="isApproving || sendingToClickUp"
              >
                <span v-if="isApproving" class="loading-spinner"></span>
                {{ isApproving ? 'Generando...' : '📄 Generar Blueprint Técnico' }}
              </button>

              <button 
                class="btn btn-secondary send-btn"
                @click="sendToClickUp"
                :disabled="sendingToClickUp || isApproving"
              >
                <span v-if="sendingToClickUp" class="loading-spinner"></span>
                {{ sendingToClickUp ? 'Exportando...' : '🚀 Exportar a ClickUp' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Task Modal -->
    <div v-if="showAddTaskModal" class="modal-overlay" @click="showAddTaskModal = false">
      <div class="modal" @click.stop>
        <h3>Agregar Tarea</h3>
        <div class="form-group">
          <label>Nombre de la tarea</label>
          <input 
            v-model="newTaskName"
            class="input"
            placeholder="Ej: Configurar automatización..."
            @keyup.enter="confirmAddTask"
          />
        </div>
        <div class="form-group">
          <label>Horas estimadas</label>
          <input 
            v-model.number="newTaskHours"
            type="number"
            class="input"
            min="1"
          />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showAddTaskModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="confirmAddTask">Agregar</button>
        </div>
      </div>
    </div>

    <!-- Technical Blueprint Preview (Shows after approval) -->
    <div v-if="projectDocumentation || isEditingBlueprint" class="blueprint-section fadeIn">
      <div class="panel-header">
        <h2>📘 Blueprint Técnico GHL</h2>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" @click="isEditingBlueprint = !isEditingBlueprint">
            {{ isEditingBlueprint ? '💾 Guardar' : '✏️ Editar' }}
          </button>
          <button class="btn btn-secondary btn-sm" @click="copyDocumentation" v-if="!isEditingBlueprint">📋 Copiar</button>
          <button class="btn btn-danger btn-sm" @click="deleteBlueprint">🗑️ Borrar</button>
        </div>
      </div>
      <div class="blueprint-content">
        <div v-if="!isEditingBlueprint" class="blueprint-markdown" v-html="renderMarkdown(projectDocumentation)"></div>
        <textarea 
          v-else 
          v-model="projectDocumentation" 
          class="blueprint-textarea"
          placeholder="Escribe el blueprint técnico aquí..."
        ></textarea>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-builder {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  min-height: 80vh;
}

.selector-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-page);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
}

.loading-card {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
}

.loading-spinner-large {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255,255,255,0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 24px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.selector-card {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
}

.selector-icon {
  font-size: 48px;
  margin-bottom: 24px;
  display: block;
}

.projects-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin: 32px 0;
  max-height: 300px;
  overflow-y: auto;
}

.p-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
}

.p-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--primary);
  transform: scale(1.02);
}

/* Header */
.premium-header {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 24px 40px;
  margin-bottom: 24px;
}

.client-badge {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  padding: 12px 24px;
  border-radius: 12px;
  font-family: var(--font-display);
  font-weight: 700;
  color: #fff;
  font-size: 15px;
}

.cyan-glow {
  color: #00f5ff;
  text-shadow: 0 0 15px rgba(0, 245, 255, 0.4);
}

.project-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.project-name-input {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  color: var(--text);
  font-size: 16px;
  font-weight: 600;
  width: 280px;
}

.project-type-select {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  color: var(--text);
  font-size: 14px;
}

.project-stats {
  display: flex;
  gap: 32px;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
}

/* Content */
.builder-content {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
}

/* Weeks Panel */
.weeks-panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.panel-header h2 {
  font-size: 16px;
}

.weeks-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.week-card {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.week-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.week-header:hover {
  background: var(--bg-hover);
}

.collapse-icon {
  font-size: 10px;
  color: var(--text-muted);
}

.week-name-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
}

.week-name-input:focus {
  outline: none;
}

.task-count {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-hover);
  padding: 4px 10px;
  border-radius: 12px;
}

.week-tasks {
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--bg-card);
  border-radius: 8px;
}

.task-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--primary);
}

.task-name-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text);
  font-size: 13px;
}

.task-name-input.completed {
  text-decoration: line-through;
  opacity: 0.5;
}

.task-name-input:focus {
  outline: none;
}

.task-hours {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-dark);
  padding: 2px 8px;
  border-radius: 10px;
}

.remove-btn {
  background: transparent;
  border: none;
  color: var(--danger);
  font-size: 18px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.task-item:hover .remove-btn {
  opacity: 1;
}

.add-task-btn {
  background: transparent;
  border: 1px dashed var(--border);
  border-radius: 8px;
  padding: 10px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.add-task-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

/* Config Panel */
.config-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
}

.config-section h3 {
  font-size: 14px;
  margin-bottom: 16px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg-dark);
  border-radius: 8px;
}

.field-name {
  font-size: 13px;
}

.field-type {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: capitalize;
}

/* ClickUp Section */
.clickup-section {
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.1), rgba(0, 217, 255, 0.05));
  border-color: var(--primary);
}

.clickup-preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.preview-label {
  color: var(--text-muted);
}

.preview-value {
  font-weight: 500;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.approve-btn {
  background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
  border: none;
  color: white;
  font-weight: 700;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 8px 16px rgba(108, 92, 231, 0.3);
  transition: all 0.3s ease;
}

.approve-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(108, 92, 231, 0.4);
}

.approve-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.pulse-btn {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(108, 92, 231, 0.4); }
  70% { transform: scale(1.02); box-shadow: 0 0 0 15px rgba(108, 92, 231, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(108, 92, 231, 0); }
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.success-message {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 184, 148, 0.1);
  border: 1px solid var(--success);
  border-radius: 10px;
  padding: 16px;
}

.success-icon {
  font-size: 32px;
}

.success-message p {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  width: 400px;
  max-width: 90vw;
}

.modal h3 {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
/* Blueprint Section */
.blueprint-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  margin-top: 24px;
}

.blueprint-content {
  padding: 32px;
  background: var(--bg-dark);
}

.blueprint-markdown {
  color: var(--text);
  line-height: 1.6;
  font-family: 'Inter', system-ui, sans-serif;
}

.blueprint-textarea {
  width: 100%;
  min-height: 500px;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 24px;
  color: #fff;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
}

.blueprint-textarea:focus {
  outline: none;
  border-color: var(--primary);
  background: rgba(0,0,0,0.5);
}

.blueprint-markdown :deep(h1), 
.blueprint-markdown :deep(h2), 
.blueprint-markdown :deep(h3) {
  color: var(--primary-light);
  margin-top: 24px;
  margin-bottom: 12px;
}

.blueprint-markdown :deep(li) {
  margin-bottom: 8px;
  list-style-type: '👉 ';
  margin-left: 20px;
}

.blueprint-markdown :deep(strong) {
  color: var(--accent);
}

.blueprint-markdown :deep(.code-block) {
  background: #1e1e1e;
  padding: 16px;
  border-radius: 8px;
  color: #d4d4d4;
  font-family: var(--font-mono);
  font-size: 13px;
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid var(--glass-border);
}
.quote-section {
  border: 1px solid rgba(0, 245, 255, 0.2);
  background: linear-gradient(135deg, rgba(0, 245, 255, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.quote-stat-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.quote-stat {
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
}

.q-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
}

.q-value {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
}

.q-value.green {
  color: var(--success);
}

.quote-solutions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.sol-item {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sol-dot {
  width: 6px;
  height: 6px;
  background: #00f5ff;
  border-radius: 50%;
}

.quote-preview-box {
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  font-size: 12px;
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid var(--glass-border);
}

.quote-empty {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.fadeIn {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
