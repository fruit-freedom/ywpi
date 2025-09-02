import { useState } from "react";

import { Box, IconButton, Menu, MenuItem, Modal, Stack, Typography } from "@mui/material"
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { MethodWithAgentId, useMethods } from "../store/methods";
import MethodCard, { BorrowedFields } from "../../../components/MethodCard/MethodCard";

interface NodeMenuProps {
    tp: string;
    data?: any;
}

interface ChosenState {
    method?: MethodWithAgentId;
    defaultValues?: any;
    open: boolean;
    borrowedFields?: BorrowedFields;
}

const TO_FORM_VALUE = new Map<string, (data: any, ctx?: any) => any>([
    ['text', (data) => data.text],
    ['pdf', (data) => data],
    ['object', (data, ctx) => ({
        id: ctx.id,
        tp: ctx.tp,
        data,
    })]
]);

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
            // Get inputs suited for object type
            const inputs = option.inputs.filter(e => (e.type.name === tp || e.type.name === 'object'));
            const defaultValues = inputs.reduce((acc, input) => {

                // Each object `tp` should provide method like `toFormValue`
                // acc[input.name] = data.text;

                if (input.type.name === 'object') {
                    acc[input.name] = TO_FORM_VALUE.get('object')?.(data, { id: data.objectId, tp });
                }
                else {
                    acc[input.name] = TO_FORM_VALUE.get(tp)?.(data);
                }

                borrowedFields[input.name] = {
                    objectId: data.objectId,
                    path: 'text'
                }

                return acc;
            }, {} as any)

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
    const options = [...(methods.get(tp) || []), ...(methods.get(`object[${tp}]`) || [])];

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
