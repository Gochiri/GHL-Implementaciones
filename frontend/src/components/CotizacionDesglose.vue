<script setup>
import { computed } from 'vue'

const props = defineProps({
  clientName: { type: String, default: 'Cliente' },
  lineaProducto: { type: String, default: '' },
  fecha: { type: String, default: '' },
  scope: { type: Object, default: () => ({}) },
  cotizacion: { type: Object, default: () => ({}) },
  nota: { type: String, default: '' }
})

// Computed data for display
const displayDate = computed(() => {
  if (props.fecha) return props.fecha
  const now = new Date()
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${now.getDate().toString().padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()}`
})

// Scope summary from analysis or cotizacion
const scopeItems = computed(() => {
  const s = props.scope || {}
  const items = []
  
  // Pipeline info
  if (s.pipelines?.length) {
    const totalEtapas = s.pipelines.reduce((t, p) => t + (p.etapas || 0), 0)
    items.push({ label: 'Pipeline', value: `${s.pipelines.length} · ${totalEtapas} etapas` })
  }
  
  // Workflows
  if (s.workflows?.length) {
    const ls = s.workflows.filter(w => w.nombre?.startsWith('LS')).length
    const sp = s.workflows.filter(w => w.nombre?.startsWith('SP')).length
    const ap = s.workflows.filter(w => w.nombre?.startsWith('AP')).length
    items.push({ label: 'Workflows', value: `${s.workflows.length} (${ls} LS, ${sp} SP, ${ap} AP)` })
  }
  
  // Chatbot
  if (s.chatbots?.length) {
    const hasIA = s.chatbots.some(c => c.ia_avanzada)
    items.push({ label: 'Chatbot', value: `${s.chatbots.length} · ${hasIA ? 'IA avanzada' : 'Básico'}` })
  }
  
  // Integrations
  if (s.integraciones) {
    items.push({ label: 'Integraciones', value: `${s.integraciones} (WA API + UTM)` })
  }
  
  // Landing
  if (s.landing_pages?.length) {
    const totalSec = s.landing_pages.reduce((t, p) => t + (p.secciones || 0), 0)
    items.push({ label: 'Landing Page', value: `${s.landing_pages.length} · ${totalSec} secciones` })
  }
  
  // Reports
  if (s.reportes) {
    items.push({ label: 'Reportes', value: 'Dashboard atribución' })
  }
  
  // Setup
  if (s.setup_subcuenta) {
    items.push({ label: 'Setup Subcuenta', value: s.setup_subcuenta === 'completo' ? 'Completo' : 'Validación' })
  }
  
  // Soporte
  if (s.soporte) {
    items.push({ label: 'Soporte', value: 'Post-implementación' })
  }
  
  return items
})

// Workflows detail list with node count
const workflowsList = computed(() => {
  const s = props.scope || {}
  return (s.workflows || []).map(w => ({
    code: w.nombre?.substring(0, 4) || '??',
    name: w.nombre || 'Workflow',
    nodos: w.nodos || 0
  }))
})

// Desglose from cotizacion
const desglose = computed(() => {
  return props.cotizacion?.a_la_carte?.desglose || []
})

// Totals
const setupTotal = computed(() => {
  return props.cotizacion?.a_la_carte?.setup || 0
})

const mensualTotal = computed(() => {
  return props.cotizacion?.a_la_carte?.mensual || 0
})

// Packages comparison
const packages = computed(() => {
  const todos = props.cotizacion?.todos_paquetes || []
  return todos.map(p => ({
    name: p.paquete,
    setup: p.setup_total || 0,
    mensual: p.mensual_total || 0,
    ahorroPrimerAno: p.ahorro_total_primer_año || 0
  }))
})

// Recomendación
const recomendacion = computed(() => {
  const mejor = props.cotizacion?.mejor_paquete
  if (!mejor) {
    return {
      titulo: 'À la carte',
      razon: 'Ningún paquete genera ahorro significativo. La opción à la carte es más eficiente para este scope.'
    }
  }
  return {
    titulo: mejor.paquete,
    razon: `Ahorro de $${mejor.ahorro_total_primer_año || 0} en el primer año respecto a à la carte.`
  }
})
</script>

<template>
  <div class="cotizacion-container">
    <!-- Header -->
    <div class="cotizacion-header">
      <span class="header-badge">COTIZACIÓN GHL · PILOTO</span>
      <h1 class="client-title">{{ clientName }}</h1>
      <p class="meta-line">
        <span v-if="lineaProducto">Línea de producto: {{ lineaProducto }}</span>
        <span v-if="lineaProducto && displayDate"> · </span>
        <span>Fecha: {{ displayDate }}</span>
      </p>
    </div>

    <!-- Scope Section -->
    <section class="section" v-if="scopeItems.length > 0">
      <div class="section-header">
        <h2>Scope Extraído del Mapeo</h2>
        <span class="badge-mono">GHL-ONBOARDING-MAPPER</span>
      </div>
      
      <div class="scope-grid">
        <div v-for="(item, i) in scopeItems" :key="i" class="scope-item">
          <span class="scope-label">{{ item.label }}</span>
          <span class="scope-value">{{ item.value }}</span>
        </div>
      </div>
      
      <!-- Workflows detail list -->
      <div v-if="workflowsList.length > 0" class="workflows-list">
        <div v-for="wf in workflowsList" :key="wf.name" class="workflow-item">
          <span class="wf-code" :class="wf.code.substring(0,2).toLowerCase()">{{ wf.code }}</span>
          <span class="wf-name">{{ wf.name }}</span>
          <span class="wf-nodos">{{ wf.nodos }} nodos</span>
        </div>
      </div>
    </section>

    <!-- Cotización Interna (Desglose) -->
    <section class="section" v-if="desglose.length > 0">
      <div class="section-header">
        <h2>Cotización Interna</h2>
        <span class="badge-mono">GHL-COTIZADOR · À LA CARTE</span>
      </div>

      <div class="desglose-modules">
        <div v-for="(mod, i) in desglose" :key="i" class="module-card">
          <div class="module-header">
            <h3 class="module-title">{{ mod.modulo }}</h3>
            <div class="module-prices">
              <div class="price-col" v-if="mod.setup > 0">
                <span class="price-label">SETUP</span>
                <span class="price-value">${{ mod.setup.toLocaleString() }}</span>
              </div>
              <div class="price-col mensual" v-if="mod.mensual > 0">
                <span class="price-label">MENSUAL</span>
                <span class="price-value">${{ mod.mensual.toLocaleString() }}</span>
              </div>
            </div>
          </div>
          
          <div class="module-details" v-if="mod.detalle && mod.detalle.length > 0">
            <div v-for="(det, j) in mod.detalle" :key="j" class="detail-line">
              <span class="detail-arrow">→</span>
              <span>{{ det }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Totals Summary -->
    <section class="section totals-section">
      <div class="totals-grid">
        <div class="total-box primary">
          <span class="total-label">SETUP TOTAL (ONE-TIME)</span>
          <span class="total-value">${{ setupTotal.toLocaleString() }}</span>
          <span class="total-note">incluyendo subcuenta $250</span>
        </div>
        <div class="total-box">
          <span class="total-label">CUOTA MENSUAL</span>
          <span class="total-value">${{ mensualTotal.toLocaleString() }}</span>
          <span class="total-note">chatbot + integraciones + reportes + soporte</span>
        </div>
      </div>
    </section>

    <!-- Comparación de Paquetes -->
    <section class="section" v-if="packages.length > 0">
      <div class="section-header">
        <h2>Comparación de Paquetes</h2>
        <span class="badge-mono">VS À LA CARTE</span>
      </div>
      
      <div class="packages-grid">
        <div v-for="pkg in packages" :key="pkg.name" class="package-card" :class="{ recommended: recomendacion.titulo === pkg.name }">
          <h3 class="pkg-name">{{ pkg.name }}</h3>
          <div class="pkg-setup">
            <span class="pkg-price">${{ pkg.setup.toLocaleString() }}</span>
            <span class="pkg-label">setup</span>
          </div>
          <div class="pkg-mensual">
            ${{ pkg.mensual.toLocaleString() }} / mes
          </div>
          <div class="pkg-ahorro" v-if="pkg.ahorroPrimerAno !== 0" :class="{ negative: pkg.ahorroPrimerAno < 0 }">
            {{ pkg.ahorroPrimerAno > 0 ? '-' : '+' }}${{ Math.abs(pkg.ahorroPrimerAno).toLocaleString() }} primer año
          </div>
        </div>
      </div>
    </section>

    <!-- Recomendación -->
    <section class="section recomendacion-section">
      <div class="recomendacion-box">
        <span class="rec-icon">✓</span>
        <div class="rec-content">
          <h4>Recomendación: {{ recomendacion.titulo }}</h4>
          <p>{{ recomendacion.razon }}</p>
        </div>
      </div>
    </section>

    <!-- Nota opcional -->
    <section class="section" v-if="nota">
      <div class="nota-box">
        <strong>Nota para {{ clientName }} (desde la llamada):</strong>
        <p>{{ nota }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.cotizacion-container {
  background: linear-gradient(180deg, #0f0f14 0%, #15151c 100%);
  border-radius: 20px;
  padding: 40px;
  color: #fff;
  font-family: 'Inter', 'SF Pro Display', system-ui, sans-serif;
  max-width: 900px;
  margin: 0 auto;
}

/* Header */
.cotizacion-header {
  text-align: center;
  margin-bottom: 48px;
  padding-bottom: 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 8px 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 20px;
}

.client-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 42px;
  font-weight: 600;
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
}

.meta-line {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.02em;
}

/* Sections */
.section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.section-header h2 {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 20px;
  font-weight: 500;
  margin: 0;
  letter-spacing: -0.01em;
}

.badge-mono {
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

/* Scope Grid */
.scope-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.scope-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px 20px;
}

.scope-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.scope-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 500;
  color: #c8ff00;
}

/* Workflows List */
.workflows-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.workflow-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.workflow-item:last-child {
  border-bottom: none;
}

.wf-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.wf-code.ls { background: rgba(100, 200, 255, 0.2); color: #64c8ff; }
.wf-code.sp { background: rgba(200, 255, 0, 0.15); color: #c8ff00; }
.wf-code.ap { background: rgba(255, 100, 200, 0.2); color: #ff64c8; }

.wf-name {
  flex: 1;
  font-size: 13px;
  font-family: 'JetBrains Mono', monospace;
  color: rgba(255, 255, 255, 0.85);
}

.wf-nodos {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* Module Cards (Desglose) */
.desglose-modules {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.module-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 24px;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.module-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #fff;
}

.module-prices {
  display: flex;
  gap: 24px;
}

.price-col {
  text-align: right;
}

.price-label {
  display: block;
  font-size: 9px;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 4px;
  text-transform: uppercase;
}

.price-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 18px;
  font-weight: 700;
  color: #c8ff00;
}

.price-col.mensual .price-value {
  color: #64c8ff;
}

.module-details {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 12px;
}

.detail-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  padding: 4px 0;
}

.detail-arrow {
  color: #c8ff00;
}

/* Totals */
.totals-section {
  padding: 32px 0;
}

.totals-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.total-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
}

.total-box.primary {
  background: rgba(200, 255, 0, 0.05);
  border-color: rgba(200, 255, 0, 0.2);
}

.total-label {
  display: block;
  font-size: 10px;
  letter-spacing: 0.15em;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 12px;
  text-transform: uppercase;
}

.total-value {
  display: block;
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 48px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.total-note {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

/* Packages Grid */
.packages-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.package-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 28px 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.package-card.recommended {
  background: rgba(200, 255, 0, 0.05);
  border-color: rgba(200, 255, 0, 0.3);
}

.pkg-name {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 16px 0;
}

.pkg-setup {
  margin-bottom: 8px;
}

.pkg-price {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 28px;
  font-weight: 600;
}

.pkg-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-left: 4px;
}

.pkg-mensual {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 12px;
}

.pkg-ahorro {
  display: inline-block;
  background: rgba(200, 255, 0, 0.15);
  color: #c8ff00;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 20px;
}

.pkg-ahorro.negative {
  background: rgba(255, 100, 100, 0.15);
  color: #ff6464;
}

/* Recomendación */
.recomendacion-section {
  margin-top: 32px;
}

.recomendacion-box {
  display: flex;
  gap: 16px;
  background: rgba(200, 255, 0, 0.06);
  border: 1px solid rgba(200, 255, 0, 0.2);
  border-radius: 16px;
  padding: 24px;
}

.rec-icon {
  width: 32px;
  height: 32px;
  background: rgba(200, 255, 0, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #c8ff00;
  flex-shrink: 0;
}

.rec-content h4 {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.rec-content p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  line-height: 1.6;
}

/* Nota */
.nota-box {
  background: rgba(100, 150, 255, 0.08);
  border: 1px solid rgba(100, 150, 255, 0.2);
  border-radius: 12px;
  padding: 24px;
  font-size: 13px;
  line-height: 1.7;
}

.nota-box strong {
  display: block;
  color: #64c8ff;
  margin-bottom: 8px;
}

.nota-box p {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
}

/* Responsive */
@media (max-width: 768px) {
  .cotizacion-container {
    padding: 24px;
  }
  
  .client-title {
    font-size: 28px;
  }
  
  .scope-grid,
  .totals-grid,
  .packages-grid {
    grid-template-columns: 1fr;
  }
  
  .total-value {
    font-size: 36px;
  }
}
</style>
