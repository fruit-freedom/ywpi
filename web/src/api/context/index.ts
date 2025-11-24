export interface SourceTask {
    id: string;
    method: string;
}

export interface Relation {
    name: string;
    object_id: string;
    source_task?: SourceTask;
}

interface Label {
    name: string;
    value?: string;
    color?: string;
}

interface Subscribtion {
    agent_id: string;
    method_name: string;
}

export interface Context {
    id: string;
    tp: string;

    project_id?: string;
    subscribtions: Subscribtion[];
    labels?: Label[];
    name?: string;
    data: any;

    // relations: Relation[];
}

export const getContext = async (projectId: string, contextId: string): Promise<Context> => {
    const response = await fetch(`/api/projects/${projectId}/contexts/${contextId}`);
    if (!response.ok) {
        throw new Error();
    }

    return await response.json();
}

export const getContexts = async (projectId: string): Promise<Context[]> => {
    const response = await fetch(`/api/projects/${projectId}/contexts`);
    if (!response.ok) {
        throw new Error();
    }

    return await response.json();
}

export const createContext = (options: { projectId: string, tp: string, name: string }) => {
    return fetch(`/api/projects/${options.projectId}/contexts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tp: options.tp,
            name: options.name
        })
    })
    .then(e => e.json())
}

export const deleteContext = (options: { projectId: string, contextId: string }) => {
    return fetch(`/api/projects/${options.projectId}/contexts/${options.contextId}`, {
        method: 'DELETE'
    })
    .then(e => e.json());
}

export const updateContext = (options: { projectId: string, contextId: string, labels: Label[]}) => {
    return fetch(`/api/projects/${options.projectId}/contexts/${options.contextId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            labels: options.labels
        })
    })
    .then(e => e.json())
}
