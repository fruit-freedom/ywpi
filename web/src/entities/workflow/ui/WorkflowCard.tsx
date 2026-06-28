import { Button, IconButton, Menu, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material"
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { deleteWorkflow, updateWorkflow, Workflow } from "../api";
import Link from "../../../components/Link";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import Modal from "../../../shared/Modal";


interface WorkflowCardProps {
    workflow: Workflow;
}

export const WorkflowCard = ({ workflow }: WorkflowCardProps) => {
    const queryClient = useQueryClient();
    const [menuOpen, setMenuOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const menuAnchorRef = useRef<HTMLDivElement>();

    const updateMutation = useMutation({
        mutationFn: (options: Partial<Workflow>) => updateWorkflow(workflow.id, options),
        onSuccess: (e) => {
            setEditModalOpen(false);
            queryClient.invalidateQueries(["workflows"]);
            queryClient.invalidateQueries(["workflows", workflow.id]);
        },
        onError: () => {
            setEditModalOpen(false);
        },
    });

    const [name, setName] = useState({
        value: '',
        helperText: 'Write project name (e.g. Workspace)',
        error: false,
    });

    return (
        <>
            <Link to={`/workflows/${workflow.id}`}>
                <Paper className="hover">
                    <Stack padding={"1rem"} height={'250px'} width={'200px'}>
                        <Stack gap={1}>
                            <Stack direction={"row"} justifyContent={"space-between"} alignItems={"flex-end"}>
                                <Typography color="grey" variant="caption">{workflow.id}</Typography>
                                <div ref={menuAnchorRef}>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setMenuOpen(true);
                                        }}
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                </div>
                            </Stack>
                            <Typography fontWeight={700}>{workflow.name}</Typography>
                            <Typography color="grey" variant="body2">{workflow.description}</Typography>
                        </Stack>
                    </Stack>
                </Paper>
            </Link>
            <Menu
                anchorEl={menuAnchorRef.current}
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
            >
                <MenuItem
                    onClick={(e) => {
                        setMenuOpen(false);
                        setEditModalOpen(true);
                    }}
                >
                    <Typography>Edit</Typography>
                </MenuItem>
                <MenuItem
                    onClick={(e) => {
                        setMenuOpen(false);
                        deleteWorkflow(workflow.id);
                        queryClient.invalidateQueries(["workflows"]);
                    }}
                >
                    <Typography>Delete</Typography>
                </MenuItem>
            </Menu>
            <Modal open={editModalOpen} onClose={() => setMenuOpen(false)}>
                <Typography>Edit workflow</Typography>
                <TextField
                    size='small'
                    fullWidth
                    onChange={(e) => setName(prev => ({...prev, value: e.target.value}))}
                    label={'Name'}
                    {...name}
                />
                <Button
                    variant="contained"
                    onClick={() => updateMutation.mutate({ name: name.value })}
                >
                    Save
                </Button>
            </Modal>
        </>
    )
}
