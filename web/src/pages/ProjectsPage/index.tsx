import { Box, Button, Modal, Paper, Stack, TextField, Typography } from "@mui/material";
import React, { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import Link from "../../components/Link";
import { useNavigate } from "react-router-dom";

interface Project {
    id: string;
    name: string;
}

interface CreateProjectFormProps {
    open: boolean;
    onClose: (project?: any) => void;
}

const createProject = (options: { name: string }) => {
    return fetch(`/api/projects`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: options.name
        })
    })
    .then(e => e.json())
}

const CreateProjectForm = ({ open, onClose }: CreateProjectFormProps) => {
    const createProjectMutation = useMutation({
        mutationFn: createProject,
        onSuccess: (e) => onClose(e),
        onError: () => onClose()
    });

    const createProjectAndClose = (name: string) => {
        createProjectMutation.mutate({ name })
    };

    const [name, setName] = useState({
        value: '',
        helperText: 'Write project name (e.g. Workspace)',
        error: false,
    });

    return (
        <Modal open={open} onClose={() => onClose(false)}>
            <Stack
                padding={'1em'}
                alignItems={'center'}
                justifyContent={'center'}
                height={'100vh'}
            >
                <Stack bgcolor={'#fff'} borderRadius={'4px'} padding={'3rem'} gap={4} minWidth={"50rem"}>
                    <Typography variant="h5" textAlign={'center'} fontWeight={700}>Create project</Typography>
                    <TextField
                        size='small'
                        fullWidth
                        onChange={(e) => setName(prev => ({...prev, value: e.target.value}))}
                        label={'Name'}
                        {...name}
                    />
                    <Button
                        onClick={() => createProjectAndClose(name.value)}
                        variant="contained"
                    >
                        Create
                    </Button>
                </Stack>
            </Stack>
        </Modal>        
    );
}

export default () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data } = useQuery<Project[]>({
        queryKey: 'projects',
        queryFn: () => fetch('/api/projects').then(r => r.json())
    });

    const [open, setOpen] = useState(false);

    return (
        <Stack padding={'0 4rem'} gap={4}>
            <Typography fontWeight={700} variant="h4">Projects</Typography>
            <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
                {
                    data?.map(e =>
                        <Link
                            to={`/projects/${e.id}`}
                            key={e.id}
                        >
                            <Paper elevation={8} sx={{ cursor: 'pointer' }}>
                                <Stack padding={'1rem'} height={'150px'} width={'200px'}>
                                    <Typography color="grey" variant='body2'>{e.id}</Typography>
                                    <Typography fontWeight={700}>{e.name}</Typography>
                                </Stack>
                            </Paper>
                        </Link>
                    )
                }
            </Stack>
            <Stack gap={6} alignItems={"center"}>
                <Typography variant="h4" fontWeight={700}>Create your first project</Typography>
                <Button
                    variant="contained"
                    sx={{
                        width: "50rem",
                    }}
                    onClick={() => setOpen(true)}
                >
                    + Create
                </Button>
            </Stack>
            <CreateProjectForm
                open={open}
                onClose={(project) => {
                    setOpen(false);
                    if (project) {
                        queryClient.invalidateQueries(["projects"])
                        navigate(`/projects/${project.id}`);
                    }
                }}
            />
        </Stack>
    )
}