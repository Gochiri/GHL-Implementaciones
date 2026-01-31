<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '../api.js'

const router = useRouter()
const route = useRoute()

onMounted(async () => {
  const leadId = route.query.leadId
  if (leadId) {
    try {
      const webhooks = await api.getWebhooks()
      const lead = webhooks.find(w => w.id === leadId)
      if (lead) {
        transcript.value = `Lead de GHL: ${lead.contact.name}\nEtapa: ${lead.stage}\nMensaje/Contexto: ${lead.message || 'Sin mensaje adicional'}`
        alert(`🚀 Lead cargado desde GHL: ${lead.contact.name}`)
      }
    } catch (error) {
      console.error('Error loading lead:', error)
    }
  }
})
const transcript = ref('')
const isAnalyzing = ref(false)
const isUploading = ref(false)
const attachedFiles = ref([])
const fileInput = ref(null)
const analysisComplete = ref(false)
const useRealAPI = ref(true) // Toggle for real API vs mock

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileUpload = async (event) => {
  const files = event.target.files
  if (!files.length) return

  isUploading.value = true
  console.log(`📤 Iniciando subida de ${files.length} archivos...`)
  
  for (const file of files) {
    try {
      console.log(`⏳ Subiendo: ${file.name}...`)
      const res = await api.uploadFile(file)
      console.log(`✅ Resultado de ${file.name}:`, res)
      
      if (res.text) {
        attachedFiles.value.push({
          name: file.name,
          text: res.text,
          size: (file.size / 1024).toFixed(1) + ' KB'
        })
        console.log(`📎 Archivo adjuntado: ${file.name}`)
        // Append extracted text to transcript for analysis
        transcript.value += `\n\n--- DOCUMENTO: ${file.name} ---\n${res.text}\n`
      }
    } catch (error) {
      console.error(`❌ Error en ${file.name}:`, error)
      alert(`Error al subir ${file.name}: ${error.message}`)
    }
  }
  isUploading.value = false
  event.target.value = '' // Reset input
}

const removeFile = (index) => {
  const file = attachedFiles.value[index]
  // Optionally remove text from transcript (though simpler to just leave it if appended)
  attachedFiles.value.splice(index, 1)
}

const analysis = ref({
  painPoints: [],
  complexity: 0,
  implementationType: '',
  objectives: [],
  currentSituation: ''
})

const chatMessages = ref([])
const chatInput = ref('')
const chatContainer = ref(null)
const previousAnswers = ref([])
const isTyping = ref(false)
const isReady = ref(false)

// Mock pain points for demo/fallback
const mockPainPoints = [
  { id: 1, text: 'Pérdida de leads por falta de seguimiento automatizado', severity: 'high', category: 'Automatización' },
  { id: 2, text: 'Procesos manuales que consumen 15+ horas semanales', severity: 'high', category: 'Eficiencia' },
  { id: 3, text: 'Sin visibilidad del pipeline de ventas', severity: 'medium', category: 'Reportes' },
  { id: 4, text: 'Comunicación fragmentada entre canales', severity: 'medium', category: 'Integración' }
]

const mockObjectives = [
  'Automatizar seguimiento de leads en las primeras 48 horas',
  'Centralizar comunicación (Email, SMS, WhatsApp)',
  'Dashboard de métricas en tiempo real',
  'Reducir tiempo de respuesta a menos de 5 minutos'
]

const analyzeTranscript = async () => {
  if (!transcript.value.trim()) return
  
  isAnalyzing.value = true
  
  try {
    if (useRealAPI.value) {
      // Try real API
      const result = await api.analyze(transcript.value)
      analysis.value = {
        clientName: result.clientName || result.nombre_cliente || 'Cliente',
        niche: result.niche || result.nicho || 'N/A',
        painPoints: result.painPoints || result.dolores || [],
        complexity: result.complexity || result.complejidad || 5,
        implementationType: result.implementationType || result.tipo_implementacion || 'Setup GHL',
        objectives: result.objectives || result.objetivos || [],
        currentSituation: result.currentSituation || result.situacion_actual || ''
      }
    } else {
      throw new Error('Using mock data')
    }
  } catch (error) {
    console.warn('API error, using mock data:', error.message)
    // Fallback to mock data
    analysis.value = {
      painPoints: mockPainPoints,
      complexity: 7,
      implementationType: 'Automatización + CRM Setup',
      objectives: mockObjectives,
      currentSituation: 'El cliente maneja procesos manuales con pérdida potencial de leads.'
    }
  }
  
  // Save to projects collection for multi-project support
  const savedProjects = localStorage.getItem('projects')
  const projects = savedProjects ? JSON.parse(savedProjects) : []
  
  const newProject = {
    id: 'proj-' + Date.now(),
    name: analysis.value.clientName || 'Cliente ' + (projects.length + 1),
    niche: analysis.value.niche || 'N/A',
    date: new Date().toISOString().split('T')[0],
    complexity: analysis.value.complexity,
    status: 'analysis',
    analysis: { ...analysis.value },
    weeks: [] // Will be populated in Project Builder
  }
  
  projects.unshift(newProject)
  localStorage.setItem('projects', JSON.stringify(projects))
  localStorage.setItem('last-project-id', newProject.id)

  // Mark analysis as complete
  isAnalyzing.value = false
  analysisComplete.value = true

  // Initialize first bot message if not already there
  if (chatMessages.value.length === 0) {
    setTimeout(() => {
      addBotMessage('¡Análisis técnico completado! He identificado los puntos clave. ¿Deseas que profundicemos en alguna automatización o pipeline específico?')
    }, 1000)
  }
}

