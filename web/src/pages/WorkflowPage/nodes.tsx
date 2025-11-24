import { Box, Button, Divider, Drawer, Modal, Paper, Stack, TextField, Typography } from "@mui/material";
import { Handle, Position, type NodeProps, Node } from "@xyflow/react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { EditableMarkdown } from "../../external/contexts/Markdown";
import { useDataNodes } from "./store";


type MethodNode = Node<{
    name: string;
    inputs: {
        name: string
    }[];
    outputs: {
        name: string
    }[];
}>;

export const MethodNode = memo(({ data, isConnectable, id }: NodeProps<MethodNode>) => {
    const { outputs: workflowOutputs } = useDataNodes();

    const myWorkflowOutputs = useMemo(() => {
        if (!workflowOutputs)
            return [];

        return Object.entries(workflowOutputs).filter((e) => {
            const [key, value] = e;
            const [nodeId, output] = key.split(".");

            return nodeId === id;
        }).map(e => {
            const [key, value] = e;
            const [nodeId, output] = key.split(".");

            return {
                outputName: output,
                outputValue: value
            }
        })
    }, [workflowOutputs])

    return (
        <Stack
            sx={{
                border: "1px solid lightgrey",
                borderRadius: "6px",
                backgroundColor: "#fff" 
            }}
        >
            <Stack
                padding={'0.5em'}
                width={'300px'}
                // direction={'row'}
                gap={2}
                justifyContent={'center'}
                alignItems={"center"}
            >
                {/* <Button size="small" sx={{ color: "grey" }}>Run</Button> */}
                <Typography variant='body1' fontWeight={700} letterSpacing={0.8}>{data.name}</Typography>
            </Stack>
            {
                data.inputs?.map((e) => (
                    <Stack key={e.name} direction={'row'} alignItems={"center"} gap={1}>
                        <Handle
                            type='target'
                            position={Position.Left}
                            id={e.name}
                            isConnectable={isConnectable}
                            style={{
                                transform: 'none',
                                position: 'static',
                            }}
                        />
                        <Typography fontWeight={700}>{e.name}</Typography>
                    </Stack>
                ))
            }
            {
                data.outputs?.map(e => (
                    <Stack key={e.name} direction={'row'} alignItems={"center"} gap={1} justifyContent={"flex-end"}>
                        <Typography fontWeight={700}>{e.name}</Typography>
                        <Handle
                            type='source'
                            position={Position.Right}
                            id={e.name}
                            isConnectable={isConnectable}
                            style={{
                                transform: 'none',
                                position: 'static',
                            }}
                        />
                    </Stack>
                ))
            }
            <Divider />
            <Stack gap={2} padding={1} divider={<Divider />}>
            {
                myWorkflowOutputs.map((e, index) => (
                    <Stack key={e.outputName + index} gap={1}>
                        <Typography fontWeight={700}>{e.outputName}</Typography>
                        <Typography>{e.outputValue}</Typography>
                    </Stack>
                ))
            }
            </Stack>
        </Stack>
    );
});

type DataNode = Node<{
    name: string;
    outputs: {
        name: string
    }[];
}>;



const NodeHeader = ({ name }: { name: string }) => {
    return (
        <Stack direction={"row"} gap={4} alignItems={'center'}>
            <div
                style={{
                    margin: '4px',
                    width: '48px',
                    height: '20px',
                    // backgroundColor: 'black',
                    border: '1px solid #d4d4d4',
                    borderRadius: '4px',
                    cursor: 'pointer',
                }}
                className="custom"
            />
            <Typography variant="h6" fontWeight={700}>{name}</Typography>
        </Stack>
    )
}

export const DataNode = memo(({ data, isConnectable, id }: NodeProps<DataNode>) => {
    const ref = useRef();
    const { setData } = useDataNodes();

    useEffect(() => {
        const interval = setInterval(() => {
            setData(id, {
                content: ref.current.getContent()
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [ref.current])

    return (
        <Stack
            sx={{
                border: "1px solid lightgrey",
                borderRadius: "6px",
                backgroundColor: "#fff" 
            }}
            width={'600px'}
        >
            <NodeHeader name="Markdown" />
            <Box padding={1}>
                {/* <Paper> */}
                    <EditableMarkdown ref={ref} />
                {/* </Paper> */}
            </Box>
            {
                data.outputs?.map(e => (
                    <Stack key={e.name} direction={'row'} alignItems={"center"} gap={1} justifyContent={"flex-end"}>
                        <Typography fontWeight={700}>{e.name}</Typography>
                        <Handle
                            type='source'
                            position={Position.Right}
                            id={e.name}
                            isConnectable={isConnectable}
                            style={{
                                transform: 'none',
                                position: 'static',
                            }}
                        />
                    </Stack>
                ))
            }
        </Stack>
    );
});


export const AgentTaskNode = memo(({ data, isConnectable, id }: NodeProps<DataNode>) => {
    const ref = useRef();
    const { setData } = useDataNodes();

    useEffect(() => {
        const interval = setInterval(() => {
            setData(id, {
                content: ref.current.getContent()
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [ref.current])

    return (
        <Stack
            sx={{
                border: "1px solid lightgrey",
                borderRadius: "6px",
                backgroundColor: "#fff" 
            }}
            width={'600px'}
        >
            <NodeHeader name="Task" />
            <Box padding={1}>
                <EditableMarkdown ref={ref} />
            </Box>
            <Stack direction={'row'} alignItems={"center"} gap={1}>
                <Handle
                    type='target'
                    position={Position.Left}
                    id={"inputs"}
                    isConnectable={isConnectable}
                    style={{
                        transform: 'none',
                        position: 'static',
                    }}
                />
                <Typography fontWeight={700}>inputs</Typography>
            </Stack>
            <Stack direction={'row'} alignItems={"center"} gap={1} justifyContent={"flex-end"}>
                <Typography fontWeight={700}>outputs</Typography>
                <Handle
                    type='source'
                    position={Position.Right}
                    id={"outputs"}
                    isConnectable={isConnectable}
                    style={{
                        transform: 'none',
                        position: 'static',
                    }}
                />
            </Stack>
        </Stack>
    );
});

export const nodeTypes = {
    method: MethodNode,
    data: DataNode,
    agentTask: AgentTaskNode
};
 