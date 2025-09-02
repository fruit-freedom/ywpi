import { useQuery, useQueryClient } from "react-query";
import { useParams } from "react-router-dom"
import { Context } from "../../api/types";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { Agent, Method, useAgents } from "../../store/store";
import { AgentStatus, useEvents } from "../../hooks/useEvents";
import { useMemo, useState } from "react";
import { COMPONENTS } from "../../components/MethodCard/MethodCard";
import { Button } from "../../components/Button";
import { useForm } from "react-hook-form";
import { executeMethodAsync } from "../../api";
import contexts from "../../external/contexts";

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

export const ContextPage = () => {
    const { projectId, contextId } = useParams();

    const queryClient = useQueryClient();

    const { data: context } = useQuery<Context>({
        queryFn: () => fetch(`/api/projects/${projectId}/contexts/${contextId}`).then(e => e.json()),
        queryKey: ['projects', projectId, 'contexts', contextId]
    });

    const [activeAgentMethod, setActiveAgentMethod] = useState<{ agent: Agent, method: Method }>();

    const { agents } = useAgents();
    const { } = useEvents({
        onEvent: (event) => {
            const outputs = event.data.outputs;
            if (outputs !== undefined) {
                const update = outputs['$context_update'];
                if (update !== undefined) {
                    const contextId = update['$id'];

                    /// TODO: Use event apply
                    if (contextId === contextId) {
                        console.log('Update', update)
                        queryClient.invalidateQueries(['projects', projectId, 'contexts', contextId]);
                    }
                }
            }
        }
    });

    const { register, handleSubmit, setValue, control } = useForm({  });

    const onValidSubmit = (data: any) => {
        if (activeAgentMethod) {
            const contextParams = activeAgentMethod.method.inputs
                .filter(e => e.type.name === 'context')
                .reduce((prev, cur) => {
                    prev[cur.name] = {
                        id: context?.id,
                        tp: context?.tp
                    }
                    return prev;
                }, {});

            executeMethodAsync(
                activeAgentMethod.agent.id,
                activeAgentMethod.method.name,
                { ...data, ...contextParams }
            );
        }
    }

    const agentMethods = useMemo(() => {
        const pairs: { agent: Agent, method: Method }[] = [];
        agents.filter(a => a.status === AgentStatus.Connected).forEach(a => {
            a.methods.forEach(m => {
                pairs.push({
                    agent: a,
                    method: m
                })
            })
        });

        return pairs.filter(p => p.method.inputs.find(i => i.type.name === 'context'));
    }, [agents]);

    return (
        <Stack direction={'row'} gap={'1rem'} padding={'1rem'}>
            <Stack width={'20%'} gap={'0.2rem'}>
                {/* {
                    agents.map(e => <AgentMethodsList key={e.id} agent={e} onClick={(m, a) => setActiveAgentMethod([a, m])}/>)
                } */}
                {
                    agentMethods.map(e => (
                        <Paper elevation={4} key={e.agent.id + e.method.name}>
                            <Box
                                padding={'0.5rem'}
                                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'lightgray' } }}
                                bgcolor={
                                    e.agent.id === activeAgentMethod?.agent.id &&
                                    e.method.name === activeAgentMethod?.method.name
                                    ? 'lightgray' : '#fff'
                                }
                                onClick={() => setActiveAgentMethod(e)}
                            >
                                <Typography>{e.agent.id} / {e.method.name}</Typography>
                            </Box>
                        </Paper>
                    ))
                }
            </Stack>
            <Stack flexGrow={1} gap={'2rem'}>
                <Stack border={'1px solid lightgrey'}>
                    {
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
                    }
                </Stack>
                <Stack>
                    {
                        activeAgentMethod ?
                            <Box>
                                <form onSubmit={handleSubmit(onValidSubmit)}>
                                    <Box display={'flex'} flexDirection={'column'} gap={3}>
                                    {
                                        activeAgentMethod.method.inputs.filter(e => e.type.name !== 'context').map(e => (
                                            <Box key={e.name}>
                                                <Box>
                                                    <Box display={'flex'} alignItems={'center'}  gap={'0.5em'}>
                                                        <Typography fontWeight={800} variant='subtitle1' >{e.name}:</Typography>
                                                        {/* <Typography variant='subtitle1' fontStyle={'italic'}>{getTypeName(e.type)}</Typography> */}
                                                        <Typography variant='body2' color='grey' padding={'0 0.5em'} maxWidth={'30em'}>
                                                            {e.description}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                {COMPONENTS.get(e.type.name)?.({ register, name: e.name, control, setValue })}
                                            </Box>
                                        ))
                                    }
                                    <Button type="submit">Start</Button>
                                    </Box>
                                </form>
                            </Box>
                        : null
                    }
                </Stack>
            </Stack>
        </Stack>
    )
}