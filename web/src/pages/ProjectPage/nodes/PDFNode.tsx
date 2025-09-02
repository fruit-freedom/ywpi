import { useState } from "react";
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import {
    Handle,
    NodeProps,
    Position,
    Node
} from '@xyflow/react';
import { Box, Chip, Modal, Stack, Typography } from "@mui/material";
import PDF from "../../../components/PDF";

type PDFNodeType = Node<{ name?: string, src?: string; }>;

export const PDFNode = ({ data, isConnectable }: NodeProps<PDFNodeType>) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Modal open={open} onClose={() => setOpen(false)} sx={{ overflow: 'scroll' }}>
                <Box bgcolor={'#fff'} width={'90vw'}>
                    <PDF objectId={data.objectId} onClose={() => setOpen(false)}/>
                </Box>
            </Modal>
            <Stack bgcolor={'#fff'} maxWidth={'400px'} padding={'1em'} borderRadius={'4px'}>
                <Stack direction={'row'} justifyContent={'space-between'}>
                    <Typography color="grey" variant="body2">Document</Typography>
                    <Chip
                        label={<Typography color="grey">open</Typography>}
                        variant="outlined"
                        onClick={() => setOpen(true)}
                        size='small'
                    />
                </Stack>
                <Typography
                    variant='h6'
                    fontWeight={700}
                >
                    {data.name}
                </Typography>
                <Handle
                    type='source'
                    position={Position.Right}
                    id="b"
                    isConnectable={isConnectable}
                />
            </Stack>
        </>
    );
};
