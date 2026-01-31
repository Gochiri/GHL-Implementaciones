export const PROJECT_STATUSES = [
    { id: 'analysis', label: 'En Análisis', color: 'info', class: 'status-analysis' },
    { id: 'created', label: 'Estructura Creada', color: 'primary', class: 'status-created' },
    { id: 'proposal', label: 'Propuesta Enviada', color: 'warning', class: 'status-proposal' },
    { id: 'completed', label: 'Completado', color: 'success', class: 'status-completed' }
];

export const getStatusLabel = (id) => PROJECT_STATUSES.find(s => s.id === id)?.label || 'Pendiente';
export const getStatusClass = (id) => PROJECT_STATUSES.find(s => s.id === id)?.class || '';
export const getStatusColor = (id) => PROJECT_STATUSES.find(s => s.id === id)?.color || 'secondary';

/**
 * Heals project status based on current content and legacy keys.
 * Returns { project, wasHealed }
 */
export const healProjectStatus = (project) => {
    let updatedStatus = project.status;
    let wasHealed = false;

    // Handle legacy 'en_analisis' key
    if (updatedStatus === 'en_analisis') {
        updatedStatus = 'analysis';
        wasHealed = true;
    }

    // Heal status based on content: if it has weeks/tasks but is in 'analysis', it's 'created'
    const hasStructure = (project.weeks && project.weeks.length > 0) || (project.tasks && project.tasks.length > 0);
    if (updatedStatus === 'analysis' && hasStructure) {
        updatedStatus = 'created';
        wasHealed = true;
    }

    // Default to 'analysis' if no status
    if (!updatedStatus) {
        updatedStatus = 'analysis';
        wasHealed = true;
    }

    if (wasHealed) {
        return {
            healedProject: { ...project, status: updatedStatus },
            wasHealed: true
        };
    }

    return { healedProject: project, wasHealed: false };
};
