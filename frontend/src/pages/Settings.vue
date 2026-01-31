<script setup>
import { ref, watch } from 'vue'

const settings = ref({
  clickup: {
    apiToken: '',
    workspaceId: '',
    connected: false
  },
  openai: {
    apiKey: '',
    model: 'gpt-4',
    connected: false
  },
  ghl: {
    webhookUrl: '',
    pipelineId: '',
    triggerStage: '',
    connected: false
  },
  general: {
    language: 'es',
    currency: 'USD',
    defaultTimezone: 'America/Argentina/Buenos_Aires'
  }
})

const models = [
  { value: 'gpt-5.2', label: 'GPT-5.2 (Más Reciente)' },
  { value: 'gpt-5', label: 'GPT-5' },
  { value: 'gpt-4.5-turbo', label: 'GPT-4.5 Turbo' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'claude-4-opus', label: 'Claude 4 Opus' },
  { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' }
]

const languages = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' }
]

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'ARS', label: 'ARS ($)' },
  { value: 'MXN', label: 'MXN ($)' }
]

const testing = ref({
  clickup: false,
  openai: false,
  ghl: false
})

const testErrors = ref({
  clickup: '',
  openai: '',
  ghl: ''
})

const API_BASE = 'http://localhost:3001'

const testConnection = async (service) => {
  testing.value[service] = true
  testErrors.value[service] = ''
  
  try {
    if (service === 'clickup') {
      // Backend uses .env token if none provided
      const res = await fetch(`${API_BASE}/api/clickup/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiToken: settings.value.clickup.apiToken || '' })
      })
      const data = await res.json()
      if (data.success) {
        settings.value.clickup.connected = true
        testErrors.value.clickup = `✓ Conectado como: ${data.user}`
      } else {
        testErrors.value.clickup = data.error || 'Error de conexión'
      }
    } else if (service === 'openai') {
      // Backend uses .env key if none provided
      const res = await fetch(`${API_BASE}/api/openai/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          apiKey: settings.value.openai.apiKey || '',
          model: settings.value.openai.model 
        })
      })
      const data = await res.json()
      if (data.success) {
        settings.value.openai.connected = true
        testErrors.value.openai = `✓ Modelo ${data.model} funcionando`
      } else {
        testErrors.value.openai = data.error || 'Error de conexión'
      }
    } else if (service === 'ghl') {
      // GHL just needs webhook URL configured
      settings.value.ghl.connected = true
    }
  } catch (error) {
    testErrors.value[service] = 'Backend no disponible. Inicia el servidor con: npm run dev (en /backend)'
  }
  
  testing.value[service] = false
}


// Load settings from localStorage on mount
const loadSettings = () => {
  const saved = localStorage.getItem('ghl-settings')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      settings.value = { ...settings.value, ...parsed }
    } catch (e) {
      console.error('Error loading settings:', e)
    }
  }
}
loadSettings()

// AUTO-SAVE: Watch for any change in settings and save immediately
watch(settings, (newVal) => {
  localStorage.setItem('ghl-settings', JSON.stringify(newVal))
}, { deep: true })

const saveSettings = () => {
  localStorage.setItem('ghl-settings', JSON.stringify(settings.value))
  alert('✅ Configuración guardada exitosamente!')
}

const webhookUrl = ref('http://localhost:3001/api/webhook/ghl')
</script>

