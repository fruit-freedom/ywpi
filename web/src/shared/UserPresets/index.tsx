import { Paper, Stack, Typography  } from "@mui/material";
import { useAgents } from "../../store/store";
import { useUserPresets } from "./store";
import AgentTaskBlock from "./AgentTaskBlock";
import CompletitionBlock from "./CompletitionBlock";


const UserPresets = () => {
    const { agents } = useAgents();

    const { completitionMethod, setCompletitionMethod, agentTaskMethod, setAgentTaskMethod } = useUserPresets();

    return (
        <>
            <Stack
                position={"fixed"}
                bottom={"2rem"}
                right={"2rem"}
            >
                <Paper>
                    <Stack gap={1} padding={1}>
                        <Typography>Active algorithms</Typography>
                        <CompletitionBlock
                            agents={agents}
                            activeMethod={completitionMethod}
                            onChange={setCompletitionMethod}
                        />
                        <AgentTaskBlock 
                            agents={agents}
                            activeMethod={agentTaskMethod}
                            onChange={setAgentTaskMethod}
                        />
                    </Stack>                    
                </Paper>
            </Stack>
        </>
    )
}

export default UserPresets;