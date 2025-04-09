import { useState } from "react";
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

import {
    Handle,
    NodeProps,
    Position,
    Node
} from '@xyflow/react';


import { Box, Chip, Modal, Stack, Typography } from "@mui/material";
import { Viewer, Worker } from "@react-pdf-viewer/core";

type PDFNodeType = Node<{ name?: string, src?: string; }>;

export const PDFNode = ({ data, isConnectable }: NodeProps<PDFNodeType>) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Modal open={open} onClose={() => setOpen(false)} sx={{ overflow: 'scroll' }}>
                <Stack
                    padding={'1em'}
                    alignItems={'center'}
                    color={'grey'}
                    width={'min-content'}
                    justifyContent={'center'}
                >
                    <Box width={'70vw'} height={'95vh'}>
                        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                            {
                                data.src ?
                                <Viewer
                                    fileUrl={data.src}
                                    plugins={[]}
                                />
                                : null
                            }
                        </Worker>
                    </Box>
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
        </>
    );
};