const showChat = ref(true) // Always visible in the new layout

const requestNextQuestion = async () => {
  if (previousAnswers.value.length >= 3) {
    isReady.value = true
    addBotMessage('Perfecto, tengo toda la información técnica necesaria. ¡Haz clic en "Generar Proyecto" para continuar!')
    return
  }

  isTyping.value = true
  try {
    if (useRealAPI.value) {
      const result = await api.hormozi(analysis.value, previousAnswers.value)
      isTyping.value = false
      if (result.ready || result.listo) {
        isReady.value = true
        setTimeout(() => addBotMessage('Excelente. Con esta configuración técnica podemos armar una infraestructura sólida en GHL. ¡Vamos al siguiente paso!'), 400)
      } else if (result.question || result.pregunta) {
        setTimeout(() => addBotMessage(result.question || result.pregunta), 400)
      }
    } else {
      throw new Error('Using mock')
    }
  } catch (err) {
    isTyping.value = false
    console.warn('API error in chat:', err)
    // Fallback technical questions
    const fallbackQuestions = [
      '¿Qué pipelines actuales tienen y qué etapas críticas no pueden faltar?',
      '¿Necesitan custom fields específicos para segmentar por tipo de servicio?',
      '¿Qué integraciones externas (stripe, zapier, apis) son vitales?'
    ]
    const nextQ = fallbackQuestions[previousAnswers.value.length]
    if (nextQ) {
      setTimeout(() => addBotMessage(nextQ), 800)
    } else {
      isReady.value = true
      setTimeout(() => addBotMessage('Hecho. Tengo los puntos clave de la infraestructura. ¡Procedamos!'), 800)
    }
  }
}


const addBotMessage = (text) => {
  chatMessages.value.push({
    id: Date.now(),
    type: 'bot',
    text,
    time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  })
  scrollToBottom()
}

const sendMessage = () => {
  if (!chatInput.value.trim()) return
  
  const lastBotMessage = chatMessages.value.filter(m => m.type === 'bot').pop()
  
  chatMessages.value.push({
    id: Date.now(),
    type: 'user',
    text: chatInput.value,
    time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  })
  
  // Store answer for API context
  previousAnswers.value.push({
    question: lastBotMessage?.text || '',
    answer: chatInput.value
  })
  
  chatInput.value = ''
  scrollToBottom()
  
  // Request next question
  requestNextQuestion()
}

const finishChat = () => {
  if (showChat.value) {
    addBotMessage('Perfecto, tengo lo necesario. Redirigiendo al generador de proyecto...')
    setTimeout(() => {
      saveAndRedirect()
    }, 1000)
  } else {
    saveAndRedirect()
  }
}

const saveAndRedirect = async () => {
  // Save analysis
  localStorage.setItem('last-analysis', JSON.stringify({
    ...analysis.value,
    answers: previousAnswers.value
  }))

  // Generate project structure via API
  try {
    const structure = await api.projectStructure(analysis.value, previousAnswers.value)

    // Update project with generated structure
    const projectId = localStorage.getItem('last-project-id')
    if (projectId && structure.weeks) {
      const savedProjects = localStorage.getItem('projects')
      const projects = savedProjects ? JSON.parse(savedProjects) : []
      const projectIndex = projects.findIndex(p => p.id === projectId)

      if (projectIndex !== -1) {
        // Normalizar estructura para el frontend
        const normalizedWeeks = structure.weeks.map((week, wIdx) => ({
          id: wIdx + 1,
          name: week.name,
          collapsed: false,
          tasks: (week.tasks || []).map((task, tIdx) => ({
            id: (wIdx + 1) * 100 + (tIdx + 1),
            name: task.name,
            hours: task.estimatedHours || task.hours || 1,
            completed: false,
            description: task.description || '',
            metadata: task.metadata || {}
          }))
        }))

        projects[projectIndex].weeks = normalizedWeeks
        projects[projectIndex].projectType = structure.projectType || analysis.value.implementationType
        projects[projectIndex].status = 'created'
        localStorage.setItem('projects', JSON.stringify(projects))
      }
    }
  } catch (error) {
    console.error('Error generating project structure:', error)
    // Continue anyway - user can manually add structure
  }

  router.push('/project')
}

