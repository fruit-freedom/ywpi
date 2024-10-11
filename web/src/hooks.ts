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

export const useEvents = () => {
    const [connectionState, setconnectionState] = useState<ConnectionStateEnum>(ConnectionStateEnum.disconnected);
    const { addAgent, removeAgent } = useAgents();

    useEffect(() => {
        const socket = new WebSocket(`ws://localhost:5011/api/ws`);

        socket.onopen = (e) => {
            setconnectionState(ConnectionStateEnum.connected);
        };
  
        socket.onmessage = e => {
            console.log(e)
            const event = JSON.parse(e.data) as Event;

            if (event.type == EventType.AgentConnected) {
                addAgent(event.instance as Agent);
            }
            else {
                const agentId = (event.instance as AgentDisconnectedData).id;
                removeAgent(agentId)
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
