import { Box } from "@mui/material";
import { Handle, NodeProps, Position } from "@xyflow/react";
import { memo } from "react";


export const ImageNode = memo(({ data, isConnectable }: NodeProps) => {
    return (
        <>
            <Box bgcolor={'#fff'} padding={'1em'}>
                <img
                    style={{ width: '200px' }}
                    src={data.src}
                />
            </Box>
            {/* {/* <Handle
                type="source"
                position={Position.Right}
                id="a"
                isConnectable={isConnectable}
            /> */}
            <Handle
                type="source"
                position={Position.Right}
                id="b"
                isConnectable={isConnectable}
            />
        </>
    );
});
