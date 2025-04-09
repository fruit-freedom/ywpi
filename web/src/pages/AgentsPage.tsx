import React, { useEffect, useMemo, useState } from "react";
import {
    Typography, Box, Chip, Paper,
    SpeedDial, Button, Accordion,
    AccordionSummary, AccordionDetails,
    Divider, TextareaAutosize, TextField,
    Stack
} from "@mui/material";
import styled from "@mui/material/styles/styled";
import ForwardOutlinedIcon from '@mui/icons-material/ForwardOutlined';

import { Agent, Method, Task, useAgents } from "../store/store";
import { ConnectionStateEnum, useEvents } from "../hooks/useEvents";
import StatusIndicator, { IndicatorColor } from "../components/StatusIndicator";
import MethodCard from "../components/MethodCard/MethodCard";

import Markdown from "react-markdown";
import SyntaxHighlighter from 'react-syntax-highlighter';

enum EventType {
    AgentConnected = 'agent.connected',
    AgentDisconnected = 'agent.disconnected',
    TaskCreated = 'task.created',
    TaskUpdated = 'task.updated',
}

interface Event {
    type: EventType;
    timestamp: string;
    instance: any;
}

interface AgentDisconnectedData {
    id: string;
}

interface AgentCardProps {
    agent: Agent;
}

export const AgentCard = ({ agent }: AgentCardProps) => {
    return (
        <Box>
            <Paper sx={{ padding: '1em' }}>
                <Box display={'flex'} >
                    <Typography fontWeight={600} variant="h6">{agent.name}</Typography>
                    <Typography margin={'0 1em'} variant="h6">{agent.id}</Typography>
                </Box>
                <Typography>{agent.description}</Typography>
                <Box>
                    {
                        agent.methods.map(e => <Typography key={e.name} fontStyle={'italic'}>{e.name}()</Typography>)
                    }
                </Box>
            </Paper>
        </Box>
    );
}

interface TaskCardProps {
    task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
    return (
        <Accordion disableGutters elevation={4}>
            <AccordionSummary>
                <Box display={'flex'} alignItems={'center'} gap={'1em'}>
                    <Typography fontWeight={600}>ID {task.id}</Typography>
                    <Typography color='grey' variant='body2'>{task.status}</Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Box>
                    <Typography variant='subtitle1' fontWeight={800}>Inputs</Typography>
                    {
                        Object.entries(task.inputs).map((k) => (
                            <Box key={k[0]} display={'flex'} gap={2}>
                                <Typography fontWeight={600}>{k[0]}</Typography>
                                <Typography>{JSON.stringify(k[1], null, 2)}</Typography>
                            </Box>
                        ))
                    }
                </Box>
                <Box>
                    <Typography variant='subtitle1' fontWeight={800}>Outputs</Typography>
                    {
                        task.outputs ?
                        Object.entries(task.outputs).map(e => {
                            return (
                                <Stack>
                                    <Typography fontWeight={700}>{e[0]}</Typography>
                                    {
                                        typeof e[1] === 'string'
                                        ?
                                        <Markdown
                                        components={{
                                            code(props) {
                                                const {children, className, node, ...rest} = props;
                                                const match = /language-(\w+)/.exec(className || '');
                                                return (match ?
                                                    <SyntaxHighlighter
                                                        {...rest}
                                                        PreTag="div"
                                                        children={String(children).replace(/\n$/, '')}
                                                        language={match[1]}
                                                    />
                                                    :
                                                    <code {...rest} className={className}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                        >
                                            {e[1]}
                                        </Markdown>
                                        :
                                        <Typography whiteSpace={' '}>
                                            {JSON.stringify(e[1], null, 2)}
                                        </Typography>
                                    }
                                </Stack>
                            )
                        })
                        : null
                    }
                </Box>
            </AccordionDetails>
        </Accordion>

    )
}

export default () => {
    const { agents, setAgents, activeAgentIndex, activeAgentMethodIndex, setTasks } = useAgents();
    const { connectionState } = useEvents();

    // useEffect(() => {
    //     fetch('/api/agents')
    //     .then(e => e.json())
    //     .then(agents => setAgents(agents.map((e: any) => ({ ...e, tasks: [] }))))
    // }, []);

    const tasks = useMemo(() => {
        if (activeAgentIndex !== null) {
            if (activeAgentMethodIndex !== null) {
                const methodName = agents[activeAgentIndex].methods[activeAgentMethodIndex].name;
                return agents[activeAgentIndex].tasks.filter(e => e.method === methodName);
            }
            return agents[activeAgentIndex].tasks;
        }
    }, [activeAgentIndex, activeAgentMethodIndex, agents]);

    useEffect(() => {
        if (activeAgentIndex !== null) {
            fetch(`/api/tasks?agent_id=${agents[activeAgentIndex].id}`)
            .then(e => e.json())
            .then(tasks => setTasks(agents[activeAgentIndex].id, tasks));
        }
    }, [activeAgentIndex]);

    return (
        <Box padding={'0 4em'} width={'50%'}>
            <Box>
                {
                    activeAgentIndex !== null ?
                    (
                        activeAgentMethodIndex !== null ?
                        <MethodCard
                            key={agents[activeAgentIndex].methods[activeAgentMethodIndex].name}
                            agent={agents[activeAgentIndex]}
                            method={agents[activeAgentIndex].methods[activeAgentMethodIndex]}
                        />
                        :
                        <AgentCard agent={agents[activeAgentIndex]}/>
                    )
                    : null
                }
            </Box>
            <Box mt={'2em'} display={'flex'} flexDirection={'column'} gap={'0.5em'}>
                {
                    tasks?.map(task => <TaskCard task={task} key={task.id}/>)
                }
            </Box>
            <Box
                display={'flex'}
                alignItems={'center'}
                gap={1}
                sx={{
                    position: 'fixed',
                    bottom: '1em',
                    right: '1em'
                }}
            >
                Server connection ({connectionState.toString()})
                <StatusIndicator color={connectionState == ConnectionStateEnum.connected ? IndicatorColor.black : IndicatorColor.white} />
            </Box>
        </Box>
    );
}

