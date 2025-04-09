import { Box, Button, Chip, Divider, FormControl, FormControlLabel, FormLabel, Modal, Paper, Radio, RadioGroup, Stack, Tab, Tabs, TextareaAutosize, TextField, Typography } from "@mui/material"

// Core viewer
import { Position, Tooltip, Viewer, Worker } from '@react-pdf-viewer/core';

// Plugins
import { HighlightArea, highlightPlugin, MessageIcon, RenderHighlightContentProps, RenderHighlightsProps, RenderHighlightTargetProps, Trigger } from '@react-pdf-viewer/highlight';


// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import { useEffect, useState } from "react";
// import '@react-pdf-viewer/default-layout/lib/styles/index.css';

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


interface DocumentText {
    page_number: number;
    text: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}


export interface PDFHighlightViewerProps {
    url: string;
    texts?: DocumentText[];
}


// export interface PDFHighlightViewerPropsV2 {
//     objectId: string;
//     contents?: {
//         text: DocumentText,
//         type: string
//     }[];
// }


export default ({ url, texts }: PDFHighlightViewerProps) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [pageSize, setPageSize] = useState<{ width: number; height: number }>();

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
                                                opacity: 0.4,
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
        renderHighlights,
    });

    useEffect(() => {
        if (texts && pageSize) {
            const newNotes = texts.map((e, idx) => {
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
                    color: '#a9eba9',
                }
            });

            highlightPluginInstance.jumpToHighlightArea(newNotes[0]?.places[0]?.highlightAreas[0]);

            setNotes(newNotes);
        }
    }, [texts, pageSize]);



    return (
        <Box height={'90vh'}>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer
                    fileUrl={url}
                    plugins={[
                        highlightPluginInstance
                    ]}
                    // initialPage={notes[0]?.places[0]?.highlightAreas[0]?.pageIndex}
                    onDocumentLoad={(e) => {
                        e.doc.getPage(1).then(data => {
                            setPageSize({ width: data.view[2], height: data.view[3] });
                            console.log('Page view', data.view);
                        })
                    }}
                />
            </Worker>
        </Box>
    )
}
