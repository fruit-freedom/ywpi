import { Agent, AgentStatus, MethodWithAgentId } from "../api";

const AGENT_TASK_METHOD_LABEL = "contexts.agent_task"
const COMPLETITION_METHOD_LABEL = "contexts.completition"

const spreadToMethods = (agents: Agent[]): MethodWithAgentId[] => {
    const methods: MethodWithAgentId[] = [];
    agents.forEach(agent => {
        agent.methods.forEach(method => {
            methods.push({
                agentId: agent.id,
                status: agent.status,
                ...method
            });
        });
    });
    return methods;
}

export const getAgentTaskMethod = (agents: Agent[]): MethodWithAgentId | undefined => {
    return spreadToMethods(agents).find(
        method => (
            method.status === AgentStatus.CONNECTED &&
            method.labels?.find(e => e.name === AGENT_TASK_METHOD_LABEL)
        )
    );
}

export const getCompletitionMethod = (agents: Agent[]): MethodWithAgentId | undefined => {
    return spreadToMethods(agents).find(
        method => (
            method.status === AgentStatus.CONNECTED &&
            method.labels?.find(e => e.name === COMPLETITION_METHOD_LABEL)
        )
    );
}
