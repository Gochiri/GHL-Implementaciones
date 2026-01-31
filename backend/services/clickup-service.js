import axios from 'axios';

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

export async function createClickUpProject(projectData, clickupConfig) {
    const { apiToken, spaceId } = clickupConfig;

    if (!apiToken || !spaceId) {
        throw new Error('ClickUp API token and Space ID are required');
    }

    console.log(`🔨 Creating project in ClickUp Space ID: ${spaceId}`);

    const headers = {
        'Authorization': apiToken,
        'Content-Type': 'application/json'
    };

    const results = {
        folder: null,
        lists: [],
        tasks: []
    };

    try {
        // 1. Create folder for the client
        let folderName = projectData.clientName;
        let folderResponse;

        try {
            folderResponse = await axios.post(
                `${CLICKUP_API_BASE}/space/${spaceId}/folder`,
                { name: folderName },
                { headers }
            );
        } catch (folderError) {
            if (folderError.response?.data?.err === 'Folder name taken') {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                folderName = `${projectData.clientName} (${timestamp})`;
                console.log(`⚠️ Folder name taken, retrying with: ${folderName}`);
                folderResponse = await axios.post(
                    `${CLICKUP_API_BASE}/space/${spaceId}/folder`,
                    { name: folderName },
                    { headers }
                );
            } else {
                throw folderError;
            }
        }
        results.folder = folderResponse.data;

        // 2. Create lists for each week/phase
        for (const week of projectData.weeks) {
            const listResponse = await axios.post(
                `${CLICKUP_API_BASE}/folder/${results.folder.id}/list`,
                {
                    name: week.name,
                    content: week.description || ''
                },
                { headers }
            );
            results.lists.push(listResponse.data);

            // 3. Create tasks for each week
            console.log(`📝 Creating ${week.tasks.length} tasks for list: ${week.name}`);
            for (const task of week.tasks) {
                let taskResponse;
                try {
                    // Map GHL Priority (1-3) to ClickUp (1-4)
                    // GHL 1 (Blocker) -> CU 1 (Urgent)
                    // GHL 2 (Med) -> CU 3 (Normal)
                    // GHL 3 (Low) -> CU 4 (Low)
                    const cuPriority = task.metadata?.priority_ghl === 1 ? 1 : (task.metadata?.priority_ghl === 2 ? 3 : 4);

                    const taskTags = task.tags || [];
                    if (task.metadata?.field_type) {
                        taskTags.push(task.metadata.field_type.toLowerCase());
                    }

                    taskResponse = await axios.post(
                        `${CLICKUP_API_BASE}/list/${listResponse.data.id}/task`,
                        {
                            name: task.name,
                            description: `${task.description || ''}\n\n--- TECHNICAL SOP ---\nType: ${task.metadata?.field_type || 'General'}\nGHL Implementation Priority: ${task.metadata?.priority_ghl || 'Standard'}`,
                            tags: taskTags,
                            time_estimate: task.estimatedHours ? task.estimatedHours * 3600000 : null, // ms
                            priority: cuPriority
                        },
                        { headers }
                    );
                    console.log(`✅ Task created: ${task.name}`);
                    results.tasks.push(taskResponse.data);
                } catch (taskError) {
                    console.error(`❌ Failed to create task: ${task.name}`, taskError.response?.data || taskError.message);
                    continue; // Skip subtasks if parent fails
                }

                // 4. Create subtasks if any
                if (task.subtasks && task.subtasks.length > 0 && taskResponse) {
                    for (const subtask of task.subtasks) {
                        try {
                            await axios.post(
                                `${CLICKUP_API_BASE}/list/${listResponse.data.id}/task`,
                                {
                                    name: subtask.name,
                                    parent: taskResponse.data.id,
                                    description: subtask.description || '',
                                    tags: subtask.tags || []
                                },
                                { headers }
                            );
                        } catch (subtaskError) {
                            console.error(`❌ Failed to create subtask: ${subtask.name}`);
                        }
                    }
                }
            }
        }

        // 5. Create technical documentation task if provided
        if (projectData.documentation && results.lists.length > 0) {
            console.log('📘 Creating technical documentation task...');
            try {
                const docTaskResponse = await axios.post(
                    `${CLICKUP_API_BASE}/list/${results.lists[0].id}/task`,
                    {
                        name: "📘 BLUEPRINT TÉCNICO GHL",
                        description: projectData.documentation,
                        tags: ["blueprint", "technical"],
                        priority: 1 // Urgent/High
                    },
                    { headers }
                );
                results.tasks.push(docTaskResponse.data);
                console.log('✅ Documentation task created.');
            } catch (docError) {
                console.error('❌ Failed to create documentation task:', docError.response?.data || docError.message);
            }
        }

        return {
            success: true,
            message: `Project "${folderName}" created successfully in ClickUp`,
            data: {
                ...results,
                tasks: results.tasks.map(t => ({
                    id: t.id,
                    name: t.name,
                    url: t.url,
                    status: t.status?.status
                }))
            }
        };

    } catch (error) {
        console.error('ClickUp API Error:', error.response?.data || error.message);
        throw new Error(`ClickUp API Error: ${error.response?.data?.err || error.message}`);
    }
}

export async function getSpaces(apiToken, teamId) {
    const headers = {
        'Authorization': apiToken,
        'Content-Type': 'application/json'
    };

    const response = await axios.get(
        `${CLICKUP_API_BASE}/team/${teamId}/space`,
        { headers }
    );

    return response.data.spaces;
}

export async function getTeams(apiToken) {
    const headers = {
        'Authorization': apiToken,
        'Content-Type': 'application/json'
    };

    const response = await axios.get(
        `${CLICKUP_API_BASE}/team`,
        { headers }
    );

    return response.data.teams;
}
export async function updateTaskStatus(taskId, status, apiToken) {
    const headers = {
        'Authorization': apiToken,
        'Content-Type': 'application/json'
    };

    const response = await axios.put(
        `${CLICKUP_API_BASE}/task/${taskId}`,
        { status },
        { headers }
    );

    return response.data;
}

export async function updateTaskCustomFields(taskId, customFields, apiToken) {
    const headers = {
        'Authorization': apiToken,
        'Content-Type': 'application/json'
    };

    // ClickUp requires individual calls or a specific format for custom fields
    // For simplicity, we'll assume the caller passes the field_id and value
    const results = [];
    for (const field of customFields) {
        const response = await axios.post(
            `${CLICKUP_API_BASE}/task/${taskId}/field/${field.id}`,
            { value: field.value },
            { headers }
        );
        results.push(response.data);
    }
    return results;
}