const getContextResponse = (message) => {
  const responses = [
    'Ese volumen es bastante común.',
    'Eso representa una pérdida significativa.',
    'Con ese ticket promedio, el ROI será muy claro.',
    'Definitivamente hay espacio para optimizar.',
    'Excelente, eso nos da una base sólida.'
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

const getSeverityClass = (severity) => {
  return {
    high: 'severity-high',
    medium: 'severity-medium',
    low: 'severity-low'
  }[severity]
}
</script>

<template>
  <div class="analyzer-grid-layout fadeIn">
    <div class="glass-panel">
      <div class="panel-header">
        <h2><span>📝</span> Transcripción de Fathom</h2>
      </div>
      <div class="panel-body">
        <textarea 
          v-model="transcript"
          class="premium-textarea"
          placeholder="Pega aquí la transcripción de la llamada..."
          :disabled="analysisComplete"
        ></textarea>
        
        <div class="actions-footer">
          <input 
            type="file" 
            ref="fileInput" 
            multiple 
            class="hidden-input" 
            @change="handleFileUpload"
          />
          <button 
            class="btn btn-luxury btn-attach"
            @click="triggerFileInput"
            :disabled="analysisComplete || isUploading"
          >
            <span v-if="isUploading" class="loading-spinner"></span>
            <span v-else>📎</span>
            Adjuntar
          </button>
          
          <button 
            class="btn btn-luxury btn-analyze"
            @click="analyzeTranscript"
            :disabled="!transcript.trim() || isAnalyzing || analysisComplete"
          >
            <span v-if="isAnalyzing" class="loading-spinner"></span>
            <span v-else>🎯</span>
            {{ isAnalyzing ? 'Analizando...' : 'Iniciar Análisis' }}
          </button>
        </div>

        <div v-if="attachedFiles.length > 0" class="attached-files">
          <div v-for="(file, index) in attachedFiles" :key="index" class="file-chip">
            <span class="file-icon">📄</span>
            <span class="file-name">{{ file.name }}</span>
            <button class="remove-file" @click="removeFile(index)">×</button>
          </div>
        </div>
      </div>
    </div>

    <!-- PANEL 2: TECHNICAL ANALYSIS -->
    <div class="glass-panel results-panel">
      <div class="panel-header">
        <h2><span>📊</span> Análisis Técnico</h2>
      </div>
      <div v-if="analysisComplete" class="panel-body fadeIn">
        <div class="analysis-summary">
          <div class="result-card">
            <div class="card-title">🧠 Complejidad: <strong>{{ analysis.complexity }}/10</strong></div>
            <div class="complexity-meter">
              <div class="complexity-fill" :style="{ width: analysis.complexity * 10 + '%' }"></div>
            </div>
          </div>

          <div class="tech-card">
            <div class="tech-card-title">🔥 Dolores Principales</div>
            <div class="tech-list">
              <div v-for="pain in analysis.painPoints" :key="pain.id" class="tech-item">
                <span class="severity-dot" :class="'severity-' + pain.severity"></span>
                <div class="tech-item-content">
                  <div class="tech-text">{{ pain.text }}</div>
                  <div class="tech-sub">{{ pain.category }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="tech-card">
            <div class="tech-card-title">🎯 Estructura Sugerida</div>
            <div class="tech-list">
              <div v-for="(obj, i) in analysis.objectives" :key="i" class="tech-item">
                <span class="tech-check">✓</span>
                <div class="tech-item-content">
                  <div class="tech-text">
                    {{ typeof obj === 'object' ? (obj.objetivo || obj.objective || obj) : obj }}
                  </div>
                  <div v-if="typeof obj === 'object' && (obj.detalle || obj.detail)" class="tech-sub">
                    {{ obj.detalle || obj.detail }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="direct-actions">
           <button class="btn btn-luxury btn-generate-direct" @click="finishChat">
              Generar Proyecto 🔥
            </button>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>Sin Análisis</h3>
        <p>Los resultados técnicos aparecerán aquí después de procesar la llamada.</p>
      </div>
    </div>

    <!-- PANEL 3: AI ARCHITECT CHAT -->
    <div class="glass-panel chat-panel">
      <div class="panel-header">
        <div class="chat-title-group">
          <span class="chat-avatar">🤖</span>
          <div class="chat-info">
            <span class="chat-name">Arquitecto IA</span>
            <span class="chat-status">● En línea</span>
          </div>
        </div>
      </div>
      
      <div v-if="analysisComplete" class="panel-body chat-body fadeIn">
        <div class="chat-messages" ref="chatContainer">
          <div v-for="msg in chatMessages" :key="msg.id" class="message" :class="msg.type === 'bot' ? 'ai' : 'user'">
            {{ msg.text }}
          </div>
        </div>
        
        <div class="chat-input-area" v-if="!isReady">
          <input 
            v-model="chatInput" 
            placeholder="Escribe un ajuste..." 
            class="chat-field" 
            @keyup.enter="sendMessage" 
          />
          <button class="btn btn-primary btn-sm" @click="sendMessage">🚀</button>
        </div>
        <div class="chat-actions-final" v-else>
          <button class="btn btn-primary full-width pulse-btn" @click="finishChat">Finalizar Ajustes 🔥</button>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">💬</div>
        <h3>Chat Inactivo</h3>
        <p>La IA te ayudará a refinar los detalles una vez completado el análisis.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* New Premium Grid Layout */
.analyzer-grid-layout {
  display: grid;
  grid-template-columns: minmax(300px, 0.8fr) minmax(350px, 1fr) minmax(350px, 1fr);
  gap: 20px;
  height: calc(100vh - 160px);
  min-height: 700px;
}

@media (max-width: 1400px) {
  .analyzer-grid-layout {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto 1fr;
  }
  .chat-panel {
    grid-column: span 2;
    height: 400px !important;
  }
}

.fadeIn {
  animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Glass Panels */
.glass-panel {
  background: var(--bg-card);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.4s;
  height: 100%;
}

.glass-panel:hover {
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: var(--shadow-glow);
}

.panel-header {
  padding: 24px 32px;
  border-bottom: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.02);
}

.panel-header h2 {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-body {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
}

/* Textarea Premium */
.premium-textarea {
  flex: 1;
  min-height: 400px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  color: var(--text-secondary);
  font-family: var(--font-family);
  font-size: 15px;
  line-height: 1.6;
  resize: none;
  transition: all 0.3s;
}

.premium-textarea:focus {
  outline: none;
  border-color: var(--primary);
  background: rgba(0, 0, 0, 0.4);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.1);
}

/* Actions */
.actions-footer {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
  padding: 0 0 8px 0;
}

.btn-luxury {
  height: 56px;
  border-radius: 14px;
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  font-size: 13px;
}

.btn-attach {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  color: #fff;
}

.btn-attach:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.btn-analyze {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: #fff;
  border: none;
  box-shadow: var(--shadow-glow);
}

.btn-analyze:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(139, 92, 246, 0.4);
}

.hidden-input {
  display: none !important;
  visibility: hidden;
  height: 0;
  width: 0;
  position: absolute;
}

/* Glass Header */
.analyzer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.title-group h2 {
  font-family: var(--font-display);
  font-size: 32px;
  background: linear-gradient(to right, #fff, var(--primary-light));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Upload Section */
.upload-glass {
  background: var(--bg-card);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  padding: 48px;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
}

.upload-glass:hover {
  border-color: var(--primary);
  background: rgba(139, 92, 246, 0.05);
  box-shadow: var(--shadow-glow);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  font-size: 48px;
  filter: drop-shadow(0 0 10px var(--primary));
}

/* Analyzer Content Grid */
.analyzer-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 32px;
}

@media (max-width: 1200px) {
  .analyzer-content { grid-template-columns: 1fr; }
}

/* Chat Experience Refined */
.chat-body {
  padding: 0 !important;
}

.chat-panel {
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  max-width: 80%;
  padding: 14px 20px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
}

.message.ai {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  border-bottom-left-radius: 4px;
}

.message.user {
  align-self: flex-end;
  background: var(--primary);
  color: white;
  border-bottom-right-radius: 4px;
}

.chat-input-area {
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  gap: 12px;
}

.chat-field {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 12px 16px;
  color: white;
  transition: all 0.3s;
}

.chat-field:focus {
  outline: none;
  border-color: var(--primary);
  background: rgba(255, 255, 255, 0.1);
}

/* Sidebar Analytics */
.analysis-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.analysis-card {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.card-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--primary-light);
}

.complexity-meter {
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
  margin: 12px 0;
}

.complexity-fill {
  height: 100%;
  background: linear-gradient(to right, var(--success), var(--warning), var(--danger));
  transition: width 1s ease-in-out;
}

.pain-point-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.severity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
}

.severity-high { background: var(--danger); box-shadow: 0 0 10px var(--danger); }
.severity-medium { background: var(--warning); box-shadow: 0 0 10px var(--warning); }
.severity-low { background: var(--success); }

.pain-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.pain-text {
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}

.pain-category {
  font-size: var(--text-xs);
  color: var(--primary-light);
}

.objective-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.objective-list li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}

.check-icon {
  color: var(--success);
  font-weight: var(--font-bold);
}

.implementation-type {
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.1), rgba(0, 217, 255, 0.1));
  border: 1px solid var(--primary);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.type-label {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.type-value {
  font-weight: var(--font-semibold);
  color: var(--accent);
}

/* Chat Section */
.chat-section {
  flex: 1.5;
  display: flex;
  flex-direction: column;
  min-height: 500px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-lg);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--border);
}

