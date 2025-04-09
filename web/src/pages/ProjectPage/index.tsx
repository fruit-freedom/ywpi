import { Box, Stack } from "@mui/material"
import React, { useEffect } from 'react';

import '@xyflow/react/dist/style.css';
import './index.css'
import { useParams } from "react-router-dom";
import { Agent, useAgents } from "../../store/store";
import { AgentStatus, useEvents } from "../../hooks/useEvents";
import { MethodWithAgentId, useMethods } from "./store/methods";
import Board from "./components/Board";
import { BoardSidebar } from "./components/BoardSidebar";

const buildSuitedTypeMethods = (agents: Agent[]): Map<string, MethodWithAgentId[]> => {
    const methods = new Map<string, MethodWithAgentId[]>();

    agents.forEach((agent) => {
        if (agent.status !== AgentStatus.Connected)
            return;

        agent.methods.forEach((method) => {
            method.inputs.forEach(input => {
                if (input.type.name === 'text') {
                    if (!methods.has('text')) {
                        methods.set('text', []);
                    }
                    methods.get('text')?.push({ ...method, agentId: agent.id })
                }

                if (input.type.name === 'pdf') {
                    if (!methods.has('pdf')) {
                        methods.set('pdf', []);
                    }
                    methods.get('pdf')?.push({ ...method, agentId: agent.id })
                }

                if (input.type.name === 'object') {
                    let typeName = 'object';
                    if (input.type.args?.length) {
                        typeName += `[${input.type.args[0].name}]`;
                    }

                    if (!methods.has(typeName)) {
                        methods.set(typeName, []);
                    }
                    methods.get(typeName)?.push({ ...method, agentId: agent.id })
                }
            })
        });
    });

    console.log('methods', methods)

    return methods;
}

export default () => {
    const { projectId } = useParams();

    const { agents } = useAgents();
    const { connectionState } = useEvents();
    const { setMethods } = useMethods();

    useEffect(() => {
        const methods = buildSuitedTypeMethods(agents);
        setMethods(methods);
    }, [agents]);

    return (
        <>
            {
                projectId ?
                <Stack direction={'row'} width={'100%'} height={'calc(100vh - 65px)'} >
                    <Box>
                        <BoardSidebar projectId={projectId} />
                    </Box>
                    <Box flexGrow={1}>
                        <Board
                            projectId={projectId ? projectId : ''}
                        />
                    </Box>
                </Stack>
                : null
            }
        </>
    );
};