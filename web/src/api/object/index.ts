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

export interface Object {
    id: string;
    tp: string;
    project_id?: string;
    relations: Relation[];
    labels: Label[];
    data: any;
}

export const getObject = async (objectId: string): Promise<Object> => {
    const response = await fetch(`/api/objects/${objectId}`);
    return await response.json();
}

export interface RelatedObject {
    relation_name: string;
    object: Object;
    source_task?: SourceTask;
}

export const getRelatedObjects = async (objectId: string): Promise<RelatedObject[]> => {
    const response = await fetch(`/api/objects/${objectId}/related`);
    return await response.json();
}

export const createObject = async (type: string, data: any): Promise<Object> => {
    
}
