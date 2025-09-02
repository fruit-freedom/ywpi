import { AppBar, MenuItem, Toolbar, Typography, Box } from "@mui/material"
import Link from "./components/Link";

export default () => {
    return (
        <AppBar position="static" sx={{ backgroundColor: '#fff', height: '65px', mb: '8px' }}>
            <Toolbar>
                <Box
                    marginRight={'3em'}
                    sx={{ cursor: 'pointer' }}
                >
                    <Link to={'/projects'}>
                        <Box
                            display={'flex'}
                            justifyContent={'center'}
                            sx={{ backgroundColor: '#000', borderRadius: '6px', padding: '0.2em' }}
                        >
                            <Typography variant="h6" color='#fff' fontWeight={800}>ywpi-cloud</Typography>
                        </Box>
                    </Link>
                    <Typography textAlign={'center'} variant="body2" color='grey' fontSize={8}>Yes, we provide inference</Typography>
                </Box>
                <MenuItem>
                    <Link to={'/projects'}>
                        <Typography variant="h6" color='black' fontWeight={600} textTransform={'uppercase'}>Projects</Typography>
                    </Link>
                </MenuItem>
                <MenuItem>
                    <Link to={'/agents'}>
                        <Typography variant="h6" color='black' fontWeight={600} textTransform={'uppercase'}>Agents</Typography>
                    </Link>
                </MenuItem>
            </Toolbar>
        </AppBar>
    );
}
