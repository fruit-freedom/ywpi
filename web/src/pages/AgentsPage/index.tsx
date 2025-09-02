import { useEffect, useMemo } from "react";
import {
    Typography,
    Box,
    Paper,
    Stack
} from "@mui/material";

import { Agent, useAgents } from "../../store/store";
import { ConnectionStateEnum, useEvents } from "../../hooks/useEvents";
import StatusIndicator, { IndicatorColor } from "../../components/StatusIndicator";
import MethodCard from "../../components/MethodCard/MethodCard";
import { TaskCard } from "../../components/TaskCard";
import SideBar from "../../SideBar";

interface AgentCardProps {
    agent: Agent;
}

export const AgentCard = ({ agent }: AgentCardProps) => {
    return (
        <Box>
            <Paper sx={{ padding: '1em' }}>
                <Box display={'flex'} >
                    <Typography fontWeight={600} variant="h6">{agent.name}</Typography>
                    <Typography margin={'0 1em'} variant="h6">{agent.id}</Typography>
                </Box>
                <Typography>{agent.description}</Typography>
                <Typography>{}</Typography>
                <Box>
                    {
                        agent.methods.map(e => <Typography key={e.name} fontStyle={'italic'}>{e.name}()</Typography>)
                    }
                </Box>
            </Paper>
        </Box>
    );
}

export default () => {
    const { agents, activeAgentIndex, activeAgentMethodIndex, setTasks } = useAgents();
    const { connectionState } = useEvents();

    const tasks = useMemo(() => {
        if (activeAgentIndex !== null) {
            if (activeAgentMethodIndex !== null) {
                const methodName = agents[activeAgentIndex].methods[activeAgentMethodIndex].name;
                return agents[activeAgentIndex].tasks.filter(e => e.method === methodName);
            }
            return agents[activeAgentIndex].tasks;
        }
    }, [activeAgentIndex, activeAgentMethodIndex, agents]);

    useEffect(() => {
        if (activeAgentIndex !== null) {
            fetch(`/api/tasks?agent_id=${agents[activeAgentIndex].id}`)
            .then(e => e.json())
            .then(tasks => setTasks(agents[activeAgentIndex].id, tasks));
        }
    }, [activeAgentIndex]);

    return (
        <Stack direction={'row'} width={'100%'}>
            <Box>
                <SideBar />
            </Box>
            <Box padding={'0 4em'} flexGrow={1}>
                <Box>
                    {
                        activeAgentIndex !== null ?
                        (
                            activeAgentMethodIndex !== null ?
                            <MethodCard
                                key={agents[activeAgentIndex].methods[activeAgentMethodIndex].name}
                                agent={agents[activeAgentIndex]}
                                method={agents[activeAgentIndex].methods[activeAgentMethodIndex]}
                            />
                            :
                            <AgentCard agent={agents[activeAgentIndex]}/>
                        )
                        : null
                    }
                </Box>
                <Box mt={'2em'} display={'flex'} flexDirection={'column'} gap={'0.5em'}>
                    {
                        tasks?.map(task => <TaskCard task={task} key={task.id}/>)
                    }
                </Box>
            </Box>
            <Box
                display={'flex'}
                alignItems={'center'}
                gap={1}
                sx={{
                    position: 'fixed',
                    bottom: '1em',
                    right: '1em'
                }}
            >
                Server connection ({connectionState.toString()})
                <StatusIndicator color={connectionState == ConnectionStateEnum.connected ? IndicatorColor.black : IndicatorColor.white} />
            </Box>
        </Stack>
    );
}

