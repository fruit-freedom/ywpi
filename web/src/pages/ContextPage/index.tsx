import { useQuery, useQueryClient } from "react-query";
import { useNavigate, useParams } from "react-router-dom"
import { Box, Button, Collapse, Fade, IconButton, Paper, Stack, styled, Switch, Tooltip, Typography } from "@mui/material";
import { Agent, Method, useAgents } from "../../store/store";
import { AgentStatus, useEvents } from "../../hooks/useEvents";
import { useEffect, useMemo, useState } from "react";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import contexts from "../../external/contexts";
import MenuIcon from '@mui/icons-material/Menu';

import { Chat } from "../../external/contexts/Chat";
import { EditableMarkdown, MarkdownContext } from "../../external/contexts/Markdown";
import { ContextProps } from "./types";
import { Markdown } from "../../components/Markdown";
import Link from "../../components/Link";
import { Context, getContext, getContexts } from "../../api/context";
import CloseIcon from '@mui/icons-material/Close';

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

const mockContextStack = `
#### Rules

1. Issue MUST has **TO BE** and **AS IS** sections
`

const MenuButton = styled(MenuIcon)({
    cursor: 'pointer',
    padding: 1,
    width: '2rem',
    height: '2rem',
    ":hover": {
        backgroundColor: "lightgrey"
    },
})

export const ContextPage = () => {
    const { projectId, contextId } = useParams();

    const { data: projectContexts } = useQuery<Context[]>({
        queryFn: () => getContexts(projectId),
        queryKey: ['projects', projectId, 'contexts'],
    });
    
    const queryClient = useQueryClient();

    const { data: context } = useQuery<Context>({
        queryFn: () => getContext(projectId, contextId),
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

    const navigate = useNavigate();

    useEffect(() => {
        const onKeydown = (e: any) => {
            if ((e.ctrlKey || e.metaKey) && e.keyCode === 68) { // Ctrl + D
                e.preventDefault();
                navigate(-1);
            }
            else if ((e.ctrlKey || e.metaKey) && e.keyCode === 70) { // Ctrl + F
                e.preventDefault();
                navigate(1);
            }
        }
        document.addEventListener("keydown", onKeydown);

        return () => document.removeEventListener("keydown", onKeydown);
    }, [navigate]);

    const agentMethods = useMemo(() => {
        const pairs: { agent: Agent, method: Method }[] = [];
        agents
        .filter(a => a.status === AgentStatus.Connected)
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

    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (!context)
        return null;

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
        <Stack direction={'row'} gap={'0.5rem'} padding={'0.5rem'}>
            <Stack gap={'1.5rem'}>
                <MenuButton onClick={() => setSidebarOpen(prev => !prev)}/>
                <Link to={`/projects/${context.project_id}`}>
                    <Stack
                        direction={'row'}
                        gap={1}
                        sx={{ "&:hover": { backgroundColor: "lightgrey" }, borderRadius: "4px" }}
                    >
                        <ArrowBackIcon sx={{ width: '32px' }}/>
                    </Stack>
                </Link>
                <Collapse in={sidebarOpen} unmountOnExit orientation="horizontal">
                    <Stack gap={4} minWidth={"15rem"}>
                        {/* <Stack gap={'0.2rem'}>
                            <Typography fontWeight={700}>Subscribtions</Typography>
                            {
                                agentMethods.map(e => (
                                    <Tooltip
                                        key={e.agent.id + e.method.name}
                                        title={<Markdown>{mockAgentTooltip}</Markdown>}
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
                                                            context.id,
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
                        </Stack> */}
                        <Stack>
                            <Typography fontWeight={700}>Project contexts</Typography>
                            <Stack gap={1} maxHeight={"50rem"} overflow={"scroll"}>
                                {
                                    projectContexts?.filter(e => true).map(e => (
                                        <Link to={`/projects/${projectId}/contexts/${e.id}`}>
                                            <Paper key={e.id} className="hover">
                                                <Stack padding={1}>
                                                    <Typography>{e.name}</Typography>
                                                    <Typography variant='caption'>{e.tp}</Typography>
                                                </Stack>
                                            </Paper>
                                        </Link>
                                    ))
                                }
                            </Stack>
                        </Stack>
                    </Stack>
                </Collapse>
            </Stack>
            <Stack flexGrow={1} gap={'2rem'}>
                <Stack border={'1px solid lightgrey'} borderRadius={'4px'} maxHeight={'825px'} overflow={'auto'}>
                    {
                        context ?
                        <>
                            {
                                context.tp === "chat" ? <Chat {...contextProps}/> : null
                            }
                            {
                                context.tp === "markdown" ? <MarkdownContext {...contextProps}/> : null
                            }
                        </>
                        : null
                    }
                </Stack>
            </Stack>
        </Stack>
    )
}
