import React, { useRef, useState } from "react";
import { Button, IconButton, Menu, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material"
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Context } from "../../../../api/context";
import Link from "../../../../components/Link";
import Modal from "../../../../shared/Modal";

interface ContextCardProps {
    context: Context;
    onLabelAddClick?: () => void;
    additionalControls?: React.ReactNode;
    onClick?: (event: React.SyntheticEvent) => void;
}

export const ContextCard = ({ context, onLabelAddClick, additionalControls, onClick }: ContextCardProps) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    const anchorRef = useRef();

    return (
        <>
            <Link to={`/projects/${context.project_id}/contexts/${context.id}`}>
                <Paper className="hover">
                    <Stack
                        padding={'0.5rem'}
                        minHeight={'6rem'}
                        gap={1}
                        justifyContent={'space-between'}
                        onClick={onClick}
                    >
                        <Stack direction={'row'} justifyContent={'space-between'} alignItems={"flex-start"} gap={1}>
                            <Typography variant="h6">{context.name}</Typography>
                            <Stack
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setMenuOpen(true);
                                    }}
                                    ref={anchorRef}
                                >
                                    <MoreVertIcon />
                                </IconButton>
                                <Menu
                                    anchorEl={anchorRef.current}
                                    open={menuOpen}
                                    onClose={() => setMenuOpen(false)}
                                >
                                    <MenuItem onClick={(e) => {
                                        setMenuOpen(false);
                                        setModalOpen(true)
                                    }}>
                                        <Stack direction={'row'} gap={1}>
                                            <Typography>Edit</Typography>
                                        </Stack>
                                    </MenuItem>
                                </Menu>

                            </Stack>
                        </Stack>
                        <Stack direction={'row'} gap={2}>
                            <Typography variant='caption'>{context.tp}</Typography>
                            <Typography sx={{ color: 'grey' }} variant='caption'>{context.id}</Typography>
                        </Stack>
                            {/* <>
                                <Stack direction={'row'} flexWrap={'wrap'} gap={0.5}>
                                    {
                                        context.labels?.map(t => (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    cursor: 'pointer',
                                                    borderRadius: '4px',
                                                    color: '#000',
                                                    border: '1px solid grey',
                                                    padding: '0 0.2rem',
                                                    width: 'min-content',
                                                    '&:hover': {
                                                        border: '1px solid lightgrey',
                                                    }
                                                }}
                                                fontWeight={700}
                                                noWrap
                                            >
                                                {t.name}
                                                { t.value ? <span>: {t.value}</span> : null}
                                            </Typography>
                                        ))
                                    }
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            cursor: 'pointer',
                                            borderRadius: '4px',
                                            color: 'lightgrey',
                                            border: '1px solid lightgrey',
                                            padding: '0 0.2rem',
                                            width: 'min-content',
                                            '&:hover': {
                                                border: '1px solid grey',
                                                color: 'grey'
                                            }
                                        }}
                                        fontWeight={700}
                                        noWrap
                                        onClick={onLabelAddClick}
                                    >
                                        + label
                                    </Typography>
                                </Stack>
                            </> */}
                    </Stack>
                </Paper>
            </Link>
            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <Typography variant="h6">Edit context</Typography>
                <TextField
                    size='small'
                    fullWidth
                    defaultValue={"Experiments"}
                    onChange={(e) => setName(prev => ({...prev, value: e.target.value}))}
                    label={'Name'}
                />
                <Button
                    variant="contained"
                    onClick={() => setModalOpen(false)}
                >
                    Update
                </Button>
            </Modal>
        </>
    )
}