import { Box, debounce, Divider, Stack, Typography } from "@mui/material"
import React, { useState, useEffect, useCallback, useRef} from 'react';
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    addEdge,
    Controls,
    Position,
    useReactFlow
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import './index.css'
import { nodeTypes } from "./nodes";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import { BoardSidebar } from "./components/BoardSidebar";
import { Agent, useAgents } from "../../store/store";
import { AgentStatus, useEvents } from "../../hooks/useEvents";
import { MethodWithAgentId, useMethods } from "./store/methods";

const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

// function ContextMenu({ id, top, left, right, bottom, ...props }) {
//     const { getNode, setNodes, addNodes, setEdges } = useReactFlow();
//     const duplicateNode = useCallback(() => {
//         const node = getNode(id);
//         const position = {
//             x: node.position.x + 50,
//             y: node.position.y + 50,
//         };

//         addNodes({
//             ...node,
//             selected: false,
//             dragging: false,
//             id: `${node.id}-copy`,
//             position,
//         });
//     }, [id, getNode, addNodes]);

//     const deleteNode = useCallback(() => {
//         setNodes((nodes) => nodes.filter((node) => node.id !== id));
//         setEdges((edges) => edges.filter((edge) => edge.source !== id));
//     }, [id, setNodes, setEdges]);

//     return (
//         <Box
//             position={'absolute'}
//             zIndex={100}
//             padding={'0.5rem'}
//             border={'1px solid grey'}
//             borderRadius={'4px'}
//             sx={{ top, left, right, bottom }}
//             bgcolor={'#fff'}
//         >
//             {/* <Typography>Node: {id}</Typography> */}
//             <Divider />
//             {
//                 [
//                     'make_summary',
//                     'search_by_document'
//                 ].map((e, idx) =>
//                     <Box
//                         sx={{
//                             cursor: 'pointer',
//                             '&:hover': {
//                                 bgcolor: 'lightgrey'
//                             }
//                         }}
//                     >
//                         <Typography
//                             key={idx}
//                             fontWeight={700}
//                         >
//                             {e}
//                         </Typography>
//                     </Box>
//                 )
//             }
//         </Box>
//     );
// }


interface Board {
    nodes: any[];
    edges: any[]
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
    const positionUpdates = event.filter(e => e.type === 'position');
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


const buildSuitedTypeMethods = (agents: Agent[]): Map<string, MethodWithAgentId[]> => {
    const methods = new Map<string, MethodWithAgentId[]>();

    agents.forEach((agent, agent_idx) => {
        if (agent.status !== AgentStatus.Connected)
            return;

        agent.methods.forEach((method, method_idx) => {
            method.inputs.forEach(input => {
                if (input.type === 'text') {
                    if (!methods.has('text')) {
                        methods.set('text', []);
                    }
                    methods.get('text')?.push({ ...method, agentId: agent.id })
                }
            })
        });
    });

    return methods;
}


export default () => {
    const { projectId } = useParams();

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const ref = useRef(null);

    const { agents } = useAgents();
    const { connectionState } = useEvents();
    const { setMethods } = useMethods();

    useEffect(() => {
        const methods = buildSuitedTypeMethods(agents);
        setMethods(methods);
        console.log(methods);
    }, [agents]);

    // const [menu, setMenu] = useState(null);

    // const onNodeContextMenu = useCallback((event, node) => {
    //     // Prevent native context menu from showing
    //     event.preventDefault();

    //     // Calculate position of the context menu. We want to make sure it
    //     // doesn't get positioned off-screen.
    //     const pane = ref.current.getBoundingClientRect();
    //     console.log(event.target.value)
    //     setMenu({
    //         id: node.id,
    //         top: event.clientY < pane.height - 200 && event.clientY,
    //         left: event.clientX < pane.width - 200 && event.clientX,
    //         right: event.clientX >= pane.width - 200 && pane.width - event.clientX,
    //         bottom: event.clientY >= pane.height - 200 && pane.height - event.clientY,
    //     });
    // }, [setMenu]);

    useEffect(() => {
        setNodes([]);
        setEdges([]);
    }, []);

    useEffect(() => {
        fetchBoard(projectId).then(e => {
            setNodes(e.nodes);
            setEdges(e.edges);
        })
    }, []);

    const onConnect = useCallback(
        (params: any) =>
            setEdges((eds: any) =>
                addEdge({ ...params, animated: false }, eds),
            ),
        [],
    );

    // const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

    // useEffect(() => {
    //     saveResults()
    // }, [nodes])

    const onNodesChangeS = (event) => {
        onNodesChange(event);
        saveChange(event);
    }

    return (
        <Box padding={'0.4rem'} border={'1px solid black'} width={'100%'} height={'80vh'} position={'relative'}>
            <Box width={'10rem'} position={'absolute'} top={'0.4rem'} left={'0.4rem'} zIndex={999}>
                {
                    projectId ?
                    <BoardSidebar projectId={projectId} />
                    : null
                }
            </Box>
            <ReactFlow
                ref={ref}
                nodes={nodes}
                edges={edges}
                // onNodesChange={onNodesChange}
                onNodesChange={onNodesChangeS}
                onEdgesChange={onEdgesChange}
                // onNodeContextMenu={onNodeContextMenu}
                onConnect={onConnect}
                onConnectStart={removeSelection}
                onConnectEnd={appendSelection}

                onDrop={(e) => {
                    console.log(e)
                }}
                onPaste={e => {
                    console.log(e)
                    fetch(`/api/projects/${projectId}/nodes`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            id: `clipboard-${Math.random().toString()}`,
                            text: e.clipboardData.getData('Text'),
                            position: { x: 800, y: 700 },
                        })
                    })
                    .then(e => e.json())
                    .then(e => {
                        // TODO: may be switch to UUID as node ID
                        // @ts-ignore
                        setNodes(nodes => [...nodes, {
                            id: e.id,
                            type: 'text',
                            data: e.data,
                            position: { x: 800, y: 700 },
                            targetPosition: 'left',
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
            >
                {/* {menu && <ContextMenu onClick={onPaneClick} {...menu} />} */}
                <Controls />
            </ReactFlow>
        </Box>
    );
};