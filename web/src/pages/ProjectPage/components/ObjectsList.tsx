import { IconButton, Paper, Stack, TextField, Typography } from "@mui/material"
import { useState } from "react";
import { useQuery } from "react-query"
import { executeMethod } from "../../../api";
import { useBoard } from "./Board/store";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PDF, { DocumentText } from "../../../components/PDF";
import { NodeMenu } from "./NodeMenu";

interface ObjectsListProps {
    projectId?: string;
} 


interface SearchDocument extends DocumentText {
    object_id: string;
    name: string;
    highlights?: string[];
    labels?: {
        name: string;
        value?: string;
    }[];
}

interface SearchResponse {
    data: SearchDocument[];
}

const TAGS = [
    // { name: 'Date: 12 of july 2024', color: 'green' },
    // { name: 'Project: Silicon Walley', color: 'grey' },
    // { name: 'Type: publication', color: 'orange' },
    { name: 'Source: arXiv', color: 'grey' },
    { name: 'arXiv.topic: cs.AI', color: 'grey' },
    // { name: 'Approved', color: 'green' },
    // { name: 'Method: build_summary', color: 'green' },
    // { name: 'Author: А. К. Звездин', color: 'grey' },
]

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

    const [activeSearchResult, setActiveSearchResult] = useState<{ id: string, texts: DocumentText[] }>();

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
            width={'100%'}
        >
            <Stack width={'25vw'} gap={1} padding={'0.5rem'} maxHeight={'100vh'} overflow={'scroll'}>
                <Stack direction={'row'}>
                    <TextField
                        size='small'
                        variant='standard'
                        fullWidth
                        placeholder="Search query"
                        onKeyDown={(e) => {
                            if (e.code == 'Enter') setQuery(e.target.value);
                        }}
                    />
                    <NodeMenu tp="pdf"/>
                </Stack>
                {
                    searchData?.data?.map((e, idx) => (
                        <div key={e.object_id + idx.toString()} draggable={true} onDragStart={() => setActiveDndObjectId(e.object_id) }>
                            <Paper
                                elevation={4}
                                sx={{
                                    cursor: 'pointer',
                                    backgroundColor: e.object_id === activeSearchResult?.id ? 'lightgrey' : 'unset'
                                }}
                            >
                                <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
                                    <Stack padding={'0.1rem'} gap={'0.1rem'}>
                                        <Typography
                                            sx={{ color: 'grey' }}
                                            variant="caption"
                                        >
                                            {e.object_id}
                                        </Typography>
                                        <Typography fontWeight={700}>{e.name}</Typography>
                                        <Typography variant="caption">
                                            <span dangerouslySetInnerHTML={{ __html: e.highlights?.join('\n') || '' }}/>
                                        </Typography>

                                        <Stack direction={'row'} flexWrap={'wrap'} gap={0.5} mt={'0.5em'}>
                                            {
                                                e.labels?.map(t => (
                                                    <Typography
                                                        key={t.name}
                                                        variant="caption"
                                                        sx={{
                                                            cursor: 'pointer',
                                                            borderRadius: '4px',
                                                            color: '#000',
                                                            border: '1px solid grey',
                                                            padding: '0 0.2rem',
                                                            width: 'min-content',
                                                            '&:hover': {
                                                                border: '1px solid lightgrey',
                                                            }
                                                        }}
                                                        fontWeight={700}
                                                        noWrap
                                                    >
                                                        {t.name}
                                                        { t.value ? <span>: {t.value}</span> : null}
                                                    </Typography>
                                                ))
                                            }
                                        </Stack>
                                    </Stack>
                                    <IconButton onClick={() => {
                                        setActiveSearchResult({
                                            id: e.object_id,
                                            texts: [{
                                                x1: e.x1,
                                                y1: e.y1,
                                                x2: e.x2,
                                                y2: e.y2,
                                                page_number: e.page_number,
                                                text: e.text
                                            }]
                                        })
                                    }}>
                                        <ArrowForwardIcon />
                                    </IconButton>
                                </Stack>
                            </Paper>
                        </div>
                    ))
                }
                {
                    searchData?.data?.length === 0 ? 'Nothing found' : null
                }
            </Stack>
            {
                activeSearchResult ?
                <PDF
                    objectId={activeSearchResult.id}
                    onClose={() => setActiveSearchResult(undefined)}
                    documentTexts={activeSearchResult.texts}
                />
                : null
            }
        </Stack>
    )
}