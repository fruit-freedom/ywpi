import { create } from 'zustand'


interface Input {
    name: string;
    type: string;
}

interface Method {
    name: string;
    inputs: Input[];
}

interface Agent {
    id: string;
    name: string;
    methods: Method[];
}

interface AgentsState {
    agents: Agent[];
    addAgent: (instance: Agent) => void;
    removeAgent: (id: string) => void;
    setAgents: (instances: Agent[]) => void;
}

export const useAgents = create<AgentsState>((set) => ({
    agents: [],
    setAgents: (instances: Agent[]) => set((state: AgentsState) => ({ agents: [...instances] })),
    addAgent: (instance: Agent) => set((state: AgentsState) => ({ agents: [...state.agents, instance] })),
    removeAgent: (id: string) => set((state: AgentsState) => ({ agents: state.agents.filter(e => e.id !== id) })),
}))

