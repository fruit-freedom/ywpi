import { Box } from "@mui/material"
import React, { useState, useEffect, useCallback, useRef} from 'react';
import {
    ReactFlow,
    addEdge,
    Controls,
    useReactFlow,
    ReactFlowInstance,
    applyEdgeChanges,
    applyNodeChanges,
    Node,
    Edge,
    Position
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { nodeTypes } from "../../nodes";
import { useQuery } from "react-query";
import { useBoard } from "./store";

const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

interface ExtendedNode extends Node {
    project_id: string;
    object_id: string;
}

interface Board {
    nodes: ExtendedNode[];
    edges: Edge[]
}


interface NodeDataEnvelop {
    __objectId: string;
    __projectId?: string;
    [key: string]: any;
}

const fetchBoard = (projectId: string): Promise<Board> => {
    return fetch(`/api/projects/${projectId}/board`)
        .then(r => r.json())
        .then((data: Board) => {
            return {
                ...data,
                // nodes: data.nodes.map(e => ({ ...e, dragHandle: '.custom' })),
                // Inject additional meta props to data like objectId and projectId
                nodes: data.nodes.map(e => ({ ...e, dragHandle: '.custom', data: { ...e.data, objectId: e.object_id } })),
            }
        })
}


const customDebounce = () => {
    const timeouts = new Map();

    return (events: any[]) => {
        events
            .filter(e => e.type === 'position')
            .forEach(e => {
                const nodeId = e.id;
                const event = e;
                if (timeouts.has(nodeId)) {
                    timeouts.get(nodeId).event = event;
                }
                else {
                    timeouts.set(nodeId, {
                        event,
                        timeout: setTimeout(() => {
                            const { event } = timeouts.get(nodeId)
                            timeouts.delete(nodeId);

                            fetch(`/api/projects/projectId/nodes/${nodeId}`, {
                                method: 'PATCH',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    position: event.position,
                                })
                            })
                            .then(e => console.log(e))
                            .catch(e => console.log(e))
                            console.log('Update', event)
                        }, 1000)
                    })
                }
            })
    }
}

const update = customDebounce();

const saveChange = (event: any) => {
    const positionUpdates = event.filter((e: any) => e.type === 'position');
    if (positionUpdates.length > 0) {   
        update(positionUpdates)
    }
}

// TODO: Optimize selection
const removeSelection = () => {
    document.querySelectorAll('.select-control').forEach(e => e.style.userSelect = 'none');
}

// TODO: Optimize selection
const appendSelection = () => {
    document.querySelectorAll('.select-control').forEach(e => e.style.userSelect = 'text');
}

interface BoardProps {
    projectId: string;
};

export default ({ projectId }: BoardProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const { nodes, setNodes, edges, setEdges, reactFlowInstance, setReactFlowInstance } = useBoard();

    useEffect(() => {
        fetchBoard(projectId).then(e => {
            setNodes(() => e.nodes);
            //  
            setEdges(() => e.edges);
        })
    }, []);

    const onConnect = useCallback(
        (params: any) =>
            setEdges((eds: any) =>
                addEdge({ ...params, animated: false }, eds),
            ),
        [],
    );

    // const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance>();

    const onNodesChange = useCallback(
        (changes: any) => {
            setNodes((nds) => applyNodeChanges(changes, nds));
            saveChange(changes);
        },
        [],
    );

    const onEdgesChange = useCallback(
        (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [],
    );

    const mousePosition = useRef({ x: 0, y: 0 });

    return (
        <Box height={'100%'} position={'relative'}>
            <ReactFlow
                ref={ref}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectStart={removeSelection}
                onConnectEnd={appendSelection}
                onInit={(e) => setReactFlowInstance(e)}
                onDrop={(e) => {
                    console.log('onDrop', e)
                }}
                onMouseMove={(e) => { mousePosition.current = { x: e.clientX, y: e.clientY } }}
                onPaste={e => {
                    if (!ref.current || !reactFlowInstance) return;

                    const bounds = ref.current.getBoundingClientRect();
                    const position = reactFlowInstance.screenToFlowPosition({
                        x: mousePosition.current.x - bounds.left,
                        y: mousePosition.current.y - bounds.top
                    });

                    fetch(`/api/projects/${projectId}/nodes`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            tp: 'text',
                            data: {
                                text: e.clipboardData.getData('Text')
                            },
                            position,
                        })
                    })
                    .then(e => e.json())
                    .then(e => {
                        // TODO: may be switch to UUID as node ID
                        // @ts-ignore
                        setNodes(nodes => [...nodes, {
                            id: e.id,
                            type: 'text',
                            data: {
                                ...e.data,
                                objectId: e.object_id,
                            },
                            position: position,
                            targetPosition: Position.Left,
                            dragHandle: '.custom',
                        }])
                    })
                    .catch(e => console.log(e))
                }}
                style={{ background: '#efefef' }}
                nodeTypes={nodeTypes}
                defaultViewport={defaultViewport}
                fitView
                attributionPosition="bottom-left"
                minZoom={0.02}
 
                // panOnScroll
                // selectionOnDrag
                // panOnDrag={[1, 2]}          
                >
                <Controls />
            </ReactFlow>
        </Box>
    );
};
