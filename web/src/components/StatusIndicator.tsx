import React from "react";
import { Box } from "@mui/material";


export enum IndicatorColor {
    black = 'black',
    grey = 'grey',
    white = 'white',
}

interface StatusIndicatorProps {
    color?: IndicatorColor;
}

export default function StatusIndicator({ color }: StatusIndicatorProps) {
    const finalColor = color ? color : 'black';

    return (
        <Box
            sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: finalColor,
                border: finalColor === IndicatorColor.white ? "1px solid black" : `1px solid ${finalColor}`
            }}
        >
        </Box>
    )
    
}