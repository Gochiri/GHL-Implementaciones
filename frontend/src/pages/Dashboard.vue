<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from '../api.js'
import { PROJECT_STATUSES, getStatusLabel, getStatusColor, healProjectStatus } from '../utils/status-utils.js'

const stats = ref([
  { label: 'Propuestas Este Mes', value: '12', icon: '📄', trend: '+23%', color: 'primary' },
  { label: 'Leads Analizados', value: '34', icon: '🎯', trend: '+15%', color: 'accent' },
  { label: 'Proyectos Activos', value: '8', icon: '📋', trend: '+5%', color: 'success' },
  { label: 'Tasa de Cierre', value: '67%', icon: '✅', trend: '+8%', color: 'warning' }
])

const ghlLeads = ref([])
const recentAnalyses = ref([])


const searchQuery = ref('')
const filteredAnalyses = computed(() => {
  if (!searchQuery.value) return recentAnalyses.value
  const query = searchQuery.value.toLowerCase()
  return recentAnalyses.value.filter(a => 
    a.client?.toLowerCase().includes(query) || 
    (a.name?.toLowerCase().includes(query)) ||
    (a.status?.toLowerCase().includes(query))
  )
})


const activityFeed = ref([])

onMounted(async () => {
  try {
    const webhooks = await api.getWebhooks()
    ghlLeads.value = webhooks
    
    // Load real projects and proposals
    const savedProjects = localStorage.getItem('projects')
    if (savedProjects) {
      let rawProjects = JSON.parse(savedProjects)
      let needsSave = false
      
      recentAnalyses.value = rawProjects.map(p => {
        const { healedProject, wasHealed } = healProjectStatus(p)
        if (wasHealed) needsSave = true
        return healedProject
      }).slice(0, 5) // Most recent 5

      if (needsSave) {
        localStorage.setItem('projects', JSON.stringify(rawProjects))
      }

      // Calculate real stats
      const totalAnalyses = rawProjects.length
      const activeProjects = rawProjects.filter(p => p.status === 'created' || p.status === 'proposal').length
      const completedProjects = rawProjects.filter(p => p.status === 'completed').length
      const proposalProjects = rawProjects.filter(p => p.status === 'proposal').length
      
      stats.value[0].value = proposalProjects.toString()
      stats.value[1].value = totalAnalyses.toString()
      stats.value[2].value = activeProjects.toString()
      if (totalAnalyses > 0) {
        const rate = Math.round((completedProjects / totalAnalyses) * 100)
        stats.value[3].value = rate + '%'
      } else {
        stats.value[3].value = '0%'
      }
      
      // Generate some dynamic activity from projects
      activityFeed.value = rawProjects.slice(0, 3).map((p, i) => ({
        id: i,
        type: 'status',
        user: 'Sistema',
        project: p.name,
        action: `actualizado a estado "${getStatusLabel(p.status)}"`,
        time: 'Reciente'
      }))
    } else {
      // Empty state stats
      stats.value.forEach(s => s.value = '0')
      stats.value[3].value = '0%'
    }
  } catch (error) {
    console.error('Error fetching data:', error)
  }
})

const getProjectPath = (analysis) => {
  return `/project/${analysis.id}`
}

const getProposalPath = (analysis) => {
  return `/proposal/${analysis.id}`
}
</script>

