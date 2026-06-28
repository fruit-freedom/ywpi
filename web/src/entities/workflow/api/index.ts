import { Paginated } from "../../../shared/api";
import { type Edge, type Node } from '@xyflow/react';

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    projectId: string;
    nodes: Node[];
    edges: Edge[];
}

export const getWorkflow = async (workflowId: string): Promise<Workflow> => {
    const response = await fetch(`/api/workflows/${workflowId}`);
    if (!response.ok) {
        throw new Error();
    }

    return await response.json();
}

export const getWorkflows = async (): Promise<Paginated<Workflow>> => {
    const response = await fetch(`/api/workflows`);
    if (!response.ok) {
        throw new Error();
    }

    return await response.json();
}

export const createWorkflow = (payload: Partial<Workflow>) => {
    return fetch(`/api/workflows`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(e => e.json())
}

export const deleteWorkflow = (workflowId: string) => {
    return fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE'
    })
    .then(e => e.json());
}

export const updateWorkflow = (workflowId: string, payload: Partial<Workflow>) => {
    return fetch(`/api/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(e => e.json())
}
