import { memo, useState } from "react";
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

import {
    Handle,
    NodeProps,
    Position,
    Node
} from '@xyflow/react';


import { Chip, Modal, Stack, Typography } from "@mui/material";
import { WithDragHandle } from "./WithDragHandle";

type PDFNodeType = Node<{ name?: string, src?: string; }>;

export const PDFNode = memo(({ data, isConnectable }: NodeProps<PDFNodeType>) => {
    const [open, setOpen] = useState(false);

    return (
        <WithDragHandle>
            <Modal open={open} onClose={() => setOpen(false)} sx={{ overflow: 'scroll' }}>
                <Stack
                    padding={'1em'}
                    alignItems={'center'}
                    color={'grey'}
                    width={'min-content'}
                    justifyContent={'center'}
                >
                    <Document file={data.src}>
                        <Stack gap={1}>
                            <Page pageNumber={1} width={1000} />
                            <Page pageNumber={2} width={1000} />
                            <Page pageNumber={3} width={1000} />
                            <Page pageNumber={4} width={1000} />
                            <Page pageNumber={5} width={1000} />
                        </Stack>
                    </Document>
                </Stack>
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
        </WithDragHandle>
    );
});