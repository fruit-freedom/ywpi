import { create } from 'zustand'
import { MethodWithAgent } from '../../external/contexts/Markdown/methodsFilters';


const saveState = (state: UserPresetsState) => {
    localStorage.setItem("userState", JSON.stringify(state));
}

const loadState = (): UserPresetsState | undefined => {
    const item = localStorage.getItem("userState");
    if (item) {
        return JSON.parse(item);
    }
}

export interface UserPresetsState {
    completitionMethod?: MethodWithAgent;
    agentTaskMethod?: MethodWithAgent;
}

export interface UserPresetsStateStore extends UserPresetsState {
    setCompletitionMethod: (completitionMethod?: MethodWithAgent) => void;
    setAgentTaskMethod: (agentTaskMethod?: MethodWithAgent) => void;
}

export const useUserPresets = create<UserPresetsStateStore>((set) => ({
    // ...loadState(),

    setCompletitionMethod: (completitionMethod?: MethodWithAgent) => set((state: UserPresetsStateStore) => {
        const newState = { ...state, completitionMethod };
        saveState(newState);
        return newState;
    }),
    setAgentTaskMethod: (agentTaskMethod?: MethodWithAgent) => set((state: UserPresetsStateStore) => {
        const newState = { ...state, agentTaskMethod };
        saveState(newState);
        return newState;
    }),
}));