<template>
  <div class="dashboard">
    <!-- Stats Grid -->
    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card" :class="stat.color">
        <div class="stat-icon">{{ stat.icon }}</div>
        <div class="stat-info">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
        <span class="stat-trend">{{ stat.trend }}</span>
      </div>
    </div>

    <div class="main-layout-grid">
      <!-- Incoming Leads from GHL -->
      <section v-if="ghlLeads.length > 0" class="section leads-section">
        <div class="section-badge pulse">Real-time GHL Webhooks</div>
        <h2 class="section-title">Nuevos Leads (GHL)</h2>
        <div class="leads-feed">
          <div v-for="lead in ghlLeads" :key="lead.id" class="lead-card">
            <div class="lead-header">
              <span class="lead-avatar">{{ lead.contact.name.charAt(0) }}</span>
              <div class="lead-info">
                <span class="lead-name">{{ lead.contact.name }}</span>
                <span class="lead-email">{{ lead.contact.email || 'Sin email' }}</span>
              </div>
            </div>
            <div class="lead-meta">
              <span class="meta-item">📍 {{ lead.stage }}</span>
              <span class="meta-item">🕒 {{ new Date(lead.receivedAt).toLocaleTimeString() }}</span>
            </div>
            <router-link :to="{ path: '/analyzer', query: { leadId: lead.id } }" class="btn btn-primary btn-sm btn-full">
              Iniciar Análisis
            </router-link>
          </div>
        </div>
      </section>

      <!-- Activity Feed -->
      <section class="section activity-section">
        <h2 class="section-title">Actividad Reciente</h2>
        <div class="activity-card table-card">
          <div v-if="activityFeed.length === 0" class="empty-activity">
            <span class="empty-icon">🔔</span>
            <p>No hay actividad registrada.</p>
          </div>
          <div v-for="act in activityFeed" :key="act.id" class="activity-item">
            <div class="activity-marker" :class="act.type"></div>
            <div class="activity-content">
              <p><strong>{{ act.user }}</strong> {{ act.action }}</p>
              <span class="activity-project">{{ act.project }} • {{ act.time }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Quick Actions -->
    <section class="section">
      <h2 class="section-title">Acciones Rápidas</h2>
      <div class="quick-actions">
        <router-link to="/analyzer" class="action-card">
          <span class="action-icon">🎯</span>
          <span class="action-title">Nueva Transcripción</span>
          <span class="action-desc">Analizar llamada con cliente</span>
        </router-link>
        <router-link to="/project" class="action-card">
          <span class="action-icon">📋</span>
          <span class="action-title">Crear Proyecto</span>
          <span class="action-desc">Generar estructura en ClickUp</span>
        </router-link>
        <router-link to="/proposal" class="action-card">
          <span class="action-icon">📄</span>
          <span class="action-title">Nueva Propuesta</span>
          <span class="action-desc">Generar propuesta HTML</span>
        </router-link>
      </div>
    </section>

    <!-- Recent Analyses -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Análisis Recientes</h2>
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Buscar por cliente o estado..." 
            class="premium-input search-input"
          />
        </div>
      </div>
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Complejidad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredAnalyses.length === 0">
              <td colspan="5" class="empty-table-cell">
                <div class="empty-state-content">
                  <p>No hay análisis técnicos registrados aún.</p>
                  <router-link to="/analyzer" class="btn btn-primary btn-sm">Iniciar Primer Análisis</router-link>
                </div>
              </td>
            </tr>
            <tr v-for="analysis in filteredAnalyses" :key="analysis.id">
              <td class="client-name">{{ analysis.name || analysis.client }}</td>
              <td>{{ analysis.date }}</td>
              <td>
                <div class="complexity-bar">
                  <div class="complexity-fill" :style="{ width: analysis.complexity * 10 + '%' }"></div>
                  <span class="complexity-value">{{ analysis.complexity }}/10</span>
                </div>
              </td>
              <td>
                <span class="status-badge" :class="getStatusColor(analysis.status)">
                  {{ getStatusLabel(analysis.status) }}
                </span>
              </td>
              <td>
                <router-link :to="getProjectPath(analysis)" class="btn-icon" title="Ver detalles">👁️</router-link>
                <router-link :to="getProposalPath(analysis)" class="btn-icon" title="Ver propuesta">📄</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-5);
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  position: relative;
  overflow: hidden;
  transition: transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  border-color: var(--border-light);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.stat-card.primary::before { background: linear-gradient(90deg, var(--primary), var(--primary-light)); }
.stat-card.accent::before { background: linear-gradient(90deg, var(--accent), #00b8d4); }
.stat-card.success::before { background: linear-gradient(90deg, var(--success), #55efc4); }
.stat-card.warning::before { background: linear-gradient(90deg, var(--warning), #ffeaa7); }

.stat-icon {
  font-size: var(--text-4xl);
  min-width: 50px;
  text-align: center;
}

.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.stat-value {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.stat-trend {
  background: rgba(0, 184, 148, 0.15);
  color: var(--success);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

/* Sections */
.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  width: 300px;
  background: rgba(255, 255, 255, 0.03) !important;
}

.section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text);
}

.section-badge {
  display: inline-block;
  font-size: 10px;
  background: var(--primary);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
  margin-bottom: -10px;
  font-weight: 700;
  text-transform: uppercase;
}
.section-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

/* GHL Leads Feed */
.leads-feed {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.lead-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.lead-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--primary);
  transform: scale(1.02);
}

.lead-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.lead-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 20px;
}

.lead-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 17px;
  color: #fff;
}

.lead-email {
  font-size: 13px;
  color: var(--text-muted);
}

.lead-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  background: rgba(0, 0, 0, 0.2);
  padding: 10px 16px;
  border-radius: 10px;
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.action-card {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s;
}

.action-card:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(6, 182, 212, 0.1);
}

.action-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.action-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  color: #fff;
}

.action-desc {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
}

/* Table Design */
.table-card {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: rgba(255, 255, 255, 0.02);
  padding: 20px 24px;
  text-align: left;
  font-family: var(--font-display);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--glass-border);
}

.data-table td {
  padding: 20px 24px;
  font-size: 14px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--glass-border);
}

.data-table tr:last-child td {
  border-bottom: none;
}

@media (max-width: 1200px) {
  .main-layout-grid {
    grid-template-columns: 1fr;
  }
}

.activity-item {
  padding: 16px 24px;
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-marker {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
}

.activity-marker.status { background: var(--primary); box-shadow: 0 0 10px var(--primary); }
.activity-marker.sync { background: var(--success); box-shadow: 0 0 10px var(--success); }
.activity-marker.creation { background: var(--warning); box-shadow: 0 0 10px var(--warning); }

.activity-content p {
  font-size: 13px;
  margin: 0;
  color: #fff;
}

.activity-project {
  font-size: 11px;
  color: var(--text-muted);
}

.status-badge {
  padding: 6px 12px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
}

.status-badge.primary { background: rgba(139, 92, 246, 0.15); color: var(--primary-light); }
.status-badge.warning { background: rgba(245, 158, 11, 0.15); color: var(--warning); }
.status-badge.info { background: rgba(59, 130, 246, 0.15); color: var(--info); }
.status-badge.success { background: rgba(16, 185, 129, 0.15); color: var(--success); }

.empty-table-cell {
  padding: 60px !important;
  text-align: center;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--text-muted);
}

.empty-activity {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-activity .empty-icon {
  font-size: 24px;
  opacity: 0.5;
}
</style>
