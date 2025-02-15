import { Chip, Input, Stack, Typography } from "@mui/material";
import { Handle, NodeProps, Position } from "@xyflow/react";
import { memo, useState } from "react";
import { WithDragHandle } from "./WithDragHandle";

export const RetrieverNode = memo(({ data, isConnectable }: NodeProps) => {
    const [open, setOpen] = useState(false);

    return (
        <WithDragHandle>
            <Stack bgcolor={'#fff'} maxWidth={'400px'} padding={'1em'} borderRadius={'4px'}>
                <Typography color="grey" variant="body2">Retriever</Typography>
                <Typography
                    variant='h6'
                    fontWeight={700}
                >
                    Base full text
                </Typography>
                <Stack direction={'row'} gap={1}>
                    <Input size="small" />
                    <Chip
                        label={<Typography color="grey">retrieve</Typography>}
                        variant="outlined"
                        onClick={() => setOpen(true)}
                        size='small'
                    />
                </Stack>
                <Stack mt={10}>
                    {
                        [
                            'Reqo: A Robust and Explainable Query Optimization Cost Model',
                            'Reqo: A Robust and Explainable Query Optimization Cost Model',
                            'Reqo: A Robust and Explainable Query Optimization Cost Model',
                            'Reqo: A Robust and Explainable Query Optimization Cost Model',
                        ]
                            .map(e =>
                                <Stack>
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
                                        {e}
                                    </Typography>
                                </Stack>
                            )
                    }
                </Stack>
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