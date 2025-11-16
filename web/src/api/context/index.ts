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
