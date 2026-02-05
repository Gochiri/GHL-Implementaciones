<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api.js'

const route = useRoute()
const router = useRouter()

const allProjects = ref([])
const showSelector = ref(false)
const isGenerating = ref(false)

const clientInfo = ref({
  name: '',
  contact: '',
  email: '',
  phone: ''
})

const proposalData = ref({
  painPoints: [],
  solutions: [],
  timeline: 'Calculando...',
  investment: 0,
  roi: {
    leadsPerMonth: 0,
    currentCloseRate: 0,
    projectedCloseRate: 0,
    avgTicket: 0
  }
})

const projectTypes = [
  { value: 'basic', label: 'Setup Básico GHL', weeks: 2, price: 500 },
  { value: 'automation', label: 'Automatizaciones', weeks: 3, price: 1200 },
  { value: 'integrations', label: 'Integraciones API', weeks: 4, price: 2000 },
  { value: 'saas', label: 'SAAS Completo', weeks: 8, price: 5000 },
  { value: 'custom', label: 'Custom Development', weeks: 6, price: 3500 }
]

const loadProposalData = async () => {
  const projectId = route.params.id
  
  if (!projectId) {
    const lastId = localStorage.getItem('last-project-id')
    if (lastId) {
      router.replace(`/proposal/${lastId}`)
    } else {
      const projects = await api.getProjects()
      allProjects.value = projects
      if (projects.length > 0) {
        showSelector.value = true
      }
    }
    return
  }

  try {
    // First check localStorage for cached project data
    let project = null
    try {
      const localData = localStorage.getItem(`project-${projectId}`)
      if (localData) {
        project = JSON.parse(localData)
      }
    } catch (e) {}
    
    // Try API as well
    try {
      const apiProject = await api.getProject(projectId)
      if (apiProject) {
        project = { ...project, ...apiProject }
      }
    } catch (e) {
      console.warn('API unavailable, using localStorage')
    }
    
    if (project) {
      showSelector.value = false
      localStorage.setItem('last-project-id', projectId)
      clientInfo.value.name = project.name || project.clientName || 'Sin Nombre'
      
      if (project.analysis) {
        if (project.analysis.clientEmail) clientInfo.value.email = project.analysis.clientEmail
        if (project.analysis.contactName) clientInfo.value.contact = project.analysis.contactName
        
        // Extract pain points - handle objects and strings
        if (project.analysis.painPoints && proposalData.value.painPoints.length === 0) {
          proposalData.value.painPoints = project.analysis.painPoints.map(p => {
            if (typeof p === 'string') return p
            return p.text || p.dolor || p.description || JSON.stringify(p)
          })
        }
        
        // Extract objectives - handle objects and strings
        if (project.analysis.objectives && proposalData.value.solutions.length === 0) {
          proposalData.value.solutions = project.analysis.objectives.map(o => {
            if (typeof o === 'string') return o
            return o.text || o.objetivo || o.objective || o.description || JSON.stringify(o)
          })
        }
      }
      
      // Load quotation from project if available
      if (project.quotation) {
        if (project.quotation.investment) proposalData.value.investment = project.quotation.investment
        if (project.quotation.timeline) proposalData.value.timeline = project.quotation.timeline
        if (project.quotation.solutions) {
          proposalData.value.solutions = project.quotation.solutions.map(s => 
            typeof s === 'string' ? s : s.name || s.text || JSON.stringify(s)
          )
        }
        if (project.quotation.painPoints) {
          proposalData.value.painPoints = project.quotation.painPoints.map(p => 
            typeof p === 'string' ? p : p.text || p.dolor || JSON.stringify(p)
          )
        }
      }
      
      // Use projectType pricing as fallback
      if (project.projectType && proposalData.value.investment === 0) {
        const typeInfo = projectTypes.find(t => t.value === project.projectType)
        if (typeInfo) {
          proposalData.value.investment = typeInfo.price
          proposalData.value.timeline = `${typeInfo.weeks} semanas`
        }
      }
      
      // Use weeks count for timeline
      if (project.weeks && project.weeks.length > 0) {
        proposalData.value.timeline = `${project.weeks.length} semanas`
      }

      // Sync status if needed
      try {
        if (project.status === 'created' || project.status === 'analysis' || !project.status) {
          await api.updateProject(projectId, { status: 'proposal' })
        }
      } catch (e) {}
    }
  } catch (error) {
    console.error('Error loading project for proposal:', error)
    showSelector.value = true
  }
}

