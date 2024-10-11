import { Typography, Box, Chip, Paper, SpeedDial } from "@mui/material";
import React, { useEffect, useState } from "react";

import { Agent, Method, useAgents } from "./store";
import { ConnectionStateEnum, useEvents } from "./hooks";
import StatusIndicator, { IndicatorColor } from "./components/StatusIndicator";

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
        <Box width={'40em'}>
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

interface AgentMethodCardProps {
    method: Method;
}

const AgentMethodCard = ({ method }: AgentMethodCardProps) => {
    return (
        <Box width={'40em'}>
            <Paper sx={{ padding: '1em' }}>
                <Box display={'flex'} flexDirection={'column'}>
                    <Typography fontWeight={600} variant="h3">{method.name}</Typography>
                    <Typography color="grey" variant='body2'>Method provides ability to predict cars, trees and road.</Typography>
                </Box>
                <Typography mt={'1em'} fontWeight={600} variant="h5">Inputs</Typography>
                <Box>
                    {
                        method.inputs.map(e => (
                            <Box display={'flex'} gap={1} key={e.name}>
                                <Typography fontWeight={600} variant='subtitle1'>{e.name}:</Typography>
                                <Typography variant='subtitle1' fontStyle={'italic'}>{e.type}</Typography>
                            </Box>
                        ))
                    }
                </Box>
            </Paper>
        </Box>
    );
}


export default () => {
    const { agents, addAgent, removeAgent, setAgents, activeAgentIndex, activeAgentMethodIndex } = useAgents();
    const { connectionState } = useEvents();

    useEffect(() => {
        fetch('/api/agents')
        .then(e => e.json())
        .then(agents => setAgents(agents))
    }, []);

    return (
        <Box padding={'0 4em'}>
            <Box>
                {
                    activeAgentIndex !== null ?
                    (
                        activeAgentMethodIndex !== null ?
                        <AgentMethodCard method={agents[activeAgentIndex].methods[activeAgentMethodIndex]}/>
                        :
                        <AgentCard agent={agents[activeAgentIndex]}/>
                    )
                    : null
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

