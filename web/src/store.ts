import { create } from 'zustand'


export interface Input {
    name: string;
    type: string;
}

export interface Output {
    name: string;
    type: string;
    value: any;
}

export interface Task {
    id: string;
    status: string;
    method: string;
    inputs: any;
    outputs?: any;
}

export interface Method {
    name: string;
    inputs: Input[];
}

export interface Agent {
    id: string;
    name: string;
    methods: Method[];
    tasks: Task[];
}

export interface AgentsState {
    agents: Agent[];
    addAgent: (instance: Agent) => void;
    addTask: (agentId: string, instance: Task) => void;
    updateTaskStatus: (agentId: string, taskId: string, status: string) => void;
    updateTaskOutputs: (agentId: string, taskId: string, outputs: any) => void;
    removeAgent: (id: string) => void;
    setAgents: (instances: Agent[]) => void;
    activeAgentIndex: number | null;
    activeAgentMethodIndex: number | null;
    setActiveAgentIndex: (idx: number | null) => void;
    setActiveAgentMethodIndex: (idx: number | null) => void;
}

export const useAgents = create<AgentsState>((set) => ({
    agents: [],
    setAgents: (instances: Agent[]) => set((state: AgentsState) => (
        // { ...state, agents: [...instances], activeAgentIndex: null, activeAgentMethodIndex: null }
        { ...state, agents: [...instances], activeAgentIndex: 0, activeAgentMethodIndex: 0 }
    )),
    addAgent: (instance: Agent) => set((state: AgentsState) => ({ ...state, agents: [...state.agents, instance] })),

    addTask: (agentId: string, instance: Task) => set((state: AgentsState) => {
        const agents = [...state.agents];
        const updateIdx = agents.findIndex(e => e.id == agentId);
        agents[updateIdx] = { ...agents[updateIdx], tasks: [instance, ...agents[updateIdx].tasks] };
        return { ...state, agents };
    }),
    updateTaskStatus: (agentId: string, taskId: string, status: string) => set((state: AgentsState) => {
        const agents = [...state.agents];
        const updateAgentIdx = agents.findIndex(e => e.id == agentId);

        const tasks = [...agents[updateAgentIdx].tasks];
        const updateTaskIdx = tasks.findIndex(e => e.id == taskId);
        tasks[updateTaskIdx] = { ...tasks[updateTaskIdx], status };

        agents[updateAgentIdx] = { ...agents[updateAgentIdx], tasks: [...tasks] };
        return { ...state, agents };
    }),

    updateTaskOutputs: (agentId: string, taskId: string, outputs: any) => set((state: AgentsState) => {
        const agents = [...state.agents];
        const updateAgentIdx = agents.findIndex(e => e.id == agentId);

        const tasks = [...agents[updateAgentIdx].tasks];
        const updateTaskIdx = tasks.findIndex(e => e.id == taskId);
        tasks[updateTaskIdx] = { ...tasks[updateTaskIdx], outputs: { ...tasks[updateTaskIdx].outputs, ...outputs } };

        agents[updateAgentIdx] = { ...agents[updateAgentIdx], tasks: [...tasks] };
        return { ...state, agents };
    }),

    // If removed agent is active agent then set active to null
    removeAgent: (id: string) => set((state: AgentsState) => {
        const removeIdx = state.agents.findIndex(e => e.id === id);
        return {
            ...state,
            agents: state.agents.filter(e => e.id !== id),
            activeAgentIndex: (removeIdx !== state.activeAgentIndex ? state.activeAgentIndex : null),
            activeAgentMethodIndex: (removeIdx !== state.activeAgentIndex ? state.activeAgentMethodIndex : null),
        }
    }),

    activeAgentIndex: null,
    activeAgentMethodIndex: null,
    setActiveAgentIndex: (idx: number | null) => set((state: AgentsState) => ({ ...state, activeAgentIndex: idx })),
    setActiveAgentMethodIndex: (idx: number | null) => set((state: AgentsState) => ({ ...state, activeAgentMethodIndex: idx })),
}))

