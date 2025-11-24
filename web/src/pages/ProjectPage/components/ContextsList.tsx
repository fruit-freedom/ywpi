import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Label } from "../../../api/types";
import { Box, IconButton, MenuItem, Modal, Paper, Select, Stack, TextField, Typography } from "@mui/material";
import { Button } from "../../../components/Button";
import { useNavigate } from "react-router-dom";
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import Link from "../../../components/Link";
import { ContextCard } from "./ContextCard";
import { Context, createContext, deleteContext, getContexts, updateContext } from "../../../api/context";

interface CreateContextFormProps {
    open: boolean;
    onClose: (context?: any) => void;
    projectId: string;
}



const CreateContextForm = ({ open, onClose, projectId }: CreateContextFormProps) => {
    const createContextMutation = useMutation({
        mutationFn: createContext,
        onSuccess: (e) => onClose(e),
        onError: () => onClose()
    });

    const [type, setType] = useState("chat");

    const [name, setName] = useState({
        value: 'Untitled',
        helperText: 'Write project name (e.g. Workspace)',
        error: false,
    });

    const createContextAndClose = () => {
        createContextMutation.mutate({ projectId, tp: type, name: name.value });
    };

    return (
        <Modal open={open} onClose={() => onClose(false)}>
            <Stack
                padding={'1em'}
                alignItems={'center'}
                justifyContent={'center'}
                height={'100vh'}
            >
                <Stack bgcolor={'#fff'} borderRadius={'4px'} padding={'3rem'} gap={4}>
                    <Typography variant="h5" textAlign={'center'} fontWeight={700}>Create context</Typography>
                    <Select
                        value={type}
                        label="Type"
                        onChange={(e) => setType(e.target.value)}
                        variant="standard"
                        size="small"
                    >
                        <MenuItem value={"chat"}>Chat</MenuItem>
                        <MenuItem value={"markdown"}>Markdown</MenuItem>
                    </Select>
                    <TextField
                        size='small'
                        fullWidth
                        onChange={(e) => setName(prev => ({...prev, value: e.target.value}))}
                        label={'Name'}
                        {...name}
                    />
                    <Button onClick={createContextAndClose}>
                        Create
                    </Button>
                </Stack>
            </Stack>
        </Modal>        
    );
}

export const ContextsList = ({ projectId, projectName }: { projectId: string, projectName?: string }) => {
    const queryClient = useQueryClient();

    const { data: contexts } = useQuery<Context[]>({
        queryFn: () => getContexts(projectId),
        queryKey: ['projects', projectId, 'contexts'],
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
            <Stack direction={'row'} justifyContent={"space-between"} padding={"0 4rem"}>
                <Typography variant="h4" fontWeight={700}>{projectName}</Typography>
                <Button onClick={() => setCreateModelOpen(true)}>+ Create context</Button>
            </Stack>
            <Stack gap={2} direction={'row'} flexWrap={'wrap'} justifyContent={'center'}>
                {
                    contexts?.map(e => (
                        <Box
                            width={'60%'}
                            key={e.id}
                        >
                            <ContextCard
                                context={e}
                                onLabelAddClick={() => setAddLabelState((prev) => ({...prev, modalOpen: true, objectId: e.id}))}
                                additionalControls={
                                    <Stack direction={'row'} gap={'0.2rem'}>
                                        <IconButton
                                            size="small"
                                            sx={{ width: "min-content" }}
                                            onClick={
                                                (event) => {
                                                    deleteContext({ projectId, contextId: e.id })
                                                    .then(() => queryClient.invalidateQueries(['projects', projectId, 'contexts', query]))
                                                    event.stopPropagation();
                                                }
                                            }
                                        >
                                            <DeleteIcon fontSize="small"/>
                                        </IconButton>
                                        <Link to={`/projects/${projectId}/contexts/${e.id}`} sx={{ color: 'grey', padding: '5px' }}>
                                            <OpenInFullIcon fontSize="small"/>
                                        </Link>
                                    </Stack>
                                }
                            />
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