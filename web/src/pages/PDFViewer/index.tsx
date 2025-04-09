import { Box, Button, Chip, Divider, FormControl, FormControlLabel, FormLabel, Modal, Paper, Radio, RadioGroup, Stack, Tab, Tabs, TextareaAutosize, TextField, Typography } from "@mui/material"

// Core viewer
import { Position, Tooltip, Viewer, Worker } from '@react-pdf-viewer/core';

// Plugins
import { HighlightArea, highlightPlugin, MessageIcon, RenderHighlightContentProps, RenderHighlightsProps, RenderHighlightTargetProps, Trigger } from '@react-pdf-viewer/highlight';


// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import { useEffect, useState } from "react";
// import '@react-pdf-viewer/default-layout/lib/styles/index.css';

import './index.css'

import mock from "./mock";


interface Note {
    // The generated unique identifier
    id: number;

    // The list of highlight areas
    // highlightAreas: HighlightArea[];

    // The note content
    name: string;

    // The content context
    // contexts: string[];

    places: {
        highlightAreas: HighlightArea[]; // Term place
        context: string;
    }[];

    // contexts: {
    //     content: string;
    //     highlightAreas: HighlightArea[];
    // }[];

    // The note class (term, person, organization)    
    kind: string;

    // Note higlight color
    color: string;
}

interface NoteViewProps {
    note: Note;
    jump: (h: HighlightArea) => void;
    onDelete: () => void;
    onPlaceDelete: (placeIdx: number) => void;
}

const NoteView = ({ note, jump, onDelete, onPlaceDelete }: NoteViewProps) => {
    return (
        <Box border={'1px solid black'} padding={'0.5rem'}>
            <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
                <Typography> {note.id} <strong>{note.kind}</strong> <strong>{note.name}</strong></Typography>
                <strong style={{ cursor: 'pointer' }} onClick={onDelete}>X</strong>
            </Stack>
            <Divider />
            <Stack divider={<Divider />}>
                {
                    note.places.map((e, placeIdx) => (
                        <Stack key={placeIdx}>
                            <strong style={{ cursor: 'pointer' }} onClick={() => onPlaceDelete(placeIdx)}>X</strong>
                            <div
                                onClick={() => jump(e.highlightAreas[0])}
                                style={{ marginTop: '2px', cursor: 'pointer' }}
                                dangerouslySetInnerHTML={{ __html: e.context }}
                            />
                        </Stack>
                    ))
                }
            </Stack>
        </Box>
    )
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
  
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}
  
function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const kindToColor = (kind: string): string => {
    if (kind === 'term') return 'green';
    if (kind === 'person') return 'blue';
    if (kind === 'organization') return 'yellow';
    return 'black';
}

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
}

interface SearchReponse {
    data: SearchDocument[];
}

