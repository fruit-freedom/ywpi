import { Autocomplete, Box, Button, Chip, Divider, IconButton, Input, Menu, MenuItem, Modal, Paper, Stack, styled, Tab, Tabs, TextField, Typography } from "@mui/material"
import React, { useEffect, useMemo, useRef, useState } from 'react';

import '@xyflow/react/dist/style.css';
import './index.css'
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { Agent, useAgents } from "../../store/store";
import { AgentStatus, useEvents } from "../../hooks/useEvents";
import { MethodWithAgentId, useMethods } from "./store/methods";
import Board from "./components/Board";
import { BoardSidebar } from "./components/BoardSidebar";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Object } from "../../api/object";
import { Markdown } from "../../components/Markdown";
import { ObjectCard } from "./components/ObjectCard";
import { ContextsList } from "./components/ContextsList";

const buildSuitedTypeMethods = (agents: Agent[]): Map<string, MethodWithAgentId[]> => {
    const methods = new Map<string, MethodWithAgentId[]>();

    agents.forEach((agent) => {
        if (agent.status !== AgentStatus.Connected)
            return;

        agent.methods.forEach((method) => {
            method.inputs.forEach(input => {
                if (input.type.name === 'text') {
                    if (!methods.has('text')) {
                        methods.set('text', []);
                    }
                    methods.get('text')?.push({ ...method, agentId: agent.id })
                }

                if (input.type.name === 'pdf') {
                    if (!methods.has('pdf')) {
                        methods.set('pdf', []);
                    }
                    methods.get('pdf')?.push({ ...method, agentId: agent.id })
                }

                if (input.type.name === 'object') {
                    let typeName = 'object';
                    if (input.type.args?.length) {
                        typeName += `[${input.type.args[0].name}]`;
                    }

                    if (!methods.has(typeName)) {
                        methods.set(typeName, []);
                    }
                    methods.get(typeName)?.push({ ...method, agentId: agent.id })
                }
            })
        });
    });

    console.log('methods', methods)

    return methods;
}

/////////////////////////////////////////////////////////////////////////////





interface FilterStringProps {
    onChange?: (query: string) => void;
}

export const FilterString = ({ onChange } : FilterStringProps) => {
    const [ms, setMs] = useState([]);

    const [text, setText] = useState('');

    const [adornments, setAdornments] = useState([]);

    const localtion = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const onEnterPressed = (value: string) => {
        setSearchParams(new URLSearchParams([['q', value]]));
        onChange?.(value);
    }

    useEffect(() => {
        const q = searchParams.get('q');
        if (q !== null) {
            onChange?.(q);
            setText(q);
        }
    }, []);

    const keywords = useMemo(() => {
        return new Set([
            // 'mr', 'is', 'Arxiv.Category', 'cs.AI',
            // 'https://gitlab.com/prj/14521/merge_requests/12412',
            // 'tp'
        ])
    }, []);

    return (
        <>
            <Input
                placeholder='Query filter by type or labels. For example "chat"'
                value={text}
                onKeyDown={(e) => {
                    console.log('e.code', e.code)

                    if (e.code === 'Tab') {
                        e.preventDefault();
                        // setAdornments(
                        //     prev => [...prev,
                        //             ...[
                        //                 <span style={{ width: 'max-content' }}>{e.target.value}</span>,
                        //                 <Chip
                        //                     key={Math.random()}
                        //                     sx={{ borderRadius: '4px', display: 'inline-block' }}
                        //                     size='small'
                        //                     label={'<text>{text}</text>'}
                        //                     color='success'
                        //                 />
                        //             ]
                        //     ]
                        // );
                        setText('');
                        return;
                    }

                    if (e.code == 'Backspace' && e.target.value.length === 0) {
                        setAdornments(prev => prev.slice(0, prev.length - 1));
                        return;
                    }

                    if (e.code === 'Enter') {
                        // onChange?.(e.target.value);
                        onEnterPressed(e.target.value)
                        setMs([...ms, e.target.value]);
                        // setText('');
                    }
                }}
                onChange={(e) => {
                    setText(e.target.value);
                    const value = e.target.value.trim()
                    if (value === 'call' || value === 'method' || keywords.has(value)) {
                        setAdornments(
                            prev => [...prev, <Chip key={Math.random()} sx={{ borderRadius: '4px' }} size='small' label={value}/>]
                        );
                        setText('');
                    }
                }}
                fullWidth
                startAdornment={
                    <Stack direction={'row'} gap={0.5}>
                        {
                            adornments.map((e, idx) => (<span key={idx}>{e}</span>))
                        }
                    </Stack>
                }
                endAdornment={
                    <Typography>search</Typography>
                }
            />
        </>
    )
};



const toParams = (query) => {
    return query ? `q=${query}` : '';
}

interface Label {
    name: string;
    value?: string;
}

interface AddLabelModalProps {
    open: boolean;
    onClose: (e?: Label) => void;
}

