import { Typography, Box, Chip } from "@mui/material";
import React, { useEffect, useState } from "react";




export default () => {
    const [events, setEvents] = useState([]);
    const [connectionState, setconnectionState] = useState('disconnected');

    const [agents, setAgents] = useState([]);

    useEffect(() => {
        const socket = new WebSocket(`ws://localhost:8000/api/ws`);

        socket.onopen = (e) => {
            setconnectionState('connected');
        };
  
        socket.onmessage = e => {
            console.log(e)
            const event = JSON.parse(e.data);
            setEvents(prev => [...prev, event])

            const agentId = event.instance.id;
            if (event.type == 'agent.connected') {
                setAgents(prev => [...prev, agentId]);
            }
            else {
                setAgents(prev => prev.filter(agent => agent != agentId));
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
            {
                agents.map(e => <Chip label={e} />)
            }
            </Box>
        </Box>
    );
}

