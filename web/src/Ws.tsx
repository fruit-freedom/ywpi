import { Typography, Box, Chip, Paper } from "@mui/material";
import React, { useEffect, useState } from "react";



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

interface Input {
    name: string;
    type: string;
}

interface Method {
    name: string;
    inputs: Input[];
}

interface Agent {
    id: string;
    name: string;
    methods: Method[];
}

interface AgentDisconnectedData {
    id: string;
}

interface AgentCardProps {
    agent: Agent;
}

const AgentCard = ({ agent }: AgentCardProps) => {
    return (
        <Box width={'40em'}>
            <Paper sx={{ padding: '1em' }}>
                <Box display={'flex'} >
                    <Typography fontWeight={600} variant="h6">{agent.name}</Typography>
                    <Typography margin={'0 1em'} variant="h6">{agent.id}</Typography>
                </Box>
                <Box>
                    {
                        agent.methods.map(e => <Typography fontStyle={'italic'}>{e.name}()</Typography>)
                    }
                </Box>
            </Paper>
        </Box>
    );
}


export default () => {
    const [events, setEvents] = useState([]);
    const [connectionState, setconnectionState] = useState('disconnected');

    const [agents, setAgents] = useState<Array<Agent>>([]);

    useEffect(() => {
        const socket = new WebSocket(`ws://localhost:8000/api/ws`);

        socket.onopen = (e) => {
            setconnectionState('connected');
        };
  
        socket.onmessage = e => {
            console.log(e)
            const event = JSON.parse(e.data) as Event;

            if (event.type == EventType.AgentConnected) {
                setAgents(prev => [...prev, event.instance as Agent]);
            }
            else {
                const agentId = (event.instance as AgentDisconnectedData).id;
                setAgents(prev => prev.filter(agent => agent.id !== agentId));
            }
        };

        socket.onclose = e => {
            setconnectionState('disconnected');
        };

    }, []);

    return (
        <Box>
            <Typography variant="h4">Websocket events</Typography>
            <Typography variant="h4">Connection state: {connectionState}</Typography>
            <Box>
            {/* {
                events.map(e => (
                    <Box key={e.timestamp}>
                        {JSON.stringify(e)}
                    </Box>
                ))
            } */}
            {/* {
                agents.map(e => <Chip label={e} />)
            } */}
            {
                agents.map(e => <AgentCard agent={e} />)
            }
            </Box>
        </Box>
    );
}

