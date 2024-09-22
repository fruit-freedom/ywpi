import { Typography, Box } from "@mui/material";
import React, { useEffect, useState } from "react";




export default () => {
    const [events, setEvents] = useState([]);
    const [connectionState, setconnectionState] = useState('disconnected');

    useEffect(() => {
        const socket = new WebSocket(`ws://localhost:8000/api/ws`);

        socket.onopen = (e) => {
            setconnectionState('connected');
        };
  
        socket.onmessage = e => {
            setEvents(prev => [...prev, JSON.parse(e.data)])
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
            {
                events.map(e => (
                    <Box key={e.id}>
                        {JSON.stringify(e.message)}
                    </Box>
                ))
            }
            </Box>
        </Box>
    );
}

