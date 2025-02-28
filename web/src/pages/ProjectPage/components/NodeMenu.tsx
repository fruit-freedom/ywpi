import { useState, ReactNode } from "react";

import { Box, Button, IconButton, Menu, MenuItem, Modal, Stack, Typography } from "@mui/material"
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { MethodWithAgentId, useMethods } from "../store/methods";
import MethodCard, { BorrowedFields } from "../../../components/MethodCard/MethodCard";
import BlurOnIcon from '@mui/icons-material/BlurOn';


interface NodeMenuProps {
    tp?: string;
    data?: any;
}

interface ChosenState {
    method?: MethodWithAgentId;
    defaultValues?: any;
    open: boolean;
    borrowedFields?: BorrowedFields;
}

export const NodeMenu = ({ tp, data }: NodeMenuProps) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (option?: MethodWithAgentId) => {
        setAnchorEl(null);


        /*
            There are convertation logic from ywpi object data
            to method card `defaultvalues`.
            This convertation logic should use type matching.
        */

        const borrowedFields: BorrowedFields = {};

        if (option) {
            const textInputs = option.inputs.filter(e => e.type == 'text');
            const defaultValues = textInputs.reduce((acc, item) => {

                // Each object `tp` should provide method like `toFormValue`
                acc[item.name] = data.text;

                borrowedFields[item.name] = {
                    objectId: data.objectId, // TODO: get object id from node
                    path: 'text'
                }

                return acc;
            }, {} as any)

            console.log('borrowedFields', borrowedFields)

            setChosen({
                method: option,
                defaultValues,
                borrowedFields,
                open: true
            })
        }
    };

    const [chosen, setChosen] = useState<ChosenState>({
        method: undefined,
        open: false
    });

    // Think how to optimize re renders
    const { methods } = useMethods();
    const options = methods.get(tp);

    return (
        <>
            <IconButton
                aria-label="more"
                id="long-button"
                aria-controls={open ? 'long-menu' : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-haspopup="true"
                onClick={handleClick}
                disabled={!options}
            >
                <MoreVertIcon />
            </IconButton>
            <Menu
                id="long-menu"
                MenuListProps={{
                    'aria-labelledby': 'long-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={() => handleClose()}
            >
                {
                    options?.map((option) => (
                        <MenuItem key={option.agentId + option.name} onClick={() => handleClose(option)}>
                            <Stack direction={'row'} gap={1}>
                                <Typography>Run method</Typography>
                                <Typography
                                    sx={{ borderRadius: '4px', backgroundColor: '#f3f3f3', padding: '0 0.1rem' }}
                                >
                                    {option.name}
                                </Typography>
                            </Stack>
                        </MenuItem>
                    ))
                }
            </Menu>
            <Modal open={chosen.open} onClose={() => setChosen(prev => ({ ...prev, open: false }))}>
                <Box display={'flex'} justifyContent={'center'} maxHeight={'100%'}>
                    <Box sx={{ overflowY: 'scroll' }} width={'50vw'}>
                        <MethodCard
                            method={chosen.method}
                            agent={{
                                id: chosen.method?.agentId
                            }}
                            defaultValues={chosen.defaultValues}
                            borrowedFields={chosen.borrowedFields}
                            onStart={() => setChosen({ open: false })}
                        />
                    </Box>
                </Box>
            </Modal>
        </>
    )
}