const PDFAnnotator = ({ url }: { url: string }) => {
    const [notes, setNotes] = useState<Note[]>(mock);
    let noteId = notes.length;

    const [pageSize, setPageSize] = useState<{ width: number; height: number }>();

    useEffect(() => {
        if (pageSize) {
            // fetch('http://localhost:9090')
            // .then(e => e.json())
            // .then((data: DocumentText[]) => {
            //     const newNotes = data.map((e, idx) => {
            //         return {
            //             id: idx,
            //             name: 'Test',
            //             places: [{
            //                 highlightAreas: [{
            //                     height: ((e.y2 - e.y1) / pageSize.height) * 100,
            //                     left: (e.x1 / pageSize.width) * 100,
            //                     pageIndex: e.page_number,
            //                     top: (e.y1 / pageSize.height) * 100,
            //                     width: ((e.x2 - e.x1) / pageSize.width) * 100,
            //                 }],
            //                 context: 'None',
            //             }],
            //             kind: 'term',
            //             color: 'green',
            //         }
            //     });
            //     setNotes(prev => [...prev, ...newNotes]);
            // })

            fetch('/api/run_task', {
                method: 'POST',
                body: JSON.stringify({
                    agent_id: '1234',
                    method: 'search',
                    inputs: {
                        'query': 'database'
                    }
                }),
                headers: { 'Content-Type': 'application/json' }
            })
            .then(e => e.json())
            .then((data: SearchReponse) => {
                console.log(data)
                const newNotes = data.data.map((e, idx) => {
                    return {
                        id: idx,
                        name: 'Test',
                        places: [{
                            highlightAreas: [{
                                height: ((e.y2 - e.y1) / pageSize.height) * 100,
                                left: (e.x1 / pageSize.width) * 100,
                                pageIndex: e.page_number,
                                top: (e.y1 / pageSize.height) * 100,
                                width: ((e.x2 - e.x1) / pageSize.width) * 100,
                            }],
                            context: 'None',
                        }],
                        kind: 'term',
                        color: 'green',
                    }
                });
                setNotes(newNotes);
            })
        }
    }, [pageSize]);

    const renderHighlightTarget = (props: RenderHighlightTargetProps) => (
        <div
            style={{
                background: '#eee',
                display: 'flex',
                position: 'absolute',
                left: `${props.selectionRegion.left}%`,
                top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
                transform: 'translate(0, 8px)',
                zIndex: 1000
            }}
        >
            <Tooltip
                position={Position.TopCenter}
                target={
                    <Button onClick={props.toggle}>
                        <MessageIcon />
                    </Button>
                }
                content={() => <div style={{ width: '100px' }}>Add a note</div>}
                offset={{ left: 0, top: -8 }}
            />
        </div>
    );

    const [tab, setTab] = useState(0);
    const [kind, setKind] = useState('term');

    const renderHighlightContent = (props: RenderHighlightContentProps) => {
        const addNote = () => {
            const note: Note = {
                // Increase the id manually
                id: ++noteId,
                name: props.selectedText,
                kind: kind,
                places: [{
                    highlightAreas: props.highlightAreas,
                    context: props.selectionData?.divTexts.map(e => e.textContent).join(' ') || ' '
                }],
                color: kindToColor(kind)
            };
            setNotes(notes.concat([note]));

            // Close the form
            props.cancel();
        };

        const handleChange = (event: React.SyntheticEvent, newValue: number) => {
            setTab(newValue);
        };

        return (
            <div
                style={{
                    background: '#fff',
                    border: '1px solid rgba(0, 0, 0, .3)',
                    borderRadius: '2px',
                    padding: '8px',
                    position: 'absolute',
                    left: `30%`,
                    // left: 0,
                    top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
                    zIndex: 1,
                }}
            >
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }} width={'500px'}>
                    <Typography fontSize={'12px'}>{props.selectedText}</Typography>
                    <Tabs value={tab} onChange={handleChange} aria-label="basic tabs example">
                        <Tab label="Object" {...a11yProps(0)} />
                        <Tab label="Mention" {...a11yProps(1)} />
                        <Tab label="Context" {...a11yProps(2)} />
                    </Tabs>
                    <CustomTabPanel value={tab} index={0}>
                        <RadioGroup
                            row
                            name="row-radio-buttons-group"
                            onChange={(e, value) => setKind(value)}
                        >
                            <FormControlLabel value="term" control={<Radio />} label="Term" />
                            <FormControlLabel value="person" control={<Radio />} label="Person" />
                            <FormControlLabel value="organization" control={<Radio />} label="Organization" />
                            <FormControlLabel value="plagiat" control={<Radio />} label="Plagiat" />
                            <FormControlLabel value="citation" control={<Radio />} label="Citation" />
                            <FormControlLabel value="undefined" control={<Radio />} label="Undefined" />
                        </RadioGroup>
                    </CustomTabPanel>
                    <CustomTabPanel value={tab} index={1}>
                        {
                            notes.map((note, idx) =>
                                <Box
                                    key={note.id}
                                    onClick={() => {
                                        setNotes(prev => {
                                            const newNodes = [...prev];
                                            newNodes[idx].places.push({
                                                highlightAreas: props.highlightAreas,
                                                context: props.selectionData?.divTexts.map(e => e.textContent).join(' ') || ' '
                                            })
                                            return newNodes;
                                        })
                                        props.cancel();
                                    }}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <Typography fontWeight={700}>{note.name}</Typography>
                                </Box>
                            )
                        }
                    </CustomTabPanel>
                    <CustomTabPanel value={tab} index={2}>
                        <Stack gap={1} divider={<Divider />} maxHeight={'300px'} overflow={'scroll'}>
                            {
                                notes.map((note, idx) =>
                                    <Stack key={note.id} gap={1}>
                                        {
                                            note.places.map((e, placeIdx) => (
                                                <Box
                                                    key={placeIdx}
                                                    onClick={() => {
                                                        setNotes(prev => {
                                                            const newNodes = [...prev];
                                                            const word = newNodes[idx].name;
                                                            newNodes[idx].places[placeIdx].context
                                                                = props.selectedText.replace(new RegExp(`(${word})`, 'gi'), '<em>$1</em>');
                                                            return newNodes;
                                                        })
                                                        props.cancel();
                                                    }}
                                                    sx={{ cursor: 'pointer' }}
                                                >
                                                    <Typography fontWeight={700}>{note.name}</Typography>
                                                    [{placeIdx}] "{e.context}"
                                                </Box>
                                            ))
                                        }
                                    </Stack>
                                )
                            }
                        </Stack>
                    </CustomTabPanel>
                </Box>
                <Button onClick={addNote}>Add</Button>
                <Button onClick={props.cancel}>Cancel</Button>
            </div>
        );
    };

    const renderHighlights = (props: RenderHighlightsProps) => (
        <div>
            {notes.map((note) => (
                <div key={note.id}>
                    {
                        note.places.map(e => (
                            e.highlightAreas
                            // Filter all highlights on the current page
                            .filter((area) => area.pageIndex === props.pageIndex)
                            .map((area, idx) => (
                                <div
                                    key={idx}
                                    style={Object.assign(
                                        {},
                                        {
                                            background: note.color,
                                            opacity: 0.5,
                                            // cursor: 'pointer',
                                            // zIndex: 9999
                                        },
                                        props.getCssProperties(area, props.rotation)
                                    )}
                                />
                            ))
                        ))
                    }
                </div>
            ))}
        </div>
    );

    const highlightPluginInstance = highlightPlugin({
        renderHighlightTarget,
        renderHighlightContent,
        renderHighlights,
    });

    const [openModal, setOpenModal] = useState(false);

    return (
        <Box width={'100%'}>
            <Typography textAlign={'center'} variant="h5">{url}</Typography>
            <Stack direction={'row'} height={'100%'}>
                <Box width={'80%'} height={'86vh'}>
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                        <Viewer
                            fileUrl={url}
                            plugins={[
                                highlightPluginInstance
                            ]}
                            // defaultScale={1}
                            onDocumentLoad={(e) => {
                                e.doc.getPage(1).then(data => {
                                    setPageSize({ width: data.view[2], height: data.view[3] });
                                    console.log('Page view', data.view);
                                })
                            }}
                        />
                    </Worker>
                </Box>
                <Stack width={'20%'} alignContent={'center'} maxHeight={'86vh'} overflow={'scroll'} gap={1}>
                    <Stack>
                        <Button onClick={() => setOpenModal(true)}>Export</Button>
                        <Modal open={openModal} onClose={() => setOpenModal(false)}>
                            <Stack alignItems={'center'} justifyContent={'center'}>
                                <Box bgcolor={'#fff'}>
                                    <textarea
                                        value={JSON.stringify(notes, null, 2)}
                                        style={{ boxSizing: 'border-box', width: '70vw', height: '90vh' }}
                                    >
                                    </textarea>
                                </Box>
                            </Stack>
                        </Modal>
                    </Stack>
                    {
                        notes.map((e, idx) => (
                            <NoteView
                                key={e.id}
                                note={e}
                                jump={highlightPluginInstance.jumpToHighlightArea}
                                onDelete={() => {
                                    const newNotes = [...notes];
                                    newNotes.splice(idx, 1);
                                    setNotes(newNotes);
                                }}
                                onPlaceDelete={(placeIdx) => {
                                    const newNotes = [...notes];
                                    newNotes[idx].places.splice(placeIdx, 1);
                                    setNotes(newNotes);
                                }}
                            />
                        ))
                    }
                </Stack>
            </Stack>
        </Box>
    )
}

export default () => {
    const [inputValue, setInputValue] = useState<string>();
    // const [url, setUrl] = useState<string>('https://arxiv.org/pdf/2503.16079');
    const [url, setUrl] = useState<string>('https://arxiv.org/pdf/2503.08994');
    
    return (
        <>
            <Stack height={'min-content'}>
                <TextField
                    size="small"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    // slotProps={{
                    //     input: {
                    //         startAdornment: (
                    //             <Stack direction={'row'} gap={0.5} bgcolor={'#e7e7e7'}>
                    //                 <Chip sx={{ borderRadius: '3px', backgroundColor: '#dbdbdb' }} size="small" label='type' />
                    //                 <Chip sx={{ borderRadius: '3px', backgroundColor: '#dbdbdb' }} size="small" label='is' />
                    //                 <Chip sx={{ borderRadius: '3px', backgroundColor: '#dbdbdb' }} size="small" label='pdf' />
                    //             </Stack>
                    //         )
                    //     }
                    // }}
                />
                <Button variant='outlined' onClick={() => setUrl(inputValue)}>Set url</Button>
            </Stack>
            {
                url ?
                // <PDFAnnotator url="https://arxiv.org/pdf/2503.16079" />
                <PDFAnnotator url={url} />
                : null
            }
        </>
    );
}