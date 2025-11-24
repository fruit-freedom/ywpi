import { Box, Button, Paper, Stack, Typography } from "@mui/material"
import { useState } from "react";
import EditIcon from '@mui/icons-material/Edit';
import { Agent } from "../../store/store";
import { getMethods, MethodWithAgent } from "../../external/contexts/Markdown/methodsFilters";
import { MethodCardSmall } from "../MethodCard";
import Modal from "../Modal";

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
                <Stack direction={'row'} gap={2}>
                    {
                        activeMethod ?
                        <MethodCardSmall method={activeMethod} />
                        : null
                    }
                    <Box
                        sx={{ cursor: 'pointer' }}
                        onClick={() => setModelOpen(true)}
                    >
                        <EditIcon />
                    </Box>
                </Stack>
            </Stack>        
            <Modal open={modalOpen} onClose={() => setModelOpen(false)}>
                <Stack gap={2} bgcolor={"#fff"}>
                    <Typography variant="h6" fontWeight={700}>Edit completition methods</Typography>
                    <Stack gap={1} maxHeight={"70vh"} overflow={"scroll"}>
                        {
                            getMethods(agents)
                            .map(e => 
                                <MethodCardSmall
                                    key={e.agentId + e.name}
                                    PaperProps={{ className: "hover" }}
                                    method={e}
                                    onClick={() => { onChange?.(e); setModelOpen(false); }}
                                />
                            )
                        }
                    </Stack>
                    <Stack direction={'row'} justifyContent={'space-around'}>
                        <Button onClick={() => setModelOpen(false)}>Cancel</Button>
                        <Button onClick={() => { onChange?.(); setModelOpen(false) }}>Clear</Button>
                    </Stack>
                </Stack>
            </Modal>
        </>
    )
}