const generateWithAI = async () => {
  const projectId = route.params.id
  if (!projectId) return

  const project = await api.getProject(projectId)
  if (!project) return

  isGenerating.value = true
  try {
    const quotation = await api.quotation(project.analysis, {
      weeks: project.weeks,
      projectType: project.projectType
    }, projectId)

    if (quotation) {
      if (quotation.painPoints) proposalData.value.painPoints = quotation.painPoints
      if (quotation.solutions) proposalData.value.solutions = quotation.solutions
      if (quotation.investment || quotation.price) proposalData.value.investment = quotation.investment || quotation.price
      if (quotation.timeline) proposalData.value.timeline = quotation.timeline
      
      if (quotation.roi) {
        proposalData.value.roi = {
          ...proposalData.value.roi,
          ...quotation.roi
        }
      }
      
      // Update backend with new proposal data if needed (optional since quotation call might have done it)
      await api.updateProject(projectId, { status: 'proposal' })
      
      alert('✨ Propuesta optimizada con IA exitosamente')
    }
  } catch (error) {
    console.error('Error generating AI quotation:', error)
    alert('Error al generar propuesta con IA: ' + error.message)
  } finally {
    isGenerating.value = false
  }
}

watch(() => route.params.id, (newId) => {
  if (newId) loadProposalData()
})

onMounted(() => {
  loadProposalData()
})

const calculateROI = computed(() => {
  const current = proposalData.value.roi.leadsPerMonth * (proposalData.value.roi.currentCloseRate / 100) * proposalData.value.roi.avgTicket
  const projected = proposalData.value.roi.leadsPerMonth * (proposalData.value.roi.projectedCloseRate / 100) * proposalData.value.roi.avgTicket
  const monthlyGain = projected - current
  const paybackMonths = proposalData.value.investment / monthlyGain
  return {
    currentRevenue: current,
    projectedRevenue: projected,
    monthlyGain,
    paybackMonths: paybackMonths.toFixed(1)
  }
})

const showPreview = ref(true)
const copying = ref(false)

