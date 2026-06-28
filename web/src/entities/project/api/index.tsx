export interface Project {
    id: string;
    name: string;
    description?: string;
}

export const getProject = async (projectId: string): Promise<Project> => {
    const response = await fetch(`/api/projects/${projectId}`);
    if (!response.ok) {
        throw new Error();
    }

    return await response.json();
}

export const getProjects = async (): Promise<Project[]> => {
    const response = await fetch(`/api/projects`);
    if (!response.ok) {
        throw new Error();
    }

    return await response.json();
}

export const createProject = (payload: Partial<Project>) => {
    return fetch(`/api/projects`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(e => e.json())
}

export const deleteProject = (projectId: string) => {
    return fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
    })
    .then(e => e.json());
}

export const updateProject = (projectId: string, payload: Partial<Project>) => {
    return fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(e => e.json())
}