import { useCallback, useEffect, useState } from 'react';
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material"
import {
    ReactFlow,
    addEdge,
    Background,
    applyEdgeChanges,
    applyNodeChanges,
    MiniMap,
    Controls,
    type Connection,
    useReactFlow,
} from '@xyflow/react';


import '@xyflow/react/dist/style.css';
import { useBoard, useDataNodes } from './store';
import { nodeTypes } from './nodes';
import { Agent, Method, useAgents } from '../../store/store';
import { useEvents } from '../../hooks/useEvents';
import { MethodCardSmall } from '../../shared/MethodCard';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { getWorkflow, updateWorkflow } from '../../entities/workflow/api';
import { toChain } from './execute-chain';
import { buildChain } from '../WorkflowsPage/chains';


const executeWorkflow = (payload: any): Promise<any> => {
    return fetch("/api/workflows/execute", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(e => e.json())
}

const executeChain = (payload: any): Promise<any> => {
    return fetch("/api/workflows/execute_chain", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(e => e.json())
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

                            fetch(`/api/board/nodes/${nodeId}`, {
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
    // const positionUpdates = event.filter((e: any) => e.type === 'position');
    // if (positionUpdates.length > 0) {   
    //     update(positionUpdates)
    // }
}

const createEdge = (edge) => {
    // fetch(`/api/board/edges`, {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify(edge)
    // })
    // .then(e => console.log(e))
    // .catch(e => console.log(e))
}

const createNode = (node) => {
    // return fetch(`/api/board/nodes`, {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify(node)
    // })
    // .then(e => e.json())
}

const deleteEdge = (edgeId: string) => {
    // fetch(`/api/board/edges/${edgeId}`, {
    //     method: 'DELETE'
    // })
    // .then(e => console.log(e))
    // .catch(e => console.log(e))
}

const deleteNode = (nodeId: string) => {
    // fetch(`/api/board/nodes/${nodeId}`, {
    //     method: 'DELETE'
    // })
    // .then(e => console.log(e))
    // .catch(e => console.log(e))
}

function generateId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;

    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * charactersLength);
        result += characters.charAt(randomIndex);
    }
    return result;
}


const agentsToMethods = (agents: Agent[]) => {
    return agents.filter(a => a.status === "connected").flatMap(a => {
        return a.methods.map(m => ({ agentId: a.id, ...m }))
    })
}

interface NodeCreationData {
    type: string;
    data: {
        [key: string]: any;
    },
    dragHandle?: string;
}

const WorkflowPage = ({ workflowId }: { workflowId: string }) => {
    const { nodes, setNodes, edges, setEdges, reactFlowInstance, setReactFlowInstance, nodesSync } = useBoard();

    const { data } = useQuery({
        queryFn: () => getWorkflow(workflowId),
        queryKey: ["workflows", workflowId]
    });

    const { dataNodes, setOutputs } = useDataNodes();

    useEffect(() => {
        if (!data)
            return;

        setNodes(prev => data.nodes);
        setEdges(prev => data.edges);
    }, [data]);

    const { agents } = useAgents();
    useEvents();

    const onNodesChange = useCallback(
        (changes: any) => {
            setNodes((nds) => {
                changes.filter((e: any) => e.type === "remove").forEach((e: any) => deleteNode(e.id));
                const newNodes = applyNodeChanges(changes, nds);
                return newNodes;
            });
            saveChange(changes);
        },
        [],
    );

    const onEdgesChange = useCallback(
        (changes: any[]) => {
            setEdges((eds) => {
                changes.filter(e => e.type === "remove").forEach(e => deleteEdge(e.id));
                const newEdges = applyEdgeChanges(changes, eds);
                return newEdges;
            })
        },
        [],
    );

    const onConnect = useCallback((connection: Connection) => {
        setEdges(eds => {
            const newEdge = {
                id: generateId(),
                source: connection.source,
                sourceHandle: connection.sourceHandle,
                target: connection.target,
                targetHandle: connection.targetHandle
            }
            console.log(connection)
            createEdge(newEdge);
            return [...eds, newEdge];
        });
    }, []);

    const handleRun = () => {
        console.log(dataNodes)

        const newNodes = nodes.map(n => {
            if (nodesSync[n.id]) {
                const update = nodesSync[n.id]?.();
                return { ...n, data: { ...n.data, ...update } };
            }
            return n;
        });
        setNodes(newNodes);

        const chain = buildChain(newNodes, edges);
        console.log(JSON.stringify(chain, null, 2));

        // const chain = toChain({ edges, newNodes }, agentsToMethods(agents));
        setOutputs({});

        executeChain(chain)
        .then(e => { console.log(e); setOutputs(e); })
        .catch(e => console.error(e))
    }

    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('text/plain', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const [nodeData, setNodeData] = useState<NodeCreationData>();

    const onDrop = useCallback((event: any) => {
            event.preventDefault();
            // check if the dropped element is valid
            if (!nodeData) {
                return;
            }
        
            const position = reactFlowInstance?.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
            const newNode = {
                id: generateId(),
                type: nodeData.type,
                position,
                dragHandle: nodeData.dragHandle,
                data: nodeData.data,
            };

            setNodes((nds) => nds.concat(newNode));

            setNodeData(undefined);
        },
        [reactFlowInstance, nodeData, nodes],
    );

    useEffect(() => {
        const onKeydown = (e: any) => {
            if ((e.ctrlKey || e.metaKey) && e.keyCode === 83) { // Ctrl + S
                e.preventDefault();

                const newNodes = nodes.map(n => {
                    if (nodesSync[n.id]) {
                        const update = nodesSync[n.id]?.();
                        return { ...n, data: { ...n.data, ...update } };
                    }
                    return n;
                });
                setNodes(newNodes);

                updateWorkflow(workflowId, {
                    edges,
                    nodes: newNodes,
                })
            }
        }
        document.addEventListener("keydown", onKeydown);

        return () => document.removeEventListener("keydown", onKeydown);
    }, [nodes, edges]);

    return (
        <Stack
            // width={'99vw'}
            height={'92vh'}
            direction={'row'}
            bgcolor={"#fafafa"}
        >
            <Stack border={"1px solid grey"} padding={1} gap={3}>
                <Box display={"flex"} justifyContent={"center"}>
                    <Typography variant="h6" fontWeight={700}>{data?.name}</Typography>
                </Box>
                <Stack gap={1} maxHeight={'80vh'} overflow={"auto"}>
                    <div draggable onDragStart={() => {
                            setNodeData({
                                type: "data",
                                data: {
                                    name: 'Mamrkdown',
                                    outputs: [
                                        {
                                            name: "content"
                                        }
                                    ]
                                },
                                dragHandle: ".custom",
                            })
                        }}
                    >
                        <Paper className='hover'>
                            <Stack padding={1}>
                                <Typography>Data node</Typography>
                                <Typography sx={{ color: 'grey' }} variant='body2'>
                                    Data node allow to add content to algroithms
                                </Typography>
                            </Stack>
                        </Paper>
                    </div>
                    <div draggable onDragStart={() => {
                            setNodeData({
                                type: "agentTask",
                                data: {
                                    name: 'custom/llm_call',
                                    outputs: [],
                                    inputs: []
                                },
                                dragHandle: ".custom",
                            })
                        }}
                    >
                        <Paper className='hover'>
                            <Stack padding={1}>
                                <Typography>Agent task</Typography>
                                <Typography sx={{ color: 'grey' }} variant='body2'>
                                    Agent task node allow to perform agent task
                                </Typography>
                            </Stack>
                        </Paper>
                    </div>
                    {
                        agentsToMethods(agents).map(e => (
                            <div
                                key={e.agentId + e.name}
                                draggable
                                onDragStart={() => {
                                    setNodeData({
                                        type: "method",
                                        data: {
                                            name: `${e.agentId}/${e.name}`,
                                            inputs: e.inputs.map(i => ({
                                                name: i.name
                                            })),
                                            outputs: e.outputs.map(o => ({
                                                name: o.name
                                            }))
                                        }
                                    })                                    
                                }}
                            >
                                <MethodCardSmall method={e} PaperProps={{ className: "hover" }}/>
                            </div>
                        ))
                    }
                </Stack>
                <Button onClick={handleRun} variant="contained">Run</Button>
            </Stack>
            <ReactFlow
                nodeTypes={nodeTypes}
                onInit={e => setReactFlowInstance(e)}
                nodes={nodes}
                edges={edges}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                fitView
                minZoom={0.1}
            >
                <MiniMap />
                <Controls />
                <Background color="#E6E6E6" />
            </ReactFlow>
        </Stack>
    );
}

export default () => {
    const { workflowId } = useParams();

    if (!workflowId)
        return null;

    return <WorkflowPage workflowId={workflowId}/>
}
