import { create } from 'zustand'


export interface Input {
    name: string;
    type: string;
}

export interface Method {
    name: string;
    inputs: Input[];
}

export interface Agent {
    id: string;
    name: string;
    methods: Method[];
}


export interface AgentsState {
    agents: Agent[];
    addAgent: (instance: Agent) => void;
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
        { ...state, agents: [...instances], activeAgentIndex: null, activeAgentMethodIndex: null }
    )),
    addAgent: (instance: Agent) => set((state: AgentsState) => ({ ...state, agents: [...state.agents, instance] })),

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

