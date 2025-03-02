import { Edge, Node } from '@xyflow/react';
import { create } from 'zustand'

export interface BoardState {
    nodes: Node[];
    edges: Edge[];

    setNodes: (nodes: (nodes: Node[]) => Node[] | Node[]) => void;
    // addNode: (node: Node) => void;

    setEdges: (edges: (nodes: Edge[]) => Edge[] | Edge[]) => void;
    // addEdge: (edge: Edge) => void;
}

export const useBoard = create<BoardState>((set) => ({
    nodes: [],
    edges: [],

    setNodes: (nodes: (nodes: Node[]) => Node[] | Node[]) => set((state: BoardState) => {
        return { ...state, nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes };
    }),

    setEdges: (edges: (edges: Edge[]) => Edge[] | Edge[]) => set((state: BoardState) => {
        return { ...state, edges: typeof edges === 'function' ? edges(state.edges) : edges };
    }),
}));
