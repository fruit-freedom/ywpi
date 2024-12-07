import React, { useEffect } from "react"
import { Box, Typography, Accordion, AccordionDetails, AccordionSummary } from "@mui/material";

import { useAgents } from "./store/store";
import StatusIndicator from "./components/StatusIndicator";
import { IndicatorColor } from "./components/StatusIndicator";
import { AgentStatus } from "./hooks/useEvents";


export default function () {
    const { agents, setActiveAgentIndex, setActiveAgentMethodIndex } = useAgents();

    useEffect(() => {
        if (!agents.length) {
            setActiveAgentIndex(null);
            setActiveAgentMethodIndex(null);
        }
    }, [agents]);

    return (
        <Box width={'30em'}>
            <Box>
                {
                    agents.map((agent, agentIndex) => (
                        <Accordion
                            disableGutters
                            onChange={(e, expanded) => {
                                setActiveAgentIndex(agentIndex);
                                setActiveAgentMethodIndex(null);
                            }}
                            key={agent.id}
                        >
                            <AccordionSummary sx={{ '&:hover': { backgroundColor: '#efefef' } }}>
                                <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                                    <Box display={'flex'} alignItems={'center'} gap={1}>
                                        <StatusIndicator
                                            color={ agent.status == AgentStatus.Connected ? IndicatorColor.black : IndicatorColor.white }
                                        />
                                        <Typography fontWeight={'600'}>{agent.project ? `${agent.project} / ` : ''}{agent.name}</Typography>
                                        <Typography variant="body2" color="grey" >{agent.id}</Typography>
                                    </Box>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ padding: 0 }}>
                                {
                                    agent.methods.map((method, methodIndex) => (
                                        <Box
                                            padding={'0.2em 2em'}
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': { backgroundColor: '#efefef' }
                                            }}
                                            onClick={() => {
                                                setActiveAgentIndex(agentIndex);
                                                setActiveAgentMethodIndex(methodIndex);
                                            }}
                                            key={method.name}
                                        >
                                            <Typography fontWeight={'600'}>{method.name}</Typography>
                                        </Box>
                                    ))
                                }
                            </AccordionDetails>
                        </Accordion>
                    ))
                }
            </Box>
        </Box>
    );
}
