import { Box, Divider, Stack, Typography } from "@mui/material"
import { Object } from "../../../../api/object"
import { components } from "./Views"
import React from "react";


interface ObjectCardProps {
    object: Object;
    onLabelAddClick?: () => void;
    additionalControls?: React.ReactNode;
    onClick?: (event: React.SyntheticEvent) => void;
}

export const ObjectCard = ({ object, onLabelAddClick, additionalControls, onClick }: ObjectCardProps) => {
    return (
        <Stack
            padding={'0.5rem'}
            minHeight={'6rem'}
            gap={1}
            justifyContent={'space-between'}
        >
            <Box>
                {
                    components.has(object.tp) ?
                    <>
                        {components.get(object.tp)?.({data: object.data})}
                    </>
                    :
                    <pre>
                        {JSON.stringify(object.data, null, 2)}
                    </pre>
                }
                <Divider />
            </Box>
            <>
                <Stack direction={'row'} flexWrap={'wrap'} gap={0.5}>
                    {
                        object.labels?.map(t => (
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
                <Stack direction={'row'} justifyContent={'space-between'} alignContent={'center'} gap={1}>
                    <Typography sx={{ color: 'grey' }} variant='caption'>{object.id}</Typography>
                    <Typography variant='caption'>{object.tp}</Typography>
                </Stack>
                {additionalControls}
            </>
        </Stack>
    )
}