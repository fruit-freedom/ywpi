import { IconButton, Stack, Typography } from "@mui/material"
import React from "react";
import { Context } from "../../../../api/context";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Link from "../../../../components/Link";

interface ContextCardProps {
    context: Context;
    onLabelAddClick?: () => void;
    additionalControls?: React.ReactNode;
    onClick?: (event: React.SyntheticEvent) => void;
}

export const ContextCard = ({ context, onLabelAddClick, additionalControls, onClick }: ContextCardProps) => {
    return (
        <Stack
            padding={'0.5rem'}
            minHeight={'6rem'}
            gap={1}
            justifyContent={'space-between'}
            onClick={onClick}
            sx={{
                cursor: "pointer",
                "&:hover": {
                    backgroundColor: "lightgray"
                }
            }}
        >
            {/* <Link to={`/projects/${context.project_id}/contexts/${context.id}`} sx={{ color: 'grey', padding: '5px' }}> */}
                <Stack direction={'row'} justifyContent={'space-between'} alignItems={"flex-start"} gap={1}>
                    <Stack direction={'row'} gap={2}>
                        <Typography variant='caption'>{context.tp}</Typography>
                        <Typography sx={{ color: 'grey' }} variant='caption'>{context.id}</Typography>
                    </Stack>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <MoreVertIcon />
                    </IconButton>
                </Stack>
                <Typography variant="h6">{context.name}</Typography>
                <>
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
                    {/* {additionalControls} */}
                </>
            {/* </Link> */}
        </Stack>
    )
}