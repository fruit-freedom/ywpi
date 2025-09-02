import { Box, Chip, Input, Popover, Stack, styled, Switch, Typography } from "@mui/material"
import { useEffect, useMemo, useRef, useState } from "react";
import { useAgents } from "../../store/store";
import { useEvents } from "../../hooks/useEvents";
import { executeMethodAsync } from "../../api";
import { applyMongoUpdatesToObject, generateRandomString } from "./utils";
import { defaultEvents } from "./mock";
import { eventRenderersComponents } from "./EventRenderers";
import { Markdown } from "../../components/Markdown";

const Message = styled(Box)({
    display: 'flex'
})

const MessageContent = styled(Box)({
    padding: '0.2rem',
    borderRadius: '4px',
    border: '1px solid lightgrey',
})

interface Message {
    role: string,
    content: string | any
}

const defaultMessages: Message[] = [
    {
        role: 'user',
        content: 'Hello!'
    },
    {
        role: 'assistant',
        content: 'Hello, I am assistant'
    }
]



interface ChatProps {
    chat: {
        messages: Message[];
    }
    execute: (message: string) => void;
}


const LangraphNode = ({ event }: any) => {
    const path = useMemo(() => {
        return event.metadata?.langgraph_path?.join(' -> ');
    }, [event]);

    return (
        <Stack direction={'row'} gap={1}>
            <Chip size="small" label={event?.event} sx={{ width: 'min-content' }}/>
            <Chip size="small" label={event?.metadata?.langgraph_node} sx={{ width: 'min-content' }}/>
            <Chip size="small" label={path} sx={{ width: 'min-content' }}/>
        </Stack>
    )
}

const EventCard = ({ event }: any) => {
    const eventType = event.content?.event;
    const [render, setRender] = useState(true);

    return (
        <Stack gap={1}>
            <Stack gap={2} justifyContent={'space-between'} direction={'row'}>
                <LangraphNode event={event.content} />
                <Box display={'flex'} justifyContent={'flex-end'}>
                    <Switch size="small" value={render} onChange={e => setRender(prev => !prev)}/>
                </Box>
            </Stack>
            {
                eventRenderersComponents.has(eventType) && render ?
                <>
                    {eventRenderersComponents.get(eventType)({ event: event.content })}
                </>
                :
                <Markdown>
                    {JSON.stringify(event.content, null, 2)}
                </Markdown>
            }
        </Stack>
    )
}

const Chat = ({ chat, execute }: ChatProps) => {
    const [text, setText] = useState('');

    useEffect(() => {

    }, [text]);

    const messagesContainerRef = useRef();

    useEffect(() => {
        if (messagesContainerRef.current) {
            const element = messagesContainerRef.current;
            element.scrollTo(0, element.scrollHeight);
        }
    }, [chat]);

    return (
        <Stack border={'1px solid grey'} gap={1}>
            <div ref={messagesContainerRef} style={{ maxHeight: '80vh', overflow: 'scroll' }}>
                <Stack padding={'1rem'} gap={1}>
                    {
                        chat.messages.map((e, idx) => (
                            <Message position={'relative'} key={e.content + idx} justifyContent={e.role === 'user' ? 'flex-end' : 'flex-start'}>
                                <Stack>
                                    <Typography lineHeight={1} variant="caption" sx={{ color: 'grey' }}>{e.role}</Typography>
                                    {
                                        typeof e.content === 'string' ?
                                        <MessageContent>
                                            <Markdown>{e.content}</Markdown>
                                        </MessageContent>
                                        :
                                        <MessageContent>
                                            <EventCard event={e}/>
                                        </MessageContent>
                                    }
                                </Stack>
                            </Message>
                        ))
                    }
                </Stack>
            </div>
            <Stack padding={'1rem'}>
                <Input
                    value={text}
                    onKeyDown={(e) => {
                        if (e.code === 'Enter' && e.target.value.length > 0) {
                            execute(e.target.value);
                            setText('');
                        }
                    }}
                    onChange={(e) => {
                        setText(e.target.value);
                    }}
                    fullWidth
                />
            </Stack>
        </Stack>
    )
}

interface SomeEvent {
    data: {
        id: string;
        outputs?: any;
    }
}

const copyOnWriteUpdate = (obj: any, ops: any[]) => {
    const newObj = { ...obj };
    applyMongoUpdatesToObject(newObj, ops);
    return newObj;
}

interface UseExecutionProps {
}

interface ExecuteOptions {
    agentId: string;
    method: string;
    inputs: any;
    onEvent?: (outputs: any, executionId: string) => void;
}

const useExecution = ({ }: UseExecutionProps) => {
    const [eventsBuffer, setEventsBuffer] = useState<{ events: SomeEvent[], taskId?: string }>({ events: [] });

    useEvents({
        onEvent: e => {
            if (eventsBuffer.taskId !== undefined) {
                if (e.data.id !== eventsBuffer.taskId)
                    return;
            }
            setEventsBuffer(prev => ({ ...prev, events: [...prev.events, e] }));
        }
    });

    const execute = (options: ExecuteOptions) => {

        executeMethodAsync('mic-assistant', 'chat', { message, thread_id: threadId })
        .then(data => {
            const taskId = data.task_id;
            const filteredEvents = eventsBuffer.events.filter(e => e.data.id === taskId);
            if (options.onEvent) {
                filteredEvents.forEach(e => options.onEvent(e, taskId));
            }
            setEventsBuffer(prev => ({ ...prev, events: [], taskId  }));
        });
    }

    return { execute };
}


export default () => {
    const { agents } = useAgents();

    const [eventsBuffer, setEventsBuffer] = useState<{ events: SomeEvent[], taskId?: string }>({ events: [] });

    const [chat, setChat] = useState({
        // messages: defaultEvents.map(e => ({ role: 'event', content: e }))
        messages: []
    });

    const [threadId, setThreadId] = useState(() => generateRandomString());

    const { execute } = useExecution({});

    const { connectionState } = useEvents({
        onEvent: e => {
            if (eventsBuffer.taskId !== undefined) {
                if (e.data.id !== eventsBuffer.taskId)
                    return;
            }
            setEventsBuffer(prev => ({ ...prev, events: [...prev.events, e] }));

            if (e.data?.outputs?.['$push'] || e.data?.outputs?.['$set'] || e.data?.outputs?.['$concat']) {
                setChat(prev => copyOnWriteUpdate(prev, [e.data.outputs]));
            }
        }
    });

    const handleE = () => {
        execute({
            agentId: 'mic-assistant',
            method: 'chat',
            inputs: {},
            onEvent: (outputs, executionId) => {
                console.log(`Execution: [${executionId}] Outputs:`, outputs);
                setChat(prev => copyOnWriteUpdate(prev, [outputs]));
            }
        });
    }

    const handleExecute = (message: string) => {
        setEventsBuffer(prev => ({ events: [] }));

        setChat(prev => ({ ...prev, messages: [...prev.messages, { role: 'user', content: message }] }));

        executeMethodAsync('mic-assistant', 'chat', { message, thread_id: threadId })
        .then(data => {
            const taskId = data.task_id;
            const filteredEvents = eventsBuffer.events.filter(e => e.data.id === taskId);
            setEventsBuffer({
                events: filteredEvents,
                taskId
            });
            // setChat(copyOnWriteUpdate(chat, filteredEvents.filter(e => e.data?.outputs?.['$push']).map(e => e.data.outputs)));

            setChat(prev => copyOnWriteUpdate(prev, filteredEvents.filter(e => e.data?.outputs?.['$push']).map(e => e.data.outputs)));

        });
    }

    return (
        <Stack width={'100%'} justifyContent={'center'}>
            <Chat
                chat={chat}
                execute={handleExecute}
            />
        </Stack>
    )
}