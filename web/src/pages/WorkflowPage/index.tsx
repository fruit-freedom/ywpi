import { useCallback, useEffect, useState } from 'react';
import { Button, Paper, Stack, TextField, Typography } from "@mui/material"
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

const initialNodes = [
    {
        id: '0',
        type: 'method',
        data: {
            name: "builtins/pdf-check",
            inputs: [
            ],
            outputs: [
            ],
        },
        position: { x: -900, y: -200 },
    },
    {
        id: "2",
        type: "method",
        data: {
            // name: "algorithms/summarization",
            name: "test/summarization",
            inputs: [
            ],
            outputs: [
                {
                    name: "summary"
                }
            ]
        },
        position: { x: -400, y: 100 },
    },
    {
        id: '3',
        type: "method",
        data: {
            // name: "algorithms/embeddings",
            name: "test/embeddings",
            inputs: [
                {
                    name: "text"
                }
            ],
            outputs: [
                {
                    name: "embedding"
                }
            ]
        },
        position: { x: 50, y: -100 },
    },
];
 
const initialEdges = [
    // { id: '0-1', source: '0', target: '2' },
    // { id: 'e1-3', source: '1', target: '3' },
    // { id: 'e4a-4b1', source: '4a', target: '4b1' },
    // { id: 'e4a-4b2', source: '4a', target: '4b2' },
    // { id: 'e4b1-4b2', source: '4b1', target: '4b2' },
    // { id: '2a-2b', source: '2b', target: '2a' },
    // { id: '2a-2c', source: '2c', target: '2a' },
    // { id: '2a-2e', source: '2b', target: '2e' },
];

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


function generateBsonId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  let randomValue = '';
  for (let i = 0; i < 5; i++) {
    randomValue += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  let counter = (Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');

  return timestamp + randomValue;
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

export default () => {
    const { nodes, setNodes, edges, setEdges, reactFlowInstance, setReactFlowInstance } = useBoard();

    const { dataNodes, setOutputs } = useDataNodes();

    const { agents } = useAgents();
    useEvents();

    const onNodesChange = useCallback(
        (changes: any) => {
            setNodes((nds) => {
                changes.filter(e => e.type === "remove").forEach(e => deleteNode(e.id));
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
    
    useEffect(() => {
        // setNodes(initialNodes);
        setEdges(initialEdges);
    }, []);

    const handleRun = () => {
        console.log(dataNodes)

        setOutputs({});
        const nodes = reactFlowInstance?.getNodes().map(e => {
            const updatedNode =  {...e};

            if (e.type === "data") {
                updatedNode.data.payload = dataNodes[e.id];
            }

            return updatedNode;
        })

        const data = {
            edges: reactFlowInstance?.getEdges(),
            nodes: nodes,
        }

        executeWorkflow(data)
        .then(e => { console.log(e); setOutputs(e); })
        .catch(e => console.error(e))

        console.log("Data", data)
    }

    const onDragStart = (event, nodeType) => {
        // setType(nodeType);
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
                id: `${nodes.length + 1}`,
                type: nodeData.type,
                position,
                dragHandle: nodeData.dragHandle,
                // dragHandle: '.custom',
                data: nodeData.data,
            };

            setNodes((nds) => nds.concat(newNode));

            setNodeData(undefined);
        },
        [reactFlowInstance, nodeData, nodes],
    );


    return (
        <Stack
            width={'99vw'}
            height={'950px'}
            direction={'row'}
            bgcolor={"#fafafa"}
        >
            <Stack width={"350px"} border={"1px solid grey"} padding={1} maxHeight={'80vh'} sx={{ overflowY: 'scroll' }}>
                <Button onClick={handleRun}>Run</Button>
                <Stack gap={1}>
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
                                    name: 'None',
                                    outputs: [
                                        {
                                            name: "inputs"
                                        }
                                    ],
                                    inputs: [
                                        {
                                            name: "outputs"
                                        }
                                    ]
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
                // onConnectEnd={onConnectEnd}
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


