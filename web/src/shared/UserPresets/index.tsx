import { Stack  } from "@mui/material";
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
                border={"1px solid lightgrey"}
                position={"fixed"}
                bottom={"2rem"}
                right={"2rem"}
                padding={1}
                gap={1}
            >
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
        </>
    )
}

export default UserPresets;