import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Context, Label } from "../../../api/types";
import { Box, IconButton, Modal, Paper, Stack, Typography } from "@mui/material";
import { ObjectCard } from "./ObjectCard";
import { Object } from "../../../api/object";
import { Button } from "../../../components/Button";
import { useNavigate } from "react-router-dom";
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import Link from "../../../components/Link";

interface CreateContextFormProps {
    open: boolean;
    onClose: (context?: any) => void;
    projectId: string;
}

const createContext = (options: { projectId: string, tp: string }) => {
    return fetch(`/api/projects/${options.projectId}/contexts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tp: options.tp
        })
    })
    .then(e => e.json())
}

const deleteContext = (options: { projectId: string, contextId: string }) => {
    return fetch(`/api/projects/${options.projectId}/contexts/${options.contextId}`, {
        method: 'DELETE'
    })
    .then(e => e.json());
}

const CreateContextForm = ({ open, onClose, projectId }: CreateContextFormProps) => {
    const createContextMutation = useMutation({
        mutationFn: createContext,
        onSuccess: (e) => onClose(e),
        onError: () => onClose()
    });

    const createContextAndClose = () => {
        createContextMutation.mutate({ projectId, tp: 'chat' })
        // onClose();
    };

    return (
        <Modal open={open} onClose={() => onClose(false)}>
            <Stack
                padding={'1em'}
                alignItems={'center'}
                justifyContent={'center'}
                height={'100vh'}
            >
                <Stack bgcolor={'#fff'} borderRadius={'4px'} padding={'3rem'} gap={2}>
                    <Typography variant="h5" textAlign={'center'} fontWeight={700}>Create chat</Typography>
                    {/* <TextField
                        size='small'
                        fullWidth
                        onChange={(e) => setName(prev => ({...prev, value: e.target.value}))}
                        label={'Name'}
                        {...name}
                    />
                    <TextField
                        size='small'
                        fullWidth
                        onChange={(e) => setLink(prev => ({...prev, value: e.target.value}))}
                        label={'PDF Link'}
                        {...link}
                    />
                    <Autocomplete
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
                    /> */}
                    <Button onClick={createContextAndClose}>
                        Create
                    </Button>
                </Stack>
            </Stack>
        </Modal>        
    );
}

const toParams = (query?: string) => {
    return query ? `q=${query}` : '';
}

const updateContext = (options: { projectId: string, contextId: string, labels: Label[]}) => {
    return fetch(`/api/projects/${options.projectId}/contexts/${options.contextId}`, {
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

export const ContextsList = ({ projectId }: { projectId: string }) => {
    const [query, setQuery] = useState<string>();

    const queryClient = useQueryClient();

    const { data: contexts } = useQuery<Context[]>({
        queryFn: () => fetch(`/api/projects/${projectId}/contexts?${toParams(query)}`).then(e => e.json()),
        queryKey: ['projects', projectId, 'contexts', query],
    });

    const [addLabelState, setAddLabelState] = useState<{ modalOpen: boolean, objectId?: string }>({
        modalOpen: false,
        objectId: undefined
    });

    const addlabelMutation = useMutation({
        mutationFn: updateContext,
        onSuccess: () => {
            queryClient.invalidateQueries(['projects']);
        }
    })

    const [createModelOpen, setCreateModelOpen] = useState(false);

    const navigate = useNavigate();

    return (
        <Stack gap={1} width={'100%'}>
            {/* <AddLabelModal open={addLabelState.modalOpen} onClose={(label) => {
                if (label && addLabelState.objectId) {
                    addlabelMutation.mutate({ objectId: addLabelState.objectId, labels: [label] });
                }
                setAddLabelState(prev => ({...prev, modalOpen: false}));
            }}
            /> */}
            {/* <FilterString onChange={e => setQuery(e)}/> */}
            <Stack direction={'row'} justifyContent={'flex-end'}>
                <Button onClick={() => setCreateModelOpen(true)}>Create</Button>
            </Stack>
            <Stack gap={1} direction={'row'} flexWrap={'wrap'} justifyContent={'center'}>
                {
                    contexts?.map(e => (
                        <Box
                            width={'32%'}
                            key={e.id}
                        >
                            <Paper elevation={4}>
                                <ObjectCard
                                    onClick={() => navigate(`/projects/${projectId}/contexts/${e.id}`)}
                                    object={e as Object}
                                    onLabelAddClick={() => setAddLabelState((prev) => ({...prev, modalOpen: true, objectId: e.id}))}
                                    additionalControls={
                                        <Stack direction={'row'} gap={'0.2rem'}>
                                            <IconButton
                                                size="small"
                                                sx={{ width: "min-content" }}
                                                onClick={
                                                    () => deleteContext({ projectId, contextId: e.id })
                                                    .then(() => queryClient.invalidateQueries(['projects', projectId, 'contexts', query]))
                                                }
                                            >
                                                <DeleteIcon fontSize="small"/>
                                            </IconButton>
                                            <Link to={`/projects/${projectId}/contexts/${e.id}`} sx={{ color: 'grey', padding: '5px' }}>
                                                <OpenInFullIcon fontSize="small"/>
                                            </Link>
                                            {/* <IconButton
                                                size="small"
                                                sx={{ width: "min-content" }}
                                                onClick={() => navigate(`/projects/${projectId}/contexts/${e.id}`)}
                                            >
                                                <OpenInFullIcon fontSize="small"/>
                                            </IconButton> */}
                                        </Stack>
                                    }
                                />
                            </Paper>
                        </Box>
                    ))
                }
            </Stack>
            <CreateContextForm
                open={createModelOpen}
                onClose={(context) => {
                    setCreateModelOpen(false);
                    if (context) {
                        queryClient.invalidateQueries(['projects']);
                        navigate(`/projects/${projectId}/contexts/${context.id}`);
                    }
                }}
                projectId={projectId}
            />
        </Stack>
    )
}