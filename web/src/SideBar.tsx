import React, { useEffect, useState } from "react"
import { Box, Typography, Accordion, AccordionDetails, AccordionSummary, Stack, IconButton, Menu, MenuItem } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';

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
                                        <Stack
                                            direction={'row'}
                                            justifyContent={'space-between'}
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
                                            {/* <Box>
                                                <IconButton
                                                    size='small'
                                                    sx={{ padding: 0, borderRadius: '4px' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                    }}
                                                >
                                                    <AddIcon />
                                                </IconButton>
                                            </Box> */}
                                        </Stack>
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