const generateHTML = () => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Propuesta Comercial - ${clientInfo.value.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #e5484d;
      --secondary: #1a1a1e;
      --text: #333;
      --text-light: #666;
      --bg: #ffffff;
      --accent: #f8f9fa;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Outfit', sans-serif; 
      background: #f0f2f5; 
      color: var(--text); 
      line-height: 1.6;
    }
    .page {
      background: white;
      max-width: 900px;
      margin: 40px auto;
      padding: 60px 80px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      position: relative;
    }
    .top-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, var(--primary), #fb8c00);
    }
    header {
      margin-bottom: 60px;
      border-bottom: 1px solid #eee;
      padding-bottom: 40px;
    }
    .subtitle-small {
      text-transform: uppercase;
      letter-spacing: 2px;
      font-size: 14px;
      color: var(--primary);
      font-weight: 600;
      margin-bottom: 10px;
      display: block;
    }
    h1 {
      font-size: 42px;
      font-weight: 700;
      color: var(--secondary);
      line-height: 1.2;
      margin-bottom: 20px;
    }
    .intro-text {
      font-size: 18px;
      color: var(--text-light);
      max-width: 600px;
    }
    .section {
      margin-bottom: 50px;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 25px;
    }
    .section-num {
      font-size: 18px;
      font-weight: 700;
      color: white;
      background: var(--secondary);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }
    h2 {
      font-size: 24px;
      color: var(--secondary);
      font-weight: 700;
    }
    .content-box {
      background: var(--accent);
      padding: 30px;
      border-radius: 12px;
      border-left: 4px solid var(--primary);
    }
    .list-item {
      display: flex;
      gap: 12px;
      margin-bottom: 15px;
      align-items: flex-start;
    }
    .dot {
      width: 8px;
      height: 8px;
      background: var(--primary);
      border-radius: 50%;
      margin-top: 8px;
      flex-shrink: 0;
    }
    .roi-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .roi-table th {
      text-align: left;
      padding: 15px;
      background: var(--secondary);
      color: white;
      font-weight: 600;
    }
    .roi-table td {
      padding: 15px;
      border-bottom: 1px solid #eee;
      font-size: 16px;
    }
    .roi-highlight {
      font-weight: 700;
      color: var(--primary);
    }
    .investment-card {
      background: var(--secondary);
      color: white;
      padding: 40px;
      border-radius: 16px;
      text-align: center;
      margin-top: 60px;
    }
    .price-large {
      font-size: 56px;
      font-weight: 700;
      margin: 20px 0;
    }
    .btn-accept {
      display: inline-block;
      background: var(--primary);
      color: white;
      padding: 18px 50px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: 18px;
      transition: transform 0.2s;
    }
    .btn-accept:hover {
      transform: translateY(-3px);
    }
    footer {
      margin-top: 60px;
      text-align: center;
      color: var(--text-light);
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="top-bar"></div>
    
    <header>
      <span class="subtitle-small">Propuesta Técnica y Comercial</span>
      <h1>Optimización y Automatización CRM para ${clientInfo.value.name}</h1>
      <p class="intro-text">Un sistema integral diseñado para automatizar procesos, mejorar la captación de leads y escalar la operación comercial mediante GoHighLevel.</p>
    </header>

    <div class="section">
      <div class="section-header">
        <div class="section-num">1</div>
        <h2>Desafíos Actuales</h2>
      </div>
      <div class="content-box">
        ${proposalData.value.painPoints.map(pain => `
          <div class="list-item">
            <div class="dot"></div>
            <div>${pain}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-num">2</div>
        <h2>Solución Propuesta</h2>
      </div>
      <div class="content-box" style="border-left-color: #fb8c00;">
        ${proposalData.value.solutions.map(sol => `
          <div class="list-item">
            <div class="dot" style="background: #fb8c00;"></div>
            <div>${sol}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-num">3</div>
        <h2>Proyección de Resultados (ROI)</h2>
      </div>
      <table class="roi-table">
        <tr>
          <th>Concepto</th>
          <th>Estado Actual</th>
          <th>Proyección GHL</th>
        </tr>
        <tr>
          <td>Ingresos Mensuales</td>
          <td>$${calculateROI.value.currentRevenue.toLocaleString()}</td>
          <td class="roi-highlight">$${calculateROI.value.projectedRevenue.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Mejora en Tasa de Cierre</td>
          <td>${proposalData.value.roi.currentCloseRate}%</td>
          <td class="roi-highlight">${proposalData.value.roi.projectedCloseRate}%</td>
        </tr>
        <tr>
          <td>Impacto Mensual Neto</td>
          <td colspan="2" style="text-align: center;" class="roi-highlight">+$${calculateROI.value.monthlyGain.toLocaleString()} / mes</td>
        </tr>
      </table>
    </div>

    <div class="investment-card">
      <span class="subtitle-small" style="color: rgba(255,255,255,0.7);">Inversión del Proyecto</span>
      <div class="price-large">$${proposalData.value.investment.toLocaleString()} USD</div>
      <p style="margin-bottom: 30px; opacity: 0.8;">Tiempo estimado de implementación: ${proposalData.value.timeline}</p>
      <a href="mailto:${clientInfo.value.email}?subject=Acepto la propuesta" class="btn-accept">Aceptar Propuesta</a>
    </div>

    <footer>
      <p>Generado oficialmente por GHL Assistant • ${new Date().toLocaleDateString('es')}</p>
    </footer>
  </div>
</body>
</html>
  `
}

const copyHTML = async () => {
  copying.value = true
  await navigator.clipboard.writeText(generateHTML())
  setTimeout(() => { copying.value = false }, 2000)
}

const downloadHTML = () => {
  const blob = new Blob([generateHTML()], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `propuesta-${clientInfo.value.name.toLowerCase().replace(/\s+/g, '-')}.html`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="proposal-generator">
    <!-- Empty State / Project Selector -->
    <div v-if="showSelector" class="selector-overlay">
      <div class="selector-card blur-card">
        <span class="selector-icon">📄</span>
        <h2>Selecciona una Propuesta</h2>
        <p>No hay un proyecto activo para generar la propuesta. Selecciona uno para continuar.</p>
        <div class="projects-grid">
          <div v-for="p in allProjects" :key="p.id" class="p-card" @click="router.push(`/proposal/${p.id}`)">
            <strong>{{ p.name }}</strong>
            <span>{{ p.date }}</span>
          </div>
        </div>
        <router-link to="/analyzer" class="btn btn-primary">Analizar Nuevo Lead</router-link>
      </div>
    </div>

    <!-- Editor Panel -->
    <div v-if="!showSelector" class="editor-panel">
      <div class="panel-header">
        <h2>✏️ Editor de Propuesta</h2>
      </div>

      <!-- Client Info -->
      <div class="editor-section">
        <h3>👤 Información del Cliente</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Empresa</label>
            <input v-model="clientInfo.name" class="input" />
          </div>
          <div class="form-group">
            <label>Contacto</label>
            <input v-model="clientInfo.contact" class="input" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="clientInfo.email" class="input" type="email" />
          </div>
          <div class="form-group">
            <label>Teléfono</label>
            <input v-model="clientInfo.phone" class="input" />
          </div>
        </div>
      </div>

      <!-- Pain Points -->
      <div class="editor-section">
        <h3>🔥 Dolores/Desafíos</h3>
        <div v-for="(pain, i) in proposalData.painPoints" :key="'pain-'+i" class="editable-item">
          <input v-model="proposalData.painPoints[i]" class="input" />
          <button class="remove-btn" @click="proposalData.painPoints.splice(i, 1)">×</button>
        </div>
        <button class="add-btn" @click="proposalData.painPoints.push('')">+ Agregar dolor</button>
      </div>

      <!-- Solutions -->
      <div class="editor-section">
        <h3>✅ Soluciones</h3>
        <div v-for="(sol, i) in proposalData.solutions" :key="'sol-'+i" class="editable-item">
          <input v-model="proposalData.solutions[i]" class="input" />
          <button class="remove-btn" @click="proposalData.solutions.splice(i, 1)">×</button>
        </div>
        <button class="add-btn" @click="proposalData.solutions.push('')">+ Agregar solución</button>
      </div>

      <!-- Investment & ROI -->
      <div class="editor-section">
        <h3>💰 Inversión y ROI</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Precio (USD)</label>
            <input v-model.number="proposalData.investment" class="input" type="number" />
          </div>
          <div class="form-group">
            <label>Timeline</label>
            <input v-model="proposalData.timeline" class="input" />
          </div>
          <div class="form-group">
            <label>Leads/Mes</label>
            <input v-model.number="proposalData.roi.leadsPerMonth" class="input" type="number" />
          </div>
          <div class="form-group">
            <label>% Cierre Actual</label>
            <input v-model.number="proposalData.roi.currentCloseRate" class="input" type="number" />
          </div>
          <div class="form-group">
            <label>% Cierre Proyectado</label>
            <input v-model.number="proposalData.roi.projectedCloseRate" class="input" type="number" />
          </div>
          <div class="form-group">
            <label>Ticket Promedio ($)</label>
            <input v-model.number="proposalData.roi.avgTicket" class="input" type="number" />
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="editor-actions">
        <button 
          class="btn btn-primary generate-ai-btn" 
          @click="generateWithAI"
          :disabled="isGenerating"
        >
          <span v-if="isGenerating" class="loading-spinner"></span>
          {{ isGenerating ? 'Optimizando...' : '✨ Generar con IA' }}
        </button>
        <button class="btn btn-secondary" @click="copyHTML">
          {{ copying ? '✓ Copiado!' : '📋 Copiar HTML' }}
        </button>
        <button class="btn btn-secondary" @click="downloadHTML">
          📥 Descargar
        </button>
      </div>
    </div>

    <!-- Preview Panel -->
    <div class="preview-panel">
      <div class="panel-header">
        <h2>👁️ Vista Previa</h2>
        <div class="preview-actions">
          <button class="toggle-preview" @click="showPreview = !showPreview">
            {{ showPreview ? 'Ocultar' : 'Mostrar' }}
          </button>
        </div>
      </div>
      <div v-if="showPreview" class="preview-frame">
        <iframe :srcdoc="generateHTML()" class="preview-iframe" title="Proposal Preview"></iframe>
      </div>
      <div v-else class="preview-placeholder">
        <span class="placeholder-icon">👁️</span>
        <p>Vista previa oculta. Haz clic en "Mostrar" para ver la propuesta renderizada.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.proposal-generator {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 24px;
  height: calc(100vh - var(--header-height) - 64px);
  position: relative;
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
  max-height: 200px;
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

.editor-panel,
.preview-panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
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

.editor-panel {
  overflow-y: auto;
}

.editor-section {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.editor-section h3 {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  color: var(--text-muted);
}

.editable-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.editable-item .input {
  flex: 1;
}

.remove-btn {
  background: var(--bg-hover);
  border: 1px solid var(--border);
  color: var(--danger);
  width: 36px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: var(--danger);
  color: white;
  border-color: var(--danger);
}

.add-btn {
  background: transparent;
  border: 1px dashed var(--border);
  border-radius: 8px;
  padding: 10px;
  color: var(--text-muted);
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
}

.add-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.editor-actions {
  padding: 20px 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.generate-ai-btn {
  background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
  flex: 1 1 100%;
  margin-bottom: 8px;
  border: none;
  box-shadow: 0 4px 15px rgba(108, 92, 231, 0.3);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.toggle-preview {
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 14px;
  color: var(--text);
  cursor: pointer;
  font-size: 13px;
}

.preview-frame {
  flex: 1;
  padding: 0;
  background: #f0f2f5;
  overflow: hidden;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: 16px;
  padding: 40px;
  text-align: center;
}

.placeholder-icon {
  font-size: 48px;
  opacity: 0.2;
}
</style>