const AddLabelModal = ({ open, onClose } : AddLabelModalProps) => {
    const [labels, setLabels] = useState<{ value: { name: string }[]; helperText: string; error: boolean }>({
        value: [],
        helperText: 'Write labels (e.g. cs.AI, LLM, Database and etc)',
        error: false
    });

    const [text, setText] = useState('');

    return (
        <Modal open={open} onClose={() => onClose()}>
            <Stack
                padding={'1em'}
                alignItems={'center'}
                justifyContent={'center'}
                height={'100vh'}
            >
                <Stack bgcolor={'#fff'} borderRadius={'4px'} padding={'3rem'} gap={2} minWidth={'30rem'}>
                    <Typography variant="h5" textAlign={'center'} fontWeight={700}>Add label</Typography>
                    {/* <Autocomplete
                        multiple
                        options={[]}
                        freeSolo
                        onChange={(event, val) => setLabels(prev => ({ ...prev, value: val.map(e => ({ name: e })) }))}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                label="Labels"
                                placeholder="Labels"
                            />
                        )}
                    />
                    <Button
                        variant='contained'
                        sx={{ color: '#fff', bgcolor: '#000', fontWeight: 700 }}
                        onClick={() => onClose(labels.value.map(e => e.name))}
                    >
                        Add
                    </Button> */}

                    <TextField
                        variant="outlined"
                        label="Labels"
                        placeholder="Labels"
                        onChange={(e) => setText(e.target.value)}
                    />
                    <Button
                        variant='contained'
                        sx={{ color: '#fff', bgcolor: '#000', fontWeight: 700 }}
                        onClick={() => {
                            onClose(text.length > 0 ? { name: text } : undefined);
                        }}
                    >
                        Add
                    </Button>
                </Stack>
            </Stack>
        </Modal>
    )
}

const updateObject = (options: { objectId: string, labels: Label[]}) => {
    return fetch(`/api/projects/ProjectId/objects/${options.objectId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            labels: options.labels
        })
    })
    .then(e => e.json())
}

const ObjectsList = ({ projectId }: { projectId: string }) => {
    const [query, setQuery] = useState<string>();

    const queryClient = useQueryClient();

    const { data: objects } = useQuery<Object[]>({
        queryFn: () => fetch(`/api/projects/${projectId}/objects?${toParams(query)}`).then(e => e.json()),
        queryKey: ['projects', projectId, 'objects', query],
    });

    const [addLabelState, setAddLabelState] = useState<{ modalOpen: boolean, objectId?: string }>({
        modalOpen: false,
        objectId: undefined
    });

    const addlabelMutation = useMutation({
        mutationFn: updateObject,
        onSuccess: () => {
            queryClient.invalidateQueries(['projects']);
        }
    })

    return (
        <Stack gap={1}>
            <AddLabelModal open={addLabelState.modalOpen} onClose={(label) => {
                if (label && addLabelState.objectId) {
                    addlabelMutation.mutate({ objectId: addLabelState.objectId, labels: [label] });
                }
                setAddLabelState(prev => ({...prev, modalOpen: false}));
            }}
            />
            <FilterString onChange={e => setQuery(e)}/>
            <Stack gap={1} direction={'row'} flexWrap={'wrap'}>
                {
                    objects?.map(e => (
                        <Paper key={e.id} sx={{ width: '32%', cursor: 'pointer' }} elevation={4}>
                            <ObjectCard
                                object={e}
                                onLabelAddClick={() => setAddLabelState((prev) => ({...prev, modalOpen: true, objectId: e.id}))}
                            />
                        </Paper>
                    ))
                }
            </Stack>
        </Stack>
    )
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
  
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

export default () => {
    const { projectId } = useParams();

    // const { agents } = useAgents();
    // const { connectionState } = useEvents();
    // const { setMethods } = useMethods();

    // useEffect(() => {
    //     const methods = buildSuitedTypeMethods(agents);
    //     setMethods(methods);
    // }, [agents]);

    const [tab, setTab] = useState(0);

    const { data: project } = useQuery({
        queryFn: () => fetch(`/api/projects/${projectId}`).then(e => e.json()),
        queryKey: ['projects', projectId],
        enabled: projectId !== undefined
    });

    if (!projectId)
        return null;

    return (
        <Stack direction={'row'} padding={'0 1rem'}>
            {/* <Box>
                <BoardSidebar projectId={projectId} />
            </Box> */}
            {/* <Box flexGrow={1} height={'90vh'}>
                <Board projectId={projectId ? projectId : ''}/>
            </Box> */}
            <Stack width={'100%'}>
                <Stack direction={'row'} gap={4} alignItems={'flex-end'}>
                    <Typography variant="h5" fontWeight={700}>{project?.name}</Typography>
                    <Tabs value={tab} onChange={(event, newValue: number) => setTab(newValue)}>
                        <Tab label="Contexts" {...a11yProps(0)}/>
                        <Tab label="Objects" {...a11yProps(1)}/>
                    </Tabs>
                </Stack>
                <TabPanel value={tab} index={0}>
                    <Box>
                        <ContextsList projectId={projectId}/>
                    </Box>
                </TabPanel>
                <TabPanel value={tab} index={1}>
                    <Box>
                        <ObjectsList projectId={projectId}/>
                    </Box>
                </TabPanel>
            </Stack>
            {/* <ContextsList projectId={projectId}/> */}
        </Stack>
    );
};