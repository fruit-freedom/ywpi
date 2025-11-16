import { Box, Button, Modal, Paper, Stack, Typography } from "@mui/material"
import { useState } from "react";
import EditIcon from '@mui/icons-material/Edit';
import { Agent } from "../../store/store";
import { getMethods, MethodWithAgent } from "../../external/contexts/Markdown/methodsFilters";

interface AgetnTaskBlockProps {
    agents: Agent[];
    onChange?: (method?: MethodWithAgent) => void;
    activeMethod?: MethodWithAgent;
}

export default ({ agents, activeMethod, onChange }: AgetnTaskBlockProps) => {
    const [modalOpen, setModelOpen] = useState(false);

    return (
        <>
            <Stack>
                <Typography fontWeight={700}>Agent task method</Typography>
                <Paper elevation={4}>
                    <Stack padding={1} direction={'row'} justifyContent={'space-between'}>
                        {
                            activeMethod ?
                            <Typography>{activeMethod.agentId} / {activeMethod.name}</Typography>
                            :
                            null
                        }
                        <Box
                            sx={{ cursor: 'pointer' }}
                            onClick={() => setModelOpen(true)}
                        >
                            <EditIcon />
                        </Box>
                    </Stack>
                </Paper>
            </Stack>        
            <Modal open={modalOpen} onClose={() => setModelOpen(false)}>
                <Stack justifyContent={'center'} alignItems={'center'} height={'80vh'}>
                    <Stack gap={2} bgcolor={"#fff"} padding={"4rem 10rem"}>
                        <Stack gap={1}>
                            {
                                getMethods(agents)
                                .map(e => 
                                    <Paper
                                        key={e.agentId + e.name}
                                        elevation={4}
                                        sx={{
                                            padding: 1,
                                            cursor: "pointer",
                                            "&:hover": { bgcolor: "lightgray" }
                                        }}
                                        onClick={() => { onChange?.(e); setModelOpen(false); }}
                                    >
                                        <Typography>{e.agentId} / {e.name}</Typography>
                                    </Paper>
                                )
                            }
                        </Stack>
                        <Stack direction={'row'}>
                            <Button onClick={() => setModelOpen(false)}>Cancel</Button>
                            <Button onClick={() => { onChange?.(); setModelOpen(false) }}>Clear</Button>
                        </Stack>
                    </Stack>
                </Stack>
            </Modal>
        </>
    )
}