.chat-title-group {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.skip-btn {
  font-size: var(--text-xs);
  height: 30px;
  padding: 0 var(--space-3);
}

.chat-avatar {
  font-size: var(--text-3xl);
}

.chat-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.chat-name {
  font-weight: var(--font-semibold);
}

.chat-status {
  font-size: var(--text-xs);
  color: var(--success);
}

.chat-messages {
  flex: 1;
  padding: var(--space-5) var(--space-6);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.chat-message {
  max-width: 80%;
  animation: fadeIn var(--transition-slow) var(--ease-out);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.chat-message.bot {
  align-self: flex-start;
}

.chat-message.user {
  align-self: flex-end;
}

.message-content {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-xl);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}

.chat-message.bot .message-content {
  background: var(--bg-hover);
  border-bottom-left-radius: var(--radius-sm);
}

.chat-message.user .message-content {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border-bottom-right-radius: var(--radius-sm);
}

.message-time {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: var(--space-1);
  padding: 0 var(--space-1);
}

/* Typing Indicator Styles */
.typing-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--text-muted);
  border-radius: var(--radius-full);
  margin-right: var(--space-1);
  animation: typing 1s infinite ease-in-out;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; margin-right: 0; }

@keyframes typing {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50% { transform: translateY(-4px); opacity: 1; }
}

