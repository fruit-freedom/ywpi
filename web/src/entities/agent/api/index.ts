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
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
}

export interface Agent {
    id: string;
    name: string;
    project?: string;
    status: AgentStatus;
    description?: string;
    methods: Method[];
}

export interface MethodWithAgentId extends Method {
    agentId: string;
    status: AgentStatus;
}
