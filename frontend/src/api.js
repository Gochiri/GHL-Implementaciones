// API Configuration
// Change this to your deployed backend URL in production

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = {
    // Health check
    health: () => fetch(`${API_BASE_URL}/api/health`).then(r => r.json()),

    // Analyze transcript
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

    // Upload and extract text from file
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

    // Hormozi questioning
    hormozi: (context, previousAnswers) =>
        fetch(`${API_BASE_URL}/api/hormozi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context, previousAnswers })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error en el asistente');
            return data;
        }),

    // Generate project structure
    projectStructure: (analysis, answers) =>
        fetch(`${API_BASE_URL}/api/project-structure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis, answers })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error generando estructura de proyecto');
            return data;
        }),

    // Generate quotation
    quotation: (analysis, projectStructure) =>
        fetch(`${API_BASE_URL}/api/quotation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis, projectStructure })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error generando cotización');
            return data;
        }),

    // Create ClickUp project
    createClickUpProject: (projectData, clickupConfig) =>
        fetch(`${API_BASE_URL}/api/clickup/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectData, clickupConfig })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error creando proyecto en ClickUp');
            return data;
        }),

    // Approve Project: Generates documentation and exports to ClickUp
    approveProject: (analysis, projectStructure, answers, clickupConfig) =>
        fetch(`${API_BASE_URL}/api/project/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analysis, projectStructure, answers, clickupConfig })
        }).then(async r => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Error aprobando y exportando proyecto');
            return data;
        }),

    // Test ClickUp connection
    testClickUp: (apiToken) =>
        fetch(`${API_BASE_URL}/api/clickup/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiToken })
        }).then(r => r.json()),

    // Test OpenAI connection
    testOpenAI: (apiKey, model) =>
        fetch(`${API_BASE_URL}/api/openai/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey, model })
        }).then(r => r.json()),

    // Get recent webhooks
    getWebhooks: () => fetch(`${API_BASE_URL}/api/webhooks`).then(r => r.json())
};
