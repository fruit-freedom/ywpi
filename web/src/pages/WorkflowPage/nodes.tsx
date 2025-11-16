import { Box, Button, Drawer, Modal, Paper, Stack, TextField, Typography } from "@mui/material";
import { Handle, Position, type NodeProps, Node } from "@xyflow/react";
import { memo, useEffect, useState } from "react";


type MethodNode = Node<{
    name: string;
    inputs: {
        name: string
    }[];
    outputs: {
        name: string
    }[];
}>;


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


export const MethodNode = memo(({ data, isConnectable }: NodeProps<MethodNode>) => {
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
                <Button size="small" sx={{ color: "grey" }}>Run</Button>
                <Typography variant='body1' fontWeight={700} letterSpacing={0.8}>{data.name}</Typography>
            </Stack><Stack minHeight={"400px"}>
            </Stack>
            {
                data.inputs?.map((e) => (
                    <Stack direction={'row'} alignItems={"center"} gap={1}>
                        <Handle
                            type='target'
                            position={Position.Left}
                            id="a"
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
                    <Stack direction={'row'} alignItems={"center"} gap={1} justifyContent={"flex-end"}>
                        <Typography fontWeight={700}>{e.name}</Typography>
                        <Handle
                            type='source'
                            position={Position.Right}
                            id="b"
                            isConnectable={isConnectable}
                            style={{
                                transform: 'none',
                                position: 'static',
                            }}
                        />
                    </Stack>
                ))
            }
            <Stack height={'100px'}></Stack>
        </Stack>
    );
});




export const nodeTypes = {
    method: MethodNode,
};
 