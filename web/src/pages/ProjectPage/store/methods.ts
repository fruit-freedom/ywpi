import { create } from 'zustand'
import { Method } from '../../../store/store';

export interface MethodWithAgentId extends Method {
    agentId: string;
}

export interface MethodsState {
    // Object tp -> list of avaliable methods
    methods: Map<string, MethodWithAgentId[]>;
    setMethods: (methods: Map<string, MethodWithAgentId[]>) => void;
}

export const useMethods = create<MethodsState>((set) => ({
    methods: new Map(),
    setMethods: (methods: Map<string, MethodWithAgentId[]>) => set((state: MethodsState) => {
        return { ...state, methods: methods };
    }),
}));
