import { Box, Paper, Stack, Typography } from "@mui/material";
import React from "react";
import { useQuery } from "react-query";
import Link from "../../components/Link";

interface Project {
    id: string;
    name: string;
}

export default () => {

    const { data } = useQuery<Project[]>({
        queryKey: 'projects',
        queryFn: () => fetch('/api/projects').then(r => r.json())
    })

    return (
        <Box>
            <Typography fontWeight={700} variant="h4">Projects</Typography>
            <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
                {
                    data?.map(e =>
                        <Link
                            to={`/projects/${e.id}`}
                            key={e.id}
                        >
                            <Paper elevation={8} sx={{ cursor: 'pointer' }}>
                                <Stack padding={'1rem'} height={'150px'} width={'200px'}>
                                    <Typography color="grey" variant='body2'>{e.id}</Typography>
                                    <Typography fontWeight={700}>{e.name}</Typography>
                                </Stack>
                            </Paper>
                        </Link>
                    )
                }
            </Stack>
        </Box>
    )
}