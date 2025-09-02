import { Button as MuiButton, styled } from "@mui/material"

export const Button = styled(MuiButton)({
    color: '#fff',
    borderColor: '#b4b4b4',
    fontWeight: '600',
    backgroundColor: '#000',
    '&:hover': {
        backgroundColor: '#000',
    }
});
