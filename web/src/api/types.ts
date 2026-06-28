/**
 * @deprecated Use entities/agent/api
 */
export interface Type {
    name: string;
    args?: Type[];
}

/**
 * @deprecated Use entities/agent/api
 */
export interface Field {
    name: string;
    type: Type;
}

/**
 * @deprecated Use entities/agent/api
 */
export interface Label {
    name: string;
    value: string;
}

/**
 * @deprecated Use entities/agent/api
 */
export interface Method {
    name: string;
    description?: string;
    inputs: Field[];
    outputs: Field[];
    labels?: Label[];
}

/**
 * @deprecated Use entities/agent/api
 */
export enum AgentStatus {
    Connected = 'connected',
    Disconnected = 'disconnected',
}

/**
 * @deprecated Use entities/agent/api
 */
export interface Agent {
    id: string;
    name: string;
    project?: string;
    status: AgentStatus;
    description?: string;
    methods: Method[];
}

/**
 * @deprecated Use entities/agent/api
 */
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
