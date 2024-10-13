import { useEffect, useState } from "react"
import { useAgents, Agent } from "./store";


enum EventType {
    AgentConnected = 'agent.connected',
    AgentDisconnected = 'agent.disconnected',
    TaskCreated = 'task.created',
    TaskUpdated = 'task.updated',
}

interface Event {
    type: EventType;
    timestamp: string;
    instance: any;
}

interface AgentDisconnectedData {
    id: string;
}

export enum ConnectionStateEnum {
    connected = 1,
    disconnected = 2,
}

interface TaskCreatedData {
    id: string;
    agent_id: string;
    method: string;
    status: string;
    inputs: any;
}

interface TaskUpdatedData {
    id: string;
    agent_id: string;
    status?: string;
    outputs?: any;
}

export const useEvents = () => {
    const [connectionState, setconnectionState] = useState<ConnectionStateEnum>(ConnectionStateEnum.disconnected);
    const { addAgent, removeAgent, addTask, updateTaskStatus, updateTaskOutputs } = useAgents();

    useEffect(() => {
        const socket = new WebSocket(`ws://localhost:5011/api/ws`);
        // const socket = new WebSocket(`ws://${window.location.host}/api/ws`);


        socket.onopen = (e) => {
            setconnectionState(ConnectionStateEnum.connected);
        };
  
        socket.onmessage = e => {
            console.log(e)
            const event = JSON.parse(e.data) as Event;

            if (event.type == EventType.AgentConnected) {
                addAgent({ ...event.instance, tasks: [] } as Agent);
            }
            else if (event.type == EventType.AgentDisconnected) {
                const agentId = (event.instance as AgentDisconnectedData).id;
                removeAgent(agentId)
            }
            else if (event.type == EventType.TaskCreated) {
                const data = event.instance as TaskCreatedData;
                addTask(data.agent_id, { id: data.id, status: data.status, inputs: data.inputs, method: data.method });
            }
            else if (event.type == EventType.TaskUpdated) {
                const data = event.instance as TaskUpdatedData;
                console.log(data)
                if (data.status) {
                    updateTaskStatus(data.agent_id, data.id, data.status);
                }
                else if (data.outputs) {
                    updateTaskOutputs(data.agent_id, data.id, data.outputs);
                }
            }
        };

        socket.onclose = e => {
            setconnectionState(ConnectionStateEnum.disconnected);
        };

    }, []);

    return {
        connectionState
    };
}
