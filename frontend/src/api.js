// API Configuration
// Change this to your deployed backend URL in production

const isDev = import.meta.env.DEV;
export const API_BASE_URL = import.meta.env.VITE_API_URL || (isDev ? 'http://localhost:3001' : '');

export const api = {
    // Health check
    health: () => fetch(`${API_BASE_URL}/api/health`).then(r => r.json()),

    // --- PROJECT CRUD ---
    getProjects: () =>
        fetch(`${API_BASE_URL}/api/projects`).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error al obtener proyectos');

            // Sync with localStorage for consistency
            if (data && data.length > 0) {
                localStorage.setItem('projects', JSON.stringify(data));
            }
            return data;
        }).catch(err => {
            console.warn('API Error, falling back to localStorage:', err);
            const local = localStorage.getItem('projects');
            return local ? JSON.parse(local) : [];
        }),

    getProject: (id) =>
        fetch(`${API_BASE_URL}/api/projects/${id}`).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Proyecto no encontrado');
            return data;
        }).catch(err => {
            console.warn('API Error, falling back to localStorage for project:', id);
            const local = localStorage.getItem('projects');
            if (local) {
                const projects = JSON.parse(local);
                const project = projects.find(p => p.id === id);
                if (project) return project;
            }
            throw err;
        }),

    createProject: (projectData) =>
        fetch(`${API_BASE_URL}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error al crear proyecto');

            // Sync with localStorage
            const local = localStorage.getItem('projects');
            const projects = local ? JSON.parse(local) : [];
            const newProject = { ...projectData, id: data.id, createdAt: new Date().toISOString() };
            projects.unshift(newProject);
            localStorage.setItem('projects', JSON.stringify(projects));

            return data;
        }),

    updateProject: (id, projectData) =>
        fetch(`${API_BASE_URL}/api/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error al actualizar proyecto');

            // Sync with localStorage
            const local = localStorage.getItem('projects');
            if (local) {
                const projects = JSON.parse(local);
                const index = projects.findIndex(p => p.id === id);
                if (index !== -1) {
                    projects[index] = { ...projects[index], ...projectData, updatedAt: new Date().toISOString() };
                    localStorage.setItem('projects', JSON.stringify(projects));
                }
            }

            return data;
        }),

    deleteProject: (id) =>
        fetch(`${API_BASE_URL}/api/projects/${id}`, {
            method: 'DELETE'
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error al eliminar proyecto');

            // Sync with localStorage
            const local = localStorage.getItem('projects');
            if (local) {
                const projects = JSON.parse(local);
                const filtered = projects.filter(p => p.id !== id);
                localStorage.setItem('projects', JSON.stringify(filtered));
            }

            return data;
        }),

    // --- AI SERVICES ---

    // Helper to get API key from settings
    _getOpenAIKey: () => {
        try {
            const settings = JSON.parse(localStorage.getItem('ghl-settings') || '{}');
            return settings.openai?.apiKey || '';
        } catch (e) {
            return '';
        }
    },

    // Analyze transcript - now returns the project ID created in backend
    analyze: function (transcript) {
        return fetch(`${API_BASE_URL}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript, apiKey: this._getOpenAIKey() })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error analizando transcripción');

            // Sync with localStorage
            const local = localStorage.getItem('projects');
            const projects = local ? JSON.parse(local) : [];
            if (!projects.some(p => p.id === data.id)) {
                projects.unshift({ ...data, createdAt: new Date().toISOString() });
                localStorage.setItem('projects', JSON.stringify(projects));
            }

            return data;
        });
    },

    // Hormozi questioning
    hormozi: function (context, previousAnswers, projectId) {
        return fetch(`${API_BASE_URL}/api/hormozi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context, previousAnswers, projectId, apiKey: this._getOpenAIKey() })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error en el asistente');
            return data;
        });
    },

    // Generate project structure
    projectStructure: function (analysis, answers, projectId) {
        return fetch(`${API_BASE_URL}/api/project-structure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis, answers, projectId, apiKey: this._getOpenAIKey() })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error generando estructura de proyecto');
            return data;
        });
    },

    // Map GHL Scope (new - returns structured scope for cotizador)
    mapScope: function (analysis, projectId) {
        return fetch(`${API_BASE_URL}/api/map-scope`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis, projectId, apiKey: this._getOpenAIKey() })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error mapeando scope GHL');
            return data;
        });
    },

    // Generate quotation
    quotation: function (analysis, projectStructure, projectId, ghlScope = null) {
        return fetch(`${API_BASE_URL}/api/quotation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis, projectStructure, projectId, apiKey: this._getOpenAIKey(), ghlScope })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error generando cotización');
            return data;
        });
    },

    // Generate documentation (Local Approval)
    generateDocumentation: function (analysis, projectStructure, answers, projectId) {
        return fetch(`${API_BASE_URL}/api/project/document`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis, projectStructure, answers, projectId, apiKey: this._getOpenAIKey() })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error generando documentación');
            return data;
        });
    },

    // Approve Project: Generates documentation and exports to ClickUp (Legacy)
    approveProject: function (analysis, projectStructure, answers, clickupConfig, projectId) {
        return fetch(`${API_BASE_URL}/api/project/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis, projectStructure, answers, clickupConfig, projectId, apiKey: this._getOpenAIKey() })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error aprobando y exportando proyecto');
            return data;
        });
    },

    // --- UTILS ---

    uploadFile: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            body: formData
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error subiendo archivo');
            return data;
        });
    },

    testClickUp: (apiToken) =>
        fetch(`${API_BASE_URL}/api/clickup/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiToken })
        }).then(r => r.json()),

    testOpenAI: (apiKey, model) =>
        fetch(`${API_BASE_URL}/api/openai/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey, model })
        }).then(r => r.json()),

    getWebhooks: () => fetch(`${API_BASE_URL}/api/webhooks`).then(r => r.json()),

    createClickUpProject: (projectData, clickupConfig) =>
        fetch(`${API_BASE_URL}/api/clickup/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectData, clickupConfig })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error creando proyecto en ClickUp');
            return data;
        })
};
