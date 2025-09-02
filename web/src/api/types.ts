export interface Type {
    name: string;
    args?: Type[];
}

export interface Field {
    name: string;
    type: Type;
}

export interface Label {
    name: string;
    value: string;
}

export interface Method {
    name: string;
    description?: string;
    inputs: Field[];
    outputs: Field[];
    labels?: Label[];
}

export enum AgentStatus {
    Connected = 'connected',
    Disconnected = 'disconnected',
}

export interface Agent {
    id: string;
    name: string;
    project?: string;
    status: AgentStatus;
    description?: string;
    methods: Method[];
}

export interface Task {
    id: string;
    agent_id: string;
    method: string;
    status: string;
    inputs: {
        [key: string]: any
    };
    outputs?: {
        [key: string]: any
    };
}

export interface Context {
    id: string;
    project_id?: string;
    labels?: Label[];
    tp: string;
    data: any;
}
