import { ReactNode } from "react";

import { IconButton, Stack } from "@mui/material"
import BlurOnIcon from '@mui/icons-material/BlurOn';
import { NodeMenu } from "../components/NodeMenu";

interface WithDragHandle {
    children: ReactNode;
    tp?: string;
    data?: any;
}

export const WithDragHandle = ({ children, tp, data }: WithDragHandle) => {
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
