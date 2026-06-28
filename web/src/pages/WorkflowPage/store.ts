import { type Edge, type Node, type ReactFlowInstance } from '@xyflow/react';
import { useCallback, useEffect } from 'react';
import { create } from 'zustand'


type SyncFn = () => Record<string, any>;



export interface BoardState {
    nodes: Node[];
    edges: Edge[];
    reactFlowInstance?: ReactFlowInstance;
    nodesSync: { [key: string ]: SyncFn | undefined },

    setSync: (id: string, fn: SyncFn) => void;
    removeSync: (id: string) => void;

    setNodes: (nodes: (nodes: Node[]) => Node[] | Node[]) => void;
    // addNode: (node: Node) => void;

    setEdges: (edges: (nodes: Edge[]) => Edge[] | Edge[]) => void;
    // addEdge: (edge: Edge) => void;

    setReactFlowInstance: (reactFlowInstance: ReactFlowInstance) => void;

    updateNode: (id: string, data: any) => void;
}

export function nodeSelector<T = unknown>(id: string) {
    return (store: BoardState) => ({
        setData: (data: T) => store.updateNode(id, data),
    });
}

export const useBoard = create<BoardState>((set) => ({
    nodes: [],
    edges: [],
    nodesSync: { },

    setSync: (id: string, fn: SyncFn) => set((state: BoardState) => {
        return {
            ...state, nodesSync: { ...state.nodesSync, [id]: fn }
        }
    }),

    removeSync: (id: string) => set((state: BoardState) => {
        return {
            ...state, nodesSync: { ...state.nodesSync, [id]: undefined }
        }
    }),

    setNodes: (nodes: (nodes: Node[]) => Node[] | Node[]) => set((state: BoardState) => {
        return { ...state, nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes };
    }),

    setEdges: (edges: (edges: Edge[]) => Edge[] | Edge[]) => set((state: BoardState) => {
        return { ...state, edges: typeof edges === 'function' ? edges(state.edges) : edges };
    }),

    setReactFlowInstance: (reactFlowInstance: ReactFlowInstance) => set((state: BoardState) => {
        return { ...state, reactFlowInstance }
    }),

    updateNode: (id: string, data: any) => set((state: BoardState) => {
        return { ...state, nodes: state.nodes.map(node => node.id === id ? { ...node, data: { ...node.data, ...data } } : node ) };
    }),

}));

/*
Hook required for node that manage local state itself (for example editor nodes).
Component pass function that called to sync state with global `nodes` date state.
*/
export const useSync = (id: string, fn: SyncFn, deps: React.DependencyList) => {
    const state = useBoard();
    const syncFn = useCallback(fn, deps);

    useEffect(() => {
        state.setSync(id, syncFn);
        return () => state.removeSync(id);
    }, [id, syncFn]);
}

export interface DataNodesState {
    dataNodes: {
        [key: string]: any;
    };
    outputs?: {
        [key: string]: any;
    }

    setData: (nodeId: string, data: any) => void;
    setOutputs: (data: any) => void;
}

export const useDataNodes = create<DataNodesState>((set) => ({
    dataNodes: {},

    setData: (nodeId: string, data: any) => set((state: DataNodesState) => {
        return { ...state, dataNodes: { ...state.dataNodes, [nodeId]: data } };
    }),

    setOutputs: (data: any) => set((state: DataNodesState) => {
        return { ...state, outputs: data };
    }),
}));



