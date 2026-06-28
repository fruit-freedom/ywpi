import { Button, Modal, Paper, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import Link from "../../components/Link";
import { useNavigate } from "react-router-dom";
import { createProject, getProjects, Project } from "../../entities/project/api";

interface CreateProjectFormProps {
    open: boolean;
    onClose: (project?: any) => void;
}

const CreateProjectForm = ({ open, onClose }: CreateProjectFormProps) => {
    const createProjectMutation = useMutation({
        mutationFn: (options: Partial<Project>) => createProject(options),
        onSuccess: (e) => onClose(e),
        onError: () => onClose()
    });

    const [name, setName] = useState({
        value: '',
        helperText: 'Write project name (e.g. Workspace)',
        error: false,
    });

    const [description, setDescription] = useState({
        value: '',
        helperText: 'Write project description',
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
                    <TextField
                        size='small'
                        fullWidth
                        onChange={(e) => setDescription(prev => ({...prev, value: e.target.value}))}
                        label={'Description'}
                        rows={5}
                        multiline
                        {...description}
                    />
                    <Button
                        onClick={() => createProjectMutation.mutate({ name: name.value, description: description.value })}
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
        queryFn: () => getProjects()
    });

    const [open, setOpen] = useState(false);

    return (
        <Stack padding={'0 4rem'} gap={4}>
            <Stack direction="row" justifyContent={"space-between"}>
                <Typography variant="h4">Projects</Typography>
                <Button
                    variant="contained" onClick={() => setOpen(true)}>+ Create Project</Button>
            </Stack>
            <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
                {
                    data?.map(e =>
                        <Link to={`/projects/${e.id}`} key={e.id}>
                            <Paper className="hover">
                                <Stack padding={'1rem'} height={'250px'} width={'200px'} gap={1}>
                                    <Typography color="grey" variant="caption">{e.id}</Typography>
                                    <Typography fontWeight={700}>{e.name}</Typography>
                                    <Typography color="grey" variant="body2">{e.description}</Typography>
                                </Stack>
                            </Paper>
                        </Link>
                    )
                }
            </Stack>
            {
                data?.length === 0 ?
                <Stack gap={6} alignItems={"center"}>
                    <Typography variant="h4" fontWeight={700}>Create your first project</Typography>
                    <Button
                        variant="contained"
                        sx={{ width: "50rem" }}
                        onClick={() => setOpen(true)}
                    >
                        + Create
                    </Button>
                </Stack>
                : null
            }
            <CreateProjectForm
                open={open}
                onClose={(project) => {
                    setOpen(false);
                    if (project) {
                        queryClient.invalidateQueries(["projects"]);
                        navigate(`/projects/${project.id}`);
                    }
                }}
            />
        </Stack>
    )
}