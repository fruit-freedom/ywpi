import { Paper, Stack, Box, Typography, Button, Modal, TextField, Drawer, Autocomplete } from "@mui/material"
import { useRef, useState } from "react"
import { ObjectsList } from "./ObjectsList";


interface BoardSidebarProps {
    projectId: string;
}


export const BoardSidebar = ({ projectId }: BoardSidebarProps) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [link, setLink] = useState({
        value: '',
        helperText: 'Paste link to PDF document (e.g. https://arxiv.org/pdf/2502.10207)',
        error: false,
    });
    const [name, setName] = useState({
        value: '',
        helperText: 'Write document name (e.g. RIPOST: Two-Phase Private Decomposition for Multidimensional Data)',
        error: false,
    });
    const [labels, setLabels] = useState<{ value: { name: string }[]; helperText: string; error: boolean }>({
        value: [{ name: 'tes' }],
        helperText: 'Write labels (e.g. cs.AI, LLM, Database and etc)',
        error: false
    });

    const createDocument = () => {
        if (!name.value) {
            setName(prev => ({...prev, error: true, helperText: 'Write document name'}));
            return;
        }

        if (!link.value) {
            setLink(prev => ({...prev, error: true, helperText: 'Paste valid url'}));
            return;
        }

        fetch(`/api/projects/${projectId}/nodes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tp: 'pdf',
                data: {
                    name: name.value,
                    src: link.value,
                },
                position: {
                    x: 0,
                    y: 0
                },
                labels: labels.value
            })
        })
        .then(console.log)
        .catch(console.log)

        setModalOpen(false);
    }

    const [searchOpen, setSearchOpen] = useState(false);

    return (
        <>
            <Stack>
                <Stack gap={1} padding={1}>
                    <Button
                        variant='contained'
                        sx={{ color: '#fff', bgcolor: '#000', fontWeight: 700, width: 'max-content' }}
                        onClick={() => setModalOpen(true)}
                    >
                        Create
                    </Button>
                    <Button
                        variant='contained'
                        sx={{ color: '#fff', bgcolor: '#000', fontWeight: 700, width: 'max-content' }}
                        onClick={() => setSearchOpen(true)}
                    >
                        Search
                    </Button>
                </Stack>
            </Stack>
            <Drawer open={searchOpen} onClose={() => setSearchOpen(false)} PaperProps={{ sx: { minWidth: '25%' } }}>
                <ObjectsList projectId={projectId}/>
            </Drawer>
            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <Stack
                    padding={'1em'}
                    alignItems={'center'}
                    justifyContent={'center'}
                    height={'100vh'}
                >
                    <Stack bgcolor={'#fff'} borderRadius={'4px'} padding={'3rem'} gap={2}>
                        <Typography variant="h5" textAlign={'center'} fontWeight={700}>Create document</Typography>
                        <TextField
                            size='small'
                            fullWidth
                            onChange={(e) => setName(prev => ({...prev, value: e.target.value}))}
                            label={'Name'}
                            {...name}
                        />
                        <TextField
                            size='small'
                            fullWidth
                            onChange={(e) => setLink(prev => ({...prev, value: e.target.value}))}
                            label={'PDF Link'}
                            {...link}
                        />
                        <Autocomplete
                            multiple
                            options={[]}
                            freeSolo
                            onChange={(event, val) => setLabels(prev => ({ ...prev, value: val.map(e => ({ name: e })) }))}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    label="Labels"
                                    placeholder="Labels"
                                />
                            )}
                        />
                        <Button
                            variant='contained'
                            sx={{ color: '#fff', bgcolor: '#000', fontWeight: 700 }}
                            onClick={createDocument}
                        >
                            Create
                        </Button>
                    </Stack>
                </Stack>
            </Modal>
        </>
    )    
}