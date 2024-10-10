import { Box, Paper } from "@mui/material";
import React from "react"

import { useAgents } from "./store";

import { AgentCard } from "./AgentsPage";

export default function () {
    const { agents } = useAgents();

    return (
        <Box width={'16vw'}>
            <Paper>Agents</Paper>
            {
                agents.map(e => <AgentCard agent={e} />)
            }
            {/* <Paper>Tasks</Paper> */}
        </Box>
    );
}