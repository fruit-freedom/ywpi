import { Paper, PaperProps, Stack, Typography } from "@mui/material"
import { MethodWithAgent } from "../../external/contexts/Markdown/methodsFilters"


interface MethodCardProps {
    method: MethodWithAgent;
    PaperProps?: PaperProps;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const MethodCardSmall = ({ method, PaperProps, onClick }: MethodCardProps) => {
    return (
        <Paper {...PaperProps} onClick={onClick}>
            <Stack padding={1} direction={'row'} justifyContent={'space-between'}>
                <Stack gap={1}>
                    <Typography>{method.agentId} / {method.name}</Typography>
                    <Typography sx={{ color: 'grey' }} variant="body2">
                        {method.description}
                    </Typography>
                    <Stack direction={'row'}>
                        {
                            method.labels?.map(e => (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        borderRadius: '4px',
                                        border: '1px solid lightgrey',
                                        padding: '0 0.2rem',
                                        color: "grey",
                                    }}
                                    fontWeight={700}
                                    noWrap
                                    key={e.name + e.value}
                                >
                                    {e.name}
                                </Typography>
                            ))
                        }
                    </Stack>
                </Stack>
            </Stack>
        </Paper>
    )
}
