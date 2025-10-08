import { executeMethodAsync } from "../../../api";
import { AgentStatus } from "../../../hooks/useEvents";
import { Agent, Method, Field } from "../../../store/store";



// Update environment --> Environment --> Filter methods

interface MethodWithAgent extends Method {
    agentId: string;
}

export const getMethods = (agents: Agent[]): MethodWithAgent[] => {
    return agents
    .filter(e => e.status === AgentStatus.Connected)
    .reduce((acc: MethodWithAgent[], cur) => {
        acc.push(...cur.methods.map(e => ({
            agentId: cur.id,
            ...e
        })));
        return acc;
    }, [])
}

// Env: Type -> Value


interface IngestedMethod {
    name: string;
    method: () => void;
}


export const getIngestedMethods = (methods: MethodWithAgent[], env: Map<string, any>): IngestedMethod[] => {
    return methods.map(e => {
        const inputs: any = {}
        for (let input of e.inputs) {
            if (env.has(input.type.name)) {
                inputs[input.name] = env.get(input.type.name);
            }
            else {
                // console.log("Method", e.name, "require", input.type.name, "but it does not exists")
                return null;
            }
        }

        return {
            method: () => {
                return executeMethodAsync(e.agentId, e.name, inputs)
            },
            name: `${e.agentId}/${e.name}`
        }
    }).filter(e => e !== null);
}


export const getIngestedMethods_V2 = (agents: Agent[], env: Map<string, any>): IngestedMethod[] => {
    return getIngestedMethods(getMethods(agents), env);
}

