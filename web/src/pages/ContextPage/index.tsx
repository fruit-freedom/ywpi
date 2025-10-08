import { useQuery, useQueryClient } from "react-query";
import { useParams } from "react-router-dom"
import { Context } from "../../api/types";
import { Box, Paper, Stack, Switch, Tooltip, Typography } from "@mui/material";
import { Agent, Method, useAgents } from "../../store/store";
import { AgentStatus, useEvents } from "../../hooks/useEvents";
import { useMemo, useState } from "react";
import { COMPONENTS } from "../../components/MethodCard/MethodCard";
import { Button } from "../../components/Button";
import { useForm } from "react-hook-form";
import { executeMethodAsync } from "../../api";
import contexts from "../../external/contexts";

// import { Chat } from "../../external/contexts/Chat";
import { MarkdownContext } from "../../external/contexts/Markdown";
import { ContextProps } from "./types";
import { Markdown } from "../../components/Markdown";


const AgentMethodsList = ({ agent, onClick }: { agent: Agent, onClick?: (m: Method, a: Agent) => void; }) => {
    return (
        <Stack gap={'0.2rem'}>
            {
                agent.methods.map(e => (
                    <Paper elevation={4} key={e.name}>
                        <Box
                            padding={'0.5rem'}
                            sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'lightgray' } }}
                            onClick={() => onClick?.(e, agent)}
                        >
                            <Typography>{agent.id} / {e.name}</Typography>
                        </Box>
                    </Paper>
                ))                
            }
        </Stack>
    )
}

const applyUpdate = (contextId: string, update: any, shadow_update = false) => {
    return fetch(`/api/projects/_/contexts/${contextId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            update,
            shadow_update
        })
    })
}

const setSubscribtions = (contextId: string, subscribtions: any) => {
    return fetch(`/api/projects/_/contexts/${contextId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            subscribtions
        })
    })
}

const mockAgentTooltip = `
This agent listening for **@issue** tag and
recommend to create issues in actions panel.
`


export const ContextPage = () => {
    const { projectId, contextId } = useParams();

    const queryClient = useQueryClient();

    const { data: context } = useQuery<Context>({
        queryFn: () => fetch(`/api/projects/${projectId}/contexts/${contextId}`).then(e => e.json()),
        queryKey: ['projects', projectId, 'contexts', contextId]
    });

    const { agents } = useAgents();
    const { } = useEvents({
        onEvent: (event) => {
            const outputs = event.data.outputs;
            if (outputs !== undefined) {
                if (outputs.type == "ContextUpdate") {
                    const contextId = outputs.data.context_id;

                    /// TODO: Use event apply
                    if (contextId === contextId) {
                        queryClient.invalidateQueries(['projects', projectId, 'contexts', contextId]);
                    }
                }
            }
        }
    });

    const agentMethods = useMemo(() => {
        const pairs: { agent: Agent, method: Method }[] = [];
        agents
        // .filter(a => a.status === AgentStatus.Connected)
        .forEach(a => {
            a.methods.forEach(m => {
                pairs.push({
                    agent: a,
                    method: m
                })
            })
        });
        return pairs.filter(p => p.method.inputs.find(i => i.type.name === 'Context'));
    }, [agents]);

    const contextProps = {
        data: context?.data,
        contextId: context?.id,
        applyContextUpdate: (update) => {
            applyUpdate(context?.id, update)
            .then(e => queryClient.invalidateQueries(['projects', projectId, 'contexts', context?.id]))
        },
        forceContextRefetch: () => queryClient.invalidateQueries(['projects', projectId, 'contexts', context?.id]),
    } as ContextProps;

    return (
        <Stack direction={'row'} gap={'1rem'} padding={'1rem'}>
            <Stack width={'15%'} gap={'0.2rem'}>
                <Typography fontWeight={700}>Subscribtions</Typography>
                {
                    agentMethods.map(e => (
                        <Tooltip
                            key={e.agent.id + e.method.name}
                            title={
                            <Markdown>{mockAgentTooltip}</Markdown>
                            }
                        >
                            <Paper elevation={4} key={e.agent.id + e.method.name}>
                                <Stack
                                    direction={"row"}
                                    justifyContent={"space-between"}
                                    padding={'0.5rem'}
                                >
                                    <Typography>{e.agent.id} / {e.method.name}</Typography>
                                    <Switch
                                        size="small"
                                        onChange={
                                            (_, n) => setSubscribtions(
                                                contextId,
                                                n
                                                ?
                                                [...context?.subscribtions, { agent_id: e.agent.id, method_name: e.method.name }]
                                                :
                                                context?.subscribtions.filter(s => !(s.agent_id === e.agent.id && s.method_name === e.method.name))
                                            )
                                            .then(e => queryClient.invalidateQueries(['projects', projectId, 'contexts', contextId]))
                                        }
                                        checked={
                                            Boolean(
                                                context?.subscribtions.find(s => s.agent_id === e.agent.id && s.method_name === e.method.name)
                                            )
                                        }
                                    />
                                </Stack>
                            </Paper>
                        </Tooltip>
                    ))
                }
            </Stack>
            <Stack flexGrow={1} gap={'2rem'}>
                <Stack border={'1px solid lightgrey'} borderRadius={'4px'} maxHeight={'825px'} overflow={'auto'}>
                    {
                        context ?
                        <>
                            {/* {
                                context.tp === "chat" ? <Chat {...contextProps}/> : null
                            } */}
                            {
                                context.tp === "markdown" ? <MarkdownContext {...contextProps}/> : null
                            }
                        </>
                        : null
                    }
                    {/* {
                        context ?
                        (
                            contexts.has(context.tp) ?
                            <>
                                {contexts.get(context.tp)({ data: context.data })}
                            </>
                            :
                            <pre style={{ maxHeight: '60vh', overflow: 'auto' }}>
                                {JSON.stringify(context.data, null, 2)}
                            </pre>
                        )
                        : null
                    } */}
                </Stack>
            </Stack>
        </Stack>
    )
}