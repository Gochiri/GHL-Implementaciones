// API Configuration
// Change this to your deployed backend URL in production

const isDev = import.meta.env.DEV;
export const API_BASE_URL = import.meta.env.VITE_API_URL || (isDev ? 'http://localhost:3001' : '');

export const api = {
    // Health check
    health: () => fetch(`${API_BASE_URL}/api/health`).then(r => r.json()),

    // --- PROJECT CRUD ---
    getProjects: () =>
        fetch(`${API_BASE_URL}/api/projects`).then(r => r.json()),

    getProject: (id) =>
        fetch(`${API_BASE_URL}/api/projects/${id}`).then(r => r.json()),

    createProject: (projectData) =>
        fetch(`${API_BASE_URL}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        }).then(r => r.json()),

    updateProject: (id, projectData) =>
        fetch(`${API_BASE_URL}/api/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        }).then(r => r.json()),

    deleteProject: (id) =>
        fetch(`${API_BASE_URL}/api/projects/${id}`, {
            method: 'DELETE'
        }).then(r => r.json()),

    // --- AI SERVICES ---

    // Analyze transcript - now returns the project ID created in backend
    analyze: (transcript) =>
        fetch(`${API_BASE_URL}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error analizando transcripción');
            return data;
        }),

    // Hormozi questioning
    hormozi: (context, previousAnswers, projectId) =>
        fetch(`${API_BASE_URL}/api/hormozi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context, previousAnswers, projectId })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error en el asistente');
            return data;
        }),

    // Generate project structure
    projectStructure: (analysis, answers, projectId) =>
        fetch(`${API_BASE_URL}/api/project-structure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis, answers, projectId })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error generando estructura de proyecto');
            return data;
        }),

    // Generate quotation
    quotation: (analysis, projectStructure, projectId) =>
        fetch(`${API_BASE_URL}/api/quotation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis, projectStructure, projectId })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error generando cotización');
            return data;
        }),

    // Approve Project: Generates documentation and exports to ClickUp
    approveProject: (analysis, projectStructure, answers, clickupConfig, projectId) =>
        fetch(`${API_BASE_URL}/api/project/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis, projectStructure, answers, clickupConfig, projectId })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error aprobando y exportando proyecto');
            return data;
        }),

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

    getWebhooks: () => fetch(`${API_BASE_URL}/api/webhooks`).then(r => r.json())
};