<template>
  <div class="settings-page">
    <div class="settings-grid">
      <!-- ClickUp Integration -->
      <section class="settings-card">
        <div class="card-header">
          <div class="card-icon clickup">📋</div>
          <div class="card-info">
            <h2>ClickUp</h2>
            <p>Integración para crear proyectos automáticamente</p>
          </div>
          <span v-if="settings.clickup.connected" class="status-badge connected">
            ✓ Conectado
          </span>
        </div>
        
        <div class="card-content">
          <div class="form-group">
            <label>API Token</label>
            <div class="input-with-action">
              <input 
                v-model="settings.clickup.apiToken"
                type="password"
                class="input"
                placeholder="pk_xxxxxxxxxxxxxxxxx"
              />
              <a href="https://app.clickup.com/settings/apps" target="_blank" class="help-link">
                Obtener Token →
              </a>
            </div>
          </div>
          
          <div class="form-group">
            <label>Space ID (Donde se crearán los proyectos)</label>
            <input 
              v-model="settings.clickup.workspaceId"
              class="input"
              placeholder="90132832373"
            />
          </div>
          
          <button 
            class="btn btn-secondary test-btn"
            @click="testConnection('clickup')"
            :disabled="testing.clickup || !settings.clickup.apiToken"
          >
            {{ testing.clickup ? 'Probando...' : 'Probar Conexión' }}
          </button>
        </div>
      </section>

      <!-- OpenAI Integration -->
      <section class="settings-card">
        <div class="card-header">
          <div class="card-icon openai">🧠</div>
          <div class="card-info">
            <h2>OpenAI / LLM</h2>
            <p>Motor de IA para análisis de transcripciones</p>
          </div>
          <span v-if="settings.openai.connected" class="status-badge connected">
            ✓ Conectado
          </span>
        </div>
        
        <div class="card-content">
          <div class="form-group">
            <label>API Key</label>
            <div class="input-with-action">
              <input 
                v-model="settings.openai.apiKey"
                type="password"
                class="input"
                placeholder="sk-xxxxxxxxxxxxxxxxx"
              />
              <a href="https://platform.openai.com/api-keys" target="_blank" class="help-link">
                Obtener API Key →
              </a>
            </div>
          </div>
          
          <div class="form-group">
            <label>Modelo</label>
            <select v-model="settings.openai.model" class="input">
              <option v-for="model in models" :key="model.value" :value="model.value">
                {{ model.label }}
              </option>
            </select>
          </div>
          
          <button 
            class="btn btn-secondary test-btn"
            @click="testConnection('openai')"
            :disabled="testing.openai || !settings.openai.apiKey"
          >
            {{ testing.openai ? 'Probando...' : 'Probar Conexión' }}
          </button>
        </div>
      </section>

      <!-- GHL Webhook -->
      <section class="settings-card">
        <div class="card-header">
          <div class="card-icon ghl">🚀</div>
          <div class="card-info">
            <h2>Go High Level</h2>
            <p>Webhook para activación automática</p>
          </div>
          <span v-if="settings.ghl.connected" class="status-badge connected">
            ✓ Activo
          </span>
        </div>
        
        <div class="card-content">
          <div class="form-group">
            <label>URL del Webhook (copia esto en GHL)</label>
            <div class="webhook-url">
              <code>{{ webhookUrl }}</code>
              <button class="copy-btn" @click="navigator.clipboard.writeText(webhookUrl)">
                📋
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label>Pipeline ID</label>
            <input 
              v-model="settings.ghl.pipelineId"
              class="input"
              placeholder="ID del pipeline en GHL"
            />
          </div>
          
          <div class="form-group">
            <label>Etapa de Activación</label>
            <input 
              v-model="settings.ghl.triggerStage"
              class="input"
              placeholder="Ej: Propuesta Enviada"
            />
          </div>
          
          <div class="info-box">
            <span class="info-icon">💡</span>
            <p>Cuando un lead llegue a la etapa configurada, se activará automáticamente el análisis.</p>
          </div>
        </div>
      </section>

      <!-- General Settings -->
      <section class="settings-card">
        <div class="card-header">
          <div class="card-icon general">⚙️</div>
          <div class="card-info">
            <h2>General</h2>
            <p>Preferencias de la aplicación</p>
          </div>
        </div>
        
        <div class="card-content">
          <div class="form-group">
            <label>Idioma</label>
            <select v-model="settings.general.language" class="input">
              <option v-for="lang in languages" :key="lang.value" :value="lang.value">
                {{ lang.label }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Moneda por Defecto</label>
            <select v-model="settings.general.currency" class="input">
              <option v-for="curr in currencies" :key="curr.value" :value="curr.value">
                {{ curr.label }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Zona Horaria</label>
            <input 
              v-model="settings.general.defaultTimezone"
              class="input"
            />
          </div>
        </div>
      </section>
    </div>

    <!-- Save Button -->
    <div class="settings-footer">
      <button class="btn btn-primary save-btn" @click="saveSettings">
        💾 Guardar Configuración
      </button>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.settings-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.card-icon.clickup { background: linear-gradient(135deg, #7c3aed, #a855f7); }
.card-icon.openai { background: linear-gradient(135deg, #10a37f, #1a7f64); }
.card-icon.ghl { background: linear-gradient(135deg, #f59e0b, #d97706); }
.card-icon.general { background: linear-gradient(135deg, #6366f1, #8b5cf6); }

.card-info {
  flex: 1;
}

.card-info h2 {
  font-size: 16px;
  margin-bottom: 2px;
}

.card-info p {
  font-size: 13px;
  color: var(--text-muted);
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.connected {
  background: rgba(0, 184, 148, 0.15);
  color: var(--success);
}

.card-content {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  color: var(--text-muted);
}

.input-with-action {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.help-link {
  font-size: 12px;
  color: var(--primary-light);
  text-decoration: none;
}

.help-link:hover {
  text-decoration: underline;
}

.test-btn {
  align-self: flex-start;
}

.webhook-url {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
}

.webhook-url code {
  flex: 1;
  font-family: 'Consolas', monospace;
  font-size: 13px;
  color: var(--accent);
  word-break: break-all;
}

.copy-btn {
  background: var(--bg-hover);
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.copy-btn:hover {
  background: var(--primary);
}

.info-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(0, 217, 255, 0.1);
  border: 1px solid var(--accent);
  border-radius: 10px;
  padding: 14px;
}

.info-icon {
  font-size: 18px;
}

.info-box p {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}

.settings-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}

.save-btn {
  padding: 14px 32px;
  font-size: 15px;
}

@media (max-width: 1024px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
