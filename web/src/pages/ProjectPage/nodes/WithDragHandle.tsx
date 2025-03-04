import React, { memo, ReactNode, useRef, useState } from "react";

import { IconButton, Stack } from "@mui/material"
import BlurOnIcon from '@mui/icons-material/BlurOn';
import { NodeMenu } from "../components/NodeMenu";
import { useBoard } from "../components/Board/store";
import { Node, Position, NodeProps } from "@xyflow/react";

interface WithDragHandleProps extends NodeProps {
    children: ReactNode;
}

interface NodeDataEnvelop {
    __objectId: string;
    __projectId?: string;
    __virtual?: boolean;
    [key: string]: any;
}

export const WithWrapper = (component: (props: NodeProps) => React.JSX.Element) => {
    const MemoComponent = memo(component);

    return (props: NodeProps) => {
        const [relatedNodes, setRelatedNodes] = useState<Set<string>>();
        const setNodes = useBoard((state) => state.setNodes);

        const showAllRelated = () => {
            if (relatedNodes) {
                setNodes(prev => prev.filter(e => !relatedNodes.has(e.id)));
                setRelatedNodes(undefined);
                return;
            }
    
            fetch(`/api/objects/${props.data.objectId}/related`)
            .then(e => e.json())
            .then(data => {
                // TODO: Envelope for node's data
    
                const nodes = data.map((e: any, index: any) => {
                    console.log(e.object)
                    const object = e.object;
                    return {
                        id: `tmp-${object.id}`,
                        type: object.tp,
                        data: {
                            ...object.data,
                            objectId: object.id,
                        },
                        position: {
                            x: props.positionAbsoluteX + index * 500,
                            y: props.positionAbsoluteY - 500
                        },
                        targetPosition: Position.Left,
                        dragHandle: '.custom'
                    } as Node
                })
                setRelatedNodes(new Set(nodes.map((e: any) => e.id)));
                console.log('nodes', nodes)
    
                setNodes((prev) => [...prev, ...nodes]);
            })
        }

        return (
            <div style={{ userSelect: 'text' }} className="select-control">
                <Stack flexDirection={'row'} justifyContent={'flex-end'}>
                    <Stack direction={'row'} width={'100%'}>
                        <div
                            style={{
                                width: '100%',
                                height: '36px',
                                borderRadius: '8px',
                                backgroundColor: '#e9e9e999',
                                marginBottom: '4px',
                                cursor: 'pointer'
                            }}
                            className="custom"
                        />
                        <IconButton onClick={showAllRelated}>
                            <BlurOnIcon />
                        </IconButton>
                        <NodeMenu tp={props.type} data={props.data} />
                    </Stack>
                </Stack>
                <MemoComponent {...props} />
            </div>
        );    
    }
}


export const WithDragHandle = ({ children, type, data, positionAbsoluteX, positionAbsoluteY }: WithDragHandleProps) => {
    const [relatedNodes, setRelatedNodes] = useState<Set<string>>();

    const setNodes = useBoard((state) => state.setNodes);


    const showAllRelated = () => {
        if (relatedNodes) {
            setNodes(prev => prev.filter(e => !relatedNodes.has(e.id)));
            setRelatedNodes(undefined);
            return;
        }

        fetch(`/api/objects/${data.objectId}/related`)
        .then(e => e.json())
        .then(data => {
            // TODO: Envelope for node's data

            const nodes = data.map((e: any, index: any) => {
                console.log(e.object)
                const object = e.object;
                return {
                    id: `tmp-${object.id}`,
                    type: object.tp,
                    data: {
                        ...object.data,
                        objectId: object.id,
                    },
                    position: {
                        x: positionAbsoluteX + index * 500,
                        y: positionAbsoluteY - 500
                    },
                    targetPosition: Position.Left
                } as Node
            })
            setRelatedNodes(new Set(nodes.map((e: any) => e.id)));
            console.log('nodes', nodes)

            setNodes((prev) => [...prev, ...nodes]);
        })
    }

    return (
        <div style={{ userSelect: 'text' }} className="select-control">
            <Stack flexDirection={'row'} justifyContent={'flex-end'}>
                <Stack direction={'row'} width={'100%'}>
                    <div
                        style={{
                            width: '100%',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: '#e9e9e999',
                            marginBottom: '4px',
                            cursor: 'pointer'
                        }}
                        className="custom"
                    />
                    <IconButton onClick={showAllRelated}>
                        <BlurOnIcon />
                    </IconButton>
                    <NodeMenu tp={type} data={data} />
                </Stack>
            </Stack>
            {children}
        </div>
    )
}
