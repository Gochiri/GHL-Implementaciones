import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'

// Pages
import Dashboard from './pages/Dashboard.vue'
import TranscriptAnalyzer from './pages/TranscriptAnalyzer.vue'
import ProjectBuilder from './pages/ProjectBuilder.vue'
import KanbanBoard from './pages/KanbanBoard.vue'
import ProposalGenerator from './pages/ProposalGenerator.vue'
import Projects from './pages/Projects.vue'
import Settings from './pages/Settings.vue'

const routes = [
    { path: '/', component: Dashboard, meta: { title: 'Dashboard' } },
    { path: '/kanban', component: KanbanBoard, meta: { title: 'Tareas' } },
    { path: '/analyzer', component: TranscriptAnalyzer, meta: { title: 'Analizador' } },
    { path: '/projects', component: Projects, meta: { title: 'Gestión de Proyectos' } },
    { path: '/project/:id?', component: ProjectBuilder, meta: { title: 'Proyecto' } },
    { path: '/proposal/:id?', component: ProposalGenerator, meta: { title: 'Propuesta' } },
    { path: '/settings', component: Settings, meta: { title: 'Configuración' } }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

createApp(App).use(router).mount('#app')
