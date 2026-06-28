import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
import { Handle, Position, type NodeProps, Node } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContentAccessRef, EditableMarkdown } from "../../external/contexts/Markdown";
import { useBoard, useDataNodes, useNodeBoard, useSync } from "./store";
import { HandleContext, registerHandler } from "../WorkflowsPage/chains";
import { useAgents } from "../../store/store";
import { getAgentTaskMethod } from "../../entities/agent/lib";

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
            <Stack gap={2} padding={1} divider={<Divider />} maxWidth={"300px"}>
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
    content?: string;
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
    const ref = useRef<ContentAccessRef | null>(null);

    useSync(id, () => {
        return {
            content: ref.current?.getTree()
        }
    }, [ref.current]);

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
                <EditableMarkdown ref={ref} defaultTree={data.content} />
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
    const ref = useRef<ContentAccessRef | null>(null);

    useSync(id, () => {
        return {
            content: ref.current?.getContent()
        }
    }, [ref.current]);

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
            width={'600px'}
        >
            <NodeHeader name="Task" />
            <Box padding={1}>
                <EditableMarkdown ref={ref} defaultValue={data.content}/>
            </Box>
            {/* <Stack padding={1} gap={1}>
                {
                    ["Web search tool", "Context create tool", "+ Add tool  "].map(e => (
                        <Paper>
                            <Stack padding={1}>
                                <Typography>{e}</Typography>
                            </Stack>
                        </Paper>
                    ))
                }
            </Stack> */}
            <Stack direction={'row'} alignItems={"center"} gap={1}>
                <Handle
                    type='target'
                    position={Position.Left}
                    id={"ctx"}
                    isConnectable={isConnectable}
                    style={{
                        transform: 'none',
                        position: 'static',
                    }}
                />
                <Typography fontWeight={700}>context</Typography>
            </Stack>
            <Stack direction={'row'} alignItems={"center"} gap={1} justifyContent={"flex-end"}>
                <Typography fontWeight={700}>outputs</Typography>
                <Handle
                    type='source'
                    position={Position.Right}
                    id={"result"}
                    isConnectable={isConnectable}
                    style={{
                        transform: 'none',
                        position: 'static',
                    }}
                />
            </Stack>
            <Stack gap={2} padding={1} divider={<Divider />} maxWidth={"300px"}>
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

type AgentTaskData = {
  content: Record<string, any>;
}


registerHandler("agentTask", (n: Node<AgentTaskData>, ctx: HandleContext) => {
  const {chain, edges, resolvedInputs} = ctx;

  const inputs: { [key: string]: any } = {}
  for (let e of edges) {
    if (e.target == n.id) {
      const k = `${e.source}.${e.sourceHandle}`;
      if (e.targetHandle)
        inputs[e.targetHandle] = {
            $ref: resolvedInputs[k]
        }
      else
          throw new Error("Edge targetHandle === null")
    }
  }

  chain.payload[`${n.id}.task`] = {
    description: n.data.content
  };


  inputs["task"] = {
    $ref: `#/payload/${n.id}.task`
  }
  
  const outputs = {
    "result": null
  }
    
  const method = getAgentTaskMethod(useAgents.getState().agents);

  if (!method)
    throw new Error("Agent task method not found");

  chain.steps[n.id] = {
    method: `${method.agentId}/${method.name}`,
    inputs,
    outputs,
  }

  return {}
})

export const nodeTypes = {
    method: MethodNode,
    data: DataNode,
    agentTask: AgentTaskNode
};
