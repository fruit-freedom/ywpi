import React, { useState } from "react";
import { AppBar, Menu, MenuItem, Toolbar, Typography, Box } from "@mui/material"
import { useNavigate } from "react-router-dom";

export default () => {
    const navigate = useNavigate();

    return (
        <AppBar position="static" sx={{ backgroundColor: '#fff' }}>
            <Toolbar>
                <Box marginRight={'3em'} sx={{ cursor: 'pointer' }}>
                    <Box
                        display={'flex'}
                        justifyContent={'center'}
                        sx={{ backgroundColor: '#000', borderRadius: '6px', padding: '0.2em' }}
                    >
                        <Typography variant="h6" color='#fff' fontWeight={800}>ywpi-cloud</Typography>
                    </Box>
                    <Typography textAlign={'center'} variant="body2" color='grey' fontSize={8}>Yes, we provide inference</Typography>
                </Box>
                <MenuItem onClick={() => navigate('/projects')}>
                    <Typography variant="h6" color='black' fontWeight={600} textTransform={'uppercase'}>Projects</Typography>
                </MenuItem>
                <MenuItem onClick={() => navigate('/')}>
                    <Typography variant="h6" color='black' fontWeight={600} textTransform={'uppercase'}>Agents</Typography>
                </MenuItem>
                <MenuItem onClick={() => navigate('/r')}>
                    <Typography variant="h6" color='black' fontWeight={600} textTransform={'uppercase'}>Retrieve</Typography>
                </MenuItem>
            </Toolbar>
        </AppBar>
    );
}
