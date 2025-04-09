import { Box, IconButton, MenuItem, Paper, Select, Stack, TextField, Typography } from "@mui/material"
import { useRef, useState } from "react";
import { useQuery } from "react-query"
import { executeMethod } from "../../../api";
import { useBoard } from "./Board/store";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import PDFHighlightViewer from "../../../components/PDFHighlightViewer";

interface Relation {
    name: string;
    object_id: string;
    source_task_id?: string;
}

interface Object {
    id: string;
    project_id?: string;
    tp: string;
    relations: Relation[];
    data: any;
}

interface ObjectsListProps {
    projectId?: string;
} 

const PDFView = ({ data }: any) => {
    return (
        <Typography>{data.name}</Typography>
    )
}

const TextView = ({ data }: any) => {
    return (
        <Typography>{data.text.slice(0, 150)}{ data.text.length > 150 ? '...' : null }</Typography>
    )
}

const components = new Map([
    ['pdf', PDFView],
    ['text', TextView]
]);

interface DocumentText {
    page_number: number;
    text: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface SearchDocument extends DocumentText {
    object_id: string;
    name: string;
    highlights?: string[];
}

interface SearchResponse {
    data: SearchDocument[];
}

export const ObjectsList = ({ projectId }: ObjectsListProps) => {
    const [query, setQuery] = useState<string>();

    const { data: searchData } = useQuery<SearchResponse>({
        queryKey: ['objects', 'search', query],
        queryFn: () => executeMethod('1234', 'search', {
            query
        }),
        enabled: !!projectId && query !== undefined
    });

    const [activeDndObjectId, setActiveDndObjectId] = useState<string>();

    const { setNodes } = useBoard();

    const createPDFNode = (objectId: string) => {
        fetch(`/api/projects/${projectId}/objects/${objectId}/nodes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                position: {
                    x: 0,
                    y: 0
                }
            })
        })
        .then(e => e.json())
        .then(e => {
            console.log('Created')
            // TODO: may be switch to UUID as node ID
            // @ts-ignore
            setNodes(nodes => [...nodes, {
                id: e.id,
                type: 'pdf',
                data: {
                    ...e.data,
                    objectId: e.object_id,
                },
                position: {
                    x: 0,
                    y: 0
                },
                dragHandle: '.custom',
            }])
        })
        .catch(e => console.log(e))
    }

    const [activeSearchResult, setActiveSearchResult] = useState<{ id: string, url: string, texts: DocumentText[] }>();

    return (
        <Stack
            bgcolor={'#fff'}
            direction={'row'}
            sx={{ overflowY: 'scroll' }}
            onDragEnd={(e) => {
                console.log('End', e, activeDndObjectId);
                const d = searchData?.data?.find(e => e.object_id == activeDndObjectId);
                console.log('d', d)
                if (d) {
                    createPDFNode(d.object_id);
                }
            }}
        >
            <Stack gap={1} width={'30vw'} padding={'0.5rem'} maxHeight={'90vh'} overflow={'scroll'}>
                <TextField
                    size='small'
                    variant='standard'
                    placeholder="Search query"
                    onKeyDown={(e) => {
                        if (e.code == 'Enter') setQuery(e.target.value);
                    }}
                />
                {
                    searchData?.data?.map((e, idx) => (
                        <div key={e.object_id + idx.toString()} draggable={true} onDragStart={() => setActiveDndObjectId(e.object_id) }>
                            <Paper
                                elevation={4}
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: 'lightgrey'
                                    },
                                    backgroundColor: e.object_id === activeSearchResult?.id ? 'lightgrey' : 'unset'
                                }}
                            >
                                <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
                                    <Stack padding={'0.1rem'} gap={'0.05rem'}>
                                        <Typography
                                            sx={{ color: 'grey' }}
                                            variant="caption"
                                        >
                                            {e.object_id}
                                        </Typography>
                                        <Typography fontWeight={700}>{e.name}</Typography>
                                        <Typography variant="caption">
                                            <span dangerouslySetInnerHTML={{ __html: e.highlights?.join('\n') }}/>
                                        </Typography>
                                    </Stack>
                                    <IconButton onClick={() => {
                                        fetch(`/api/objects/${e.object_id}`)
                                        .then(e => e.json())
                                        .then(data => {
                                            setActiveSearchResult({
                                                id: e.object_id,
                                                url: data.data.src,
                                                texts: [{
                                                    x1: e.x1,
                                                    y1: e.y1,
                                                    x2: e.x2,
                                                    y2: e.y2,
                                                    page_number: e.page_number,
                                                    text: e.text
                                                }]
                                            })
                                        })
                                    }}>
                                        <ArrowForwardIcon />
                                    </IconButton>
                                </Stack>
                            </Paper>
                        </div>
                    ))
                }
            </Stack>
            {
                activeSearchResult ?
                <Box width={'50vw'}>
                    <Stack direction={'row'} justifyContent={'space-between'}>
                        <div />
                        <IconButton onClick={() => setActiveSearchResult(undefined)}>
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                    <PDFHighlightViewer url={activeSearchResult.url} texts={activeSearchResult.texts}/>
                </Box>
                : null
            }
        </Stack>
    )
}