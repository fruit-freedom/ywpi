import { useCallback, useEffect, useState } from 'react';
import { Button, Stack, TextField } from "@mui/material"
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
import { useBoard } from './store';
import { nodeTypes } from './nodes';

const initialNodes = [
    {
        id: '0',
        type: 'method',
        data: {
            name: "custom_preprocessing",
            inputs: [
                {
                    name: "text"
                }
            ],
            outputs: [
                {
                    name: "text"
                }
            ],
        },
        position: { x: -400, y: 100 },
    },
    {
        id: '2',
        type: "method",
        data: {
            name: "RAG",
            inputs: [
                {
                    name: "text"
                }
            ],
            outputs: [
                {
                    name: "documents"
                }
            ]
        },
        position: { x: 50, y: -100 },
    },
    {
        id: '3',
        type: "method",
        data: {
            name: "builtins/user_input",
            inputs: [
            ],
            outputs: [
                {
                    name: "text"
                }
            ]
        },
        position: { x: -900, y: -200 },
    },
    // {
    //     id: '2a',
    //     data: { label: 'Web :: Implement web interface' },
    //     position: { x: 10, y: 200 },
    //     style: { backgroundColor: "#009966", border: "none" },
    //     parentId: '2',
    //     extent: "parent"
    // },
    // {
    //     id: '2b',
    //     data: { label: 'Backend :: Implement API interface with search engine' },
    //     position: { x: 200, y: 50 },
    //     style: { backgroundColor: "#eee600", border: "none" },
    //     parentId: '2',
    //     extent: "parent"
    // },
    // {
    //     id: '2c',
    //     data: { label: 'Design :: Draw search page' },
    //     position: { x: 20, y: 50 },
    //     style: { backgroundColor: "lightgrey", color: "grey", border: "none" },
    //     parentId: '2',
    //     extent: "parent"
    // },
    // {
    //     id: '2e',
    //     data: { label: 'Backend :: Improve search algorithm' },
    //     position: { x: 200, y: 280 },
    //     style: {  },
    //     parentId: '2',
    //     extent: "parent"
    // },
    // {
    //     id: '1',
    //     type: 'input',
    //     data: { label: 'State :: AS IS on July' },
    //     position: { x: 320, y: -300 },
    // },
    // {
    //     id: '3',
    //     data: { label: 'Web :: Add white theme' },
    //     position: { x: 320, y: -200 },
    // },
    // { 
    //     id: '34',
    //     data: { label: 'State :: UI with white theme' },
    //     position: { x: 320, y: -100 },
    // },
    // {
    //     id: '4',
    //     data: { label: 'UserStory :: Semantic field' },
    //     position: { x: 320, y: 500 },
    //     style: { width: 300, height: 300 },
    // },
    // {
    //     id: '4a',
    //     data: { label: 'Desing :: Add few control elements to field' },
    //     position: { x: 15, y: 65 },
    //     parentId: '4',
    //     extent: 'parent',
    // },
    // {
    //     id: '4b',
    //     data: { label: 'Group B.A' },
    //     position: { x: 15, y: 120 },
    //     style: {
    //         backgroundColor: 'rgba(255, 0, 255, 0.2)',
    //         height: 150,
    //         width: 270,
    //     },
    //     parentId: '4',
    //     extent: 'parent',
    // },
    // {
    //     id: '4b1',
    //     data: { label: 'Node B.A.1' },
    //     position: { x: 20, y: 40 },
    //     parentId: '4b',
    //     extent: 'parent',
    // },
    // {
    //     id: '4b2',
    //     data: { label: 'Node B.A.2' },
    //     position: { x: 100, y: 100 },
    //     parentId: '4b',
    //     extent: 'parent',
    // },
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

export default () => {
    const { nodes, setNodes, edges, setEdges, reactFlowInstance, setReactFlowInstance } = useBoard();

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
    
    const [text, setText] = useState('');

    // const { data } = useQuery({
    //     queryKey: ["board"],
    //     queryFn: () => fetch("/api/board").then(e => e.json()),
    // });

    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, []);

    const addNode = () => {
        setText('');

        setNodes(nds => {
            const newNodes = [...nds, {
                type: "issue",
                id: generateId(),
                data: {
                    title: text
                },
                position: { x: 20, y: 40 },
                // parentId: '4b',
                // extent: 'parent',
            }];
            localStorage.setItem("DEPLOYER_NODES", JSON.stringify(newNodes));
            return newNodes;
        });
    }


    // const onConnectEnd = useCallback(
    //     (event, connectionState) => {
    //         // when a connection is dropped on the pane it's not valid
    //         if (!connectionState.isValid) {
    //             // we need to remove the wrapper bounds, in order to get the correct position
    //             const id = generateId();
    //             const { clientX, clientY } =
    //             'changedTouches' in event ? event.changedTouches[0] : event;
    //             const newNode = {
    //                 type: "issue",
    //                 data: { title: `Web :: ${id}` },
    //                 position: reactFlowInstance.screenToFlowPosition({
    //                     x: clientX,
    //                     y: clientY,
    //                 }),
    //             };

    //             createNode(newNode)
    //             .then(createdNode => {
    //                 setNodes((nds) => {
    //                     const newNodes = nds.concat(createdNode);
    //                     return newNodes;
    //                 });
    //                 const newEdge = {
    //                     id: id,
    //                     source: connectionState.fromNode.id,
    //                     sourceHandle: connectionState.fromHandle.id,
    //                     target: createdNode.id,
    //                     targetHandle: "a",
    //                 }
    //                 createEdge(newEdge);

    //                 setEdges((eds) => {
    //                     const newEdges = eds.concat(newEdge);
    //                     return newEdges;
    //                 });

    //             })

    //         }
    //     },
    //     [reactFlowInstance],
    // );

    return (
        <Stack
            width={'99vw'}
            height={'950px'}
            direction={'row'}
            bgcolor={"#fafafa"}
        >
            <Stack width={"200px"} border={"1px solid grey"}>

            </Stack>
            <ReactFlow
                nodeTypes={nodeTypes}
                onInit={e => setReactFlowInstance(e)}
                nodes={nodes}
                edges={edges}

                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                // onConnectEnd={onConnectEnd}
                className="react-flow-subflows-example"
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