.chat-message.user .message-time {
  text-align: right;
}

.chat-input-area {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--border);
}

.chat-input {
  flex: 1;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  color: var(--text);
  font-size: var(--text-sm);
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.chat-input::placeholder {
  color: var(--text-disabled);
}

.chat-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: var(--focus-ring);
}

.send-btn {
  padding: var(--space-3) var(--space-6);
}

.chat-actions-final {
  padding: var(--space-6);
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: center;
}

.full-width {
  width: 100%;
}

.pulse-btn {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(108, 92, 231, 0.4); }
  70% { transform: scale(1.02); box-shadow: 0 0 0 15px rgba(108, 92, 231, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(108, 92, 231, 0); }
}

/* Empty State */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-10);
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--space-4);
  opacity: 0.5;
}

.empty-state h3 {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-2);
}

.empty-state p {
  color: var(--text-muted);
  font-size: var(--text-sm);
  max-width: 300px;
  line-height: var(--leading-relaxed);
}
/* Technical Analysis Grid */
.technical-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 24px;
}

.tech-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.tech-card-title {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  color: var(--primary-light);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}

.tech-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tech-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.tech-item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tech-text {
  font-size: 14px;
  color: #fff;
  line-height: 1.4;
}

.tech-sub {
  font-size: 11px;
  color: var(--text-muted);
}

.tech-check {
  color: var(--success);
  font-weight: 800;
  font-size: 14px;
}

.severity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}

.severity-high { background: var(--danger); box-shadow: 0 0 10px var(--danger); }
.severity-medium { background: var(--warning); box-shadow: 0 0 10px var(--warning); }
.severity-low { background: var(--success); }

.analysis-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

/* Summary Actions */
.summary-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid var(--glass-border);
}

.action-divider {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  position: relative;
}

.summary-buttons {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 16px;
}

.btn-refine {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: var(--primary-light);
  font-size: 12px;
}

.btn-refine:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: var(--primary);
}

.btn-generate-direct {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: #fff;
  border: none;
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
}

.btn-generate-direct:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(139, 92, 246, 0.5);
}

.direct-actions {
  margin-top: auto;
  padding-top: 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
}
</style>
