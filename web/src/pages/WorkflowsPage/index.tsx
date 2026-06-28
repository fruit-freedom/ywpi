import { Button, Stack, TextField, Typography } from "@mui/material"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { createWorkflow, getWorkflows, Workflow } from "../../entities/workflow/api"
import { WorkflowCard } from "../../entities/workflow/ui/WorkflowCard"
import Modal from "../../shared/Modal"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

interface CreateWorkflowFormProps {
    open: boolean;
    onClose: (workflow?: Workflow) => void;
}

const CreateWorkflowForm = ({ open, onClose }: CreateWorkflowFormProps) => {
    const createWorkflowMutation = useMutation({
        mutationFn: (options: Partial<Workflow>) => createWorkflow(options),
        onSuccess: (e) => onClose(e),
        onError: () => onClose()
    });

    const [name, setName] = useState({
        value: '',
        helperText: 'Write workflow name (e.g. Papers classification)',
        error: false,
    });

    const [description, setDescription] = useState({
        value: '',
        helperText: 'Write workflow description',
        error: false,
    });

    return (
        <Modal open={open} onClose={() => onClose(undefined)}>
            <Typography variant="h5" textAlign={'center'} fontWeight={700}>Create workflow</Typography>
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
                onClick={() => createWorkflowMutation.mutate({
                    name: name.value,
                    description: description.value,
                    nodes: [],
                    edges: []
                })}
                variant="contained"
            >
                Create
            </Button>
        </Modal>        
    );
}

export default () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { data } = useQuery({
        queryFn: () => getWorkflows(),
        queryKey: ["workflows"]
    })

    const [open, setOpen] = useState(false);

    return (
        <>
            <Stack padding={'0 4rem'} gap={4}>
                <Stack direction={"row"} justifyContent={"space-between"}>
                    <Typography variant="h4">Workflows</Typography>
                    <Button variant="contained" onClick={() => setOpen(true)}>+ Create Workflow</Button>
                </Stack>
                <Stack direction={"row"} gap={1}>
                    {
                        data?.items.map(e => (
                            <WorkflowCard key={e.id} workflow={e}/>
                        ))
                    }
                </Stack>
            </Stack>
            <CreateWorkflowForm open={open} onClose={(workflow) => {
                if (workflow) {
                    queryClient.invalidateQueries(["workflows"]);
                    navigate(`/workflows/${workflow.id}`);
                }
                setOpen(false);
            }}
            />
        </>
    )    
}