import { useEffect, useRef, useState } from "react"
import { useAgents, Agent } from "../store/store";

export enum ConnectionStateEnum {
    connected = 'connected',
    disconnected = 'disconnected',
    connecting = 'connecting',
}

enum EventType {
    AgentConnected = 'agent.connected',
    AgentDisconnected = 'agent.disconnected',
    TaskCreated = 'task.created',
    TaskUpdated = 'task.updated',
}

interface Event {
    type: EventType;
    timestamp: string;
    data: any;
}

interface AgentDisconnectedData {
    id: string;
}

interface Input {
    name: string;
    type: string;
}

interface Output {
    name: string;
    type: string;
    value: any;
}

interface Task {
    id: string;
    status: string;
    method: string;
    inputs: any;
    outputs?: any;
}

interface Type {
    name: string;
    args?: Type[];
}

interface Field {
    name: string;
    type: Type;
}

export interface Method {
    name: string;
    description?: string;
    inputs: Field[];
    outputs: Field[];
}

export enum AgentStatus {
    Connected = 'connected',
    Disconnected = 'disconnected',
}

export interface AgentConnectedData {
    id: string;
    name: string;
    project?: string;
    status: AgentStatus;
    description?: string;
    methods: Method[];
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

// export const useEvents = () => {
//     const [connectionState, setconnectionState] = useState<ConnectionStateEnum>(ConnectionStateEnum.disconnected);
//     const { addTask, updateTaskStatus, updateTaskOutputs, updateAgentStatus, addOrUpdateAgentActivity } = useAgents();

//     useEffect(() => {
//         const socket = new WebSocket(`ws://localhost:5011/api/ws`);
//         // const socket = new WebSocket(`ws://${window.location.host}/api/ws`);

//         socket.onopen = (e) => {
//             setconnectionState(ConnectionStateEnum.connected);
//         };
  
//         socket.onmessage = e => {
//             const event = JSON.parse(e.data) as Event;
//             console.log(event)

//             if (event.type == EventType.AgentConnected) {
//                 const data = event.data as AgentConnectedData;
//                 addOrUpdateAgentActivity(data)
//             }
//             else if (event.type == EventType.AgentDisconnected) {
//                 const agentId = (event.data as AgentDisconnectedData).id;
//                 updateAgentStatus(agentId, AgentStatus.Disconnected);
//             }
//             else if (event.type == EventType.TaskCreated) {
//                 const data = event.data as TaskCreatedData;
//                 addTask(data.agent_id, { id: data.id, status: data.status, inputs: data.inputs, method: data.method });
//             }
//             else if (event.type == EventType.TaskUpdated) {
//                 const data = event.data as TaskUpdatedData;
//                 if (data.status) {
//                     updateTaskStatus(data.agent_id, data.id, data.status);
//                 }
//                 else if (data.outputs) {
//                     updateTaskOutputs(data.agent_id, data.id, data.outputs);
//                 }
//             }
//         };

//         socket.onclose = e => {
//             setconnectionState(ConnectionStateEnum.disconnected);
//         };
//     }, []);

//     return {
//         connectionState
//     };
// }

export const useEvents = () => {
    const [connectionState, setConnectionState] = useState<ConnectionStateEnum>(ConnectionStateEnum.disconnected);
    const { addTask, updateTaskStatus, updateTaskOutputs, updateAgentStatus, addOrUpdateAgentActivity, setAgents } = useAgents();

    const sockRef = useRef<WebSocket | null>();

    useEffect(() => {
        fetch('/api/agents')
        .then(e => e.json())
        .then(agents => setAgents(agents.map((e: any) => ({ ...e, tasks: [] }))))
    }, []);

    useEffect(() => {
        const handleOpen = (e: any) => {
            setConnectionState(ConnectionStateEnum.connected);
        };

        const handleMessage = (e: any) => {
            const event = JSON.parse(e.data) as Event;
            console.log(event)

            if (event.type == EventType.AgentConnected) {
                const data = event.data as AgentConnectedData;
                addOrUpdateAgentActivity(data)
            }
            else if (event.type == EventType.AgentDisconnected) {
                const agentId = (event.data as AgentDisconnectedData).id;
                updateAgentStatus(agentId, AgentStatus.Disconnected);
            }
            else if (event.type == EventType.TaskCreated) {
                const data = event.data as TaskCreatedData;
                addTask(data.agent_id, { id: data.id, status: data.status, inputs: data.inputs, method: data.method });
            }
            else if (event.type == EventType.TaskUpdated) {
                const data = event.data as TaskUpdatedData;
                if (data.status) {
                    updateTaskStatus(data.agent_id, data.id, data.status);
                }
                else if (data.outputs) {
                    updateTaskOutputs(data.agent_id, data.id, data.outputs);
                }
            }
        };

        const connect = () => {
            setConnectionState(ConnectionStateEnum.connecting);

            sockRef.current = new WebSocket(`ws://localhost:5011/api/ws`);
            sockRef.current.onclose = () => {
                setConnectionState(ConnectionStateEnum.disconnected);
                // setTimeout(() => connect(), 1000);
                // sockRef.current?.close();
            };
            sockRef.current.onerror = () => {
                setConnectionState(ConnectionStateEnum.disconnected);
                // setTimeout(() => connect(), 1000);
            };
            sockRef.current.onopen = handleOpen;
            sockRef.current.onmessage = handleMessage;
        }

        connect();

        return () => {
            if (sockRef.current)
                sockRef.current.close();
        }
    }, []);

    return {
        connectionState
    };
}


