import { Box } from "@mui/material"
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
                if (input.type === 'text') {
                    if (!methods.has('text')) {
                        methods.set('text', []);
                    }
                    methods.get('text')?.push({ ...method, agentId: agent.id })
                }

                if (input.type === 'pdf') {
                    if (!methods.has('pdf')) {
                        methods.set('pdf', []);
                    }
                    methods.get('pdf')?.push({ ...method, agentId: agent.id })
                }
            })
        });
    });

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
        console.log(methods);
    }, [agents]);

    return (
        <>
            {
                projectId ?
                <>
                    <Box width={'10rem'} position={'absolute'} top={'0.4rem'} left={'0.4rem'} zIndex={999}>
                        <BoardSidebar projectId={projectId} />
                    </Box>
                    <Board
                        projectId={projectId ? projectId : ''}
                    />
                </>
                : null
            }
        </>
    );
};