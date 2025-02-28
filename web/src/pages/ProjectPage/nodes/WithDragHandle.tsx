import { useState, ReactNode } from "react";

import { Box, Button, IconButton, Menu, MenuItem, Modal, Stack, Typography } from "@mui/material"
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { MethodWithAgentId, useMethods } from "../store/methods";
import MethodCard, { BorrowedFields } from "../../../components/MethodCard/MethodCard";
import BlurOnIcon from '@mui/icons-material/BlurOn';
import { NodeMenu } from "../components/NodeMenu";

interface WithDragHandle {
    children: ReactNode;
    tp?: string;
    data?: any;
}

interface ChosenState {
    method?: MethodWithAgentId;
    defaultValues?: any;
    open: boolean;
    borrowedFields?: BorrowedFields;
}

export const WithDragHandle = ({ children, tp, data }: WithDragHandle) => {
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

    const showAllRelated = () => {
        fetch(`/api/objects/${data.objectId}/related`)
        .then(e => e.json())
        .then(e => console.log('Related', e))
    }

    return (
        <div style={{ userSelect: 'text' }} className="select-control">
            <Stack flexDirection={'row'} justifyContent={'flex-end'}>
                <Stack direction={'row'} width={'100%'}>
                    <div
                        style={{
                            width: '100%',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: '#e9e9e999',
                            marginBottom: '4px',
                            cursor: 'pointer'
                        }}
                        className="custom"
                    />
                    <IconButton onClick={showAllRelated}>
                        <BlurOnIcon />
                    </IconButton>
                    <NodeMenu tp={tp} data={data} />
                </Stack>
            </Stack>
            {children}
        </div>
    )
}
