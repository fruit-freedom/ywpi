import React, { useEffect, useMemo, useState } from "react";
import {
    Typography, Box, Chip, Paper,
    SpeedDial, Button, Accordion,
    AccordionSummary, AccordionDetails,
    Divider, TextareaAutosize, TextField
} from "@mui/material";
import styled from "@mui/material/styles/styled";
import ForwardOutlinedIcon from '@mui/icons-material/ForwardOutlined';

import { Agent, Method, Task, useAgents } from "./store";
import { ConnectionStateEnum, useEvents } from "./hooks";
import StatusIndicator, { IndicatorColor } from "./components/StatusIndicator";
import MethodCard from "./components/MethodCard/MethodCard";

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
        <Accordion disableGutters>
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
                                <Typography>{k[1] as any}</Typography>
                            </Box>
                        ))
                    }
                </Box>
                <Box>
                    <Typography variant='subtitle1' fontWeight={800}>Outputs</Typography>
                    {
                        task.outputs ?
                        Object.entries(task.outputs).map((k) => (
                            <Box key={k[0]} display={'flex'} gap={2}>
                                <Typography fontWeight={600}>{k[0]}</Typography>
                                <Typography>{k[1] as any}</Typography>
                            </Box>
                        ))
                        : null
                    }
                </Box>
            </AccordionDetails>
        </Accordion>

    )
}

export default () => {
    const { agents, setAgents, activeAgentIndex, activeAgentMethodIndex } = useAgents();
    const { connectionState } = useEvents();

    useEffect(() => {
        fetch('/api/agents')
        .then(e => e.json())
        .then(agents => setAgents(agents.map((e: any) => ({ ...e, tasks: [] }))))
    }, []);

    const tasks = useMemo(() => {
        if (activeAgentIndex !== null) {
            if (activeAgentMethodIndex !== null) {
                const methodName = agents[activeAgentIndex].methods[activeAgentMethodIndex].name;
                return agents[activeAgentIndex].tasks.filter(e => e.method === methodName);
            }
            return agents[activeAgentIndex].tasks;
        }
    }, [activeAgentIndex, activeAgentMethodIndex, agents]);

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
                Server connection
                <StatusIndicator color={connectionState == ConnectionStateEnum.connected ? IndicatorColor.black : IndicatorColor.white} />
            </Box>
        </Box>
    );
}

