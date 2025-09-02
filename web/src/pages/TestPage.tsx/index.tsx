import { useRef, useCallback, useEffect, useState } from "react";

import { Box, Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material"

import {
    AreaHighlight,
    Highlight,
    Popup,
    Tip,
    PdfLoader,
    PdfHighlighter,
} from "react-pdf-highlighter";

import type {
    Content,
    IHighlight,
    NewHighlight,
    ScaledPosition,
} from "react-pdf-highlighter";

import "react-pdf-highlighter/dist/style.css"
import { CheckBox } from "@mui/icons-material";

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
};

const HighlightPopup = ({
    comment,
}: {
  comment: { text: string; emoji: string };
}) => {
    return (
        comment.text ? (
            <div className="Highlight__popup">
                {comment.emoji} {comment.text}
            </div>
        ) : null
    )
}

const CustomTip = ({ onOpen, onClose, content }: any) => {
    const [header, setHeader] = useState('');

    const [createClicked, setCreateClicked] = useState(false);

    useEffect(() => {
        onOpen();
    }, []);

    return (
        <>
            {
                createClicked ?
                <Paper sx={{ padding: '1rem' }}>
                    <Stack gap={2} alignItems={'center'}>
                        <TextField onChange={(e) => setHeader(e.target.value)} size="small" fullWidth/>
                        <Button
                            onClick={() => onClose({ header, text: content.text })}
                            variant='contained'
                            sx={{ bgcolor: '#000', fontWeight: 700, width: 'min-content' }}
                        >
                            Create
                        </Button>
                    </Stack>
                </Paper>
                :
                <Button
                    onClick={() => setCreateClicked(true)}
                    variant='contained'
                    sx={{ bgcolor: '#000', fontWeight: 700, width: 'min-content' }}
                >
                    Create
                </Button>
            }
        </>
    )
}


interface DataHighlight extends IHighlight {
    data: any;
}


// YWPI data object
interface HighlightData {
    header: string;
    text: string;
    position: {
        boundingRect: {
            x1: number;
            y1: number;
            x2: number;
            y2: number;
            width: number;
            height: number;
        }[];
        rects: {
            x1: number;
            y1: number;
            x2: number;
            y2: number;
            width: number;
            height: number;
        }[];
    };
    pageNumber: number;
}

interface PDFViewProps {
    url: string;
    objectId: string;
    highlights: HighlightData[];
    setHighlights: (highlights: (data: HighlightData[]) => HighlightData[] | HighlightData[]) => void;
};


const PDFView = ({ highlights, setHighlights, url }: PDFViewProps) => {
    const addHighlight = (highlight: HighlightData) => {
        console.log("Saving highlight", highlight);
        setHighlights((prevHighlights) => [{ ...highlight, id: getNextId() }, ...prevHighlights]);
    };

    return (
        <Box
            height={"80vh"}
            width={"70vw"}
            position={'relative'}
        >
            <PdfLoader
                url={url}
                beforeLoad={<Typography variant="h3">Loading</Typography>}
            >
                {
                    (pdfDocument) => (
                        <PdfHighlighter
                            pdfDocument={pdfDocument}
                            enableAreaSelection={(event) => event.altKey}
                            onScrollChange={resetHash}
                            scrollRef={() => {}}
                            onSelectionFinished={(
                                position,
                                content,
                                hideTipAndSelection,
                                transformSelection,
                            ) => (
                                <CustomTip
                                    onOpen={transformSelection}
                                    content={content}
                                    onClose={(data: any) => {
                                        if (data) {
                                            addHighlight({ content, position, ...data });
                                        }
                                        hideTipAndSelection();
                                    }}
                                />
                            )}
                            highlightTransform={(
                                highlight,
                                index,
                                setTip,
                                hideTip,
                                viewportToScaled,
                                screenshot,
                                isScrolledTo,
                            ) => {
                                const isTextHighlight = !highlight.content?.image;

                                const component = isTextHighlight ? (
                                    <Highlight
                                        isScrolledTo={isScrolledTo}
                                        position={highlight.position}
                                        comment={highlight.comment}
                                    />
                                    ) : (
                                    <AreaHighlight
                                        isScrolledTo={isScrolledTo}
                                        highlight={highlight}
                                        onChange={(boundingRect) => {
                                        }}
                                    />
                                );

                                return (
                                    <Popup
                                        // popupContent={<HighlightPopup {...highlight} />}
                                        popupContent={<div></div>}
                                        onMouseOver={(popupContent) =>
                                            setTip(highlight, (highlight) => popupContent)
                                        }
                                        onMouseOut={hideTip}
                                        key={index}
                                    >
                                        {component}
                                    </Popup>
                                );
                        }}
                        highlights={highlights}
                    />
                    )
                }
            </PdfLoader>
        </Box>
    )
}

interface CategoryProps {
    id: string;
    name: string;
    before?: React.ReactNode;
    after?: React.ReactNode;
    childNodes?: {
        id: string;
        name: string;
        children: any[];
    }[];
}

const Category = ({ before, after, name, childNodes } : CategoryProps) => {
    return (
        <Stack>
            <Stack direction={'row'} gap={1} alignItems={'center'}>
                {before}
                <Typography>{name}</Typography>Ум
                {after}
            </Stack>
            <Stack>
                {
                    childNodes?.map(e => (
                        <Category id={e.id} name={e.name}/>
                    ))
                }
            </Stack>
        </Stack>
    )
}

const categories = [
    {
        id: '1',
        name: 'First',
        children: [
            {
                id: '2',
                name: 'First-child',        
            }
        ]
    },
    {
        id: '3',
        name: 'Second',
    }
]

export const TestPage = () => {
    const [highlights, setHighlights] = useState<HighlightData[]>([]);

    return (
        <div>
            {
                categories.map(e => (
                    <Category
                        id={e.id}
                        name={e.name}
                        before={
                            <CheckBox />
                        }
                        after={
                            <Chip label={'after label'}/>
                        }
                        childNodes={e.children}
                    />
                        
                ))
            }
        </div>
    )

    // return (
    //     <Stack direction={'row'}>
    //         <Box>
    //             <PDFView
    //                 objectId=""
    //                 url={'https://arxiv.org/pdf/2502.13422'}
    //                 highlights={highlights}
    //                 setHighlights={setHighlights}
    //             />
    //         </Box>
    //         <Stack flexGrow={1} maxHeight={'80vh'} overflow={'scroll'} gap={1}>
    //             {
    //                 highlights.map(e => (
    //                     <Paper sx={{ bgcolor: 'lightgray' }}>
    //                         <Stack padding={'1rem'}>
    //                             <Typography fontWeight={700}>{e.header}</Typography>
    //                             <Typography>{e.text}</Typography>
    //                         </Stack>
    //                     </Paper>
    //                 ))
    //             }
    //         </Stack>
    //     </Stack>
    // )
}

// export const TestPageV0 = () => {
//     const [highlights, setHighlights] = useState<Array<DataHighlight>>([]);    
    
//     const addHighlight = (highlight: DataHighlight) => {
//         console.log("Saving highlight", highlight);
//         setHighlights((prevHighlights) => [
//           { ...highlight, id: getNextId() },
//               ...prevHighlights,
//         ]);
//     };
    
//     const updateHighlight = (
//         highlightId: string,
//         position: Partial<ScaledPosition>,
//         content: Partial<Content>,
//     ) => {
//         console.log("Updating highlight", highlightId, position, content);
//         setHighlights((prevHighlights) =>
//             prevHighlights.map((h) => {
//                 const { id, position: originalPosition, content: originalContent, ...rest } = h;
//                 return id === highlightId
//                 ? { id, position: { ...originalPosition, ...position }, content: { ...originalContent, ...content }, ...rest, }
//                 : h;
//             }),
//         );
//     };

//     return (
//         <Box>
//             <Typography variant="h2">Page</Typography>
//             <Box
//                 height={"80vh"}
//                 width={"50vw"}
//                 position={'relative'}
//             >
//                 <PdfLoader
//                     url={'https://arxiv.org/pdf/2502.13016'}
//                     beforeLoad={<Typography variant="h3">Loading</Typography>}
//                 >
//                     {
//                         (pdfDocument) => (
//                             <PdfHighlighter
//                                 pdfDocument={pdfDocument}
//                                 enableAreaSelection={(event) => event.altKey}
//                                 onScrollChange={resetHash}
//                                 scrollRef={() => {}}
//                                 onSelectionFinished={(
//                                     position,
//                                     content,
//                                     hideTipAndSelection,
//                                     transformSelection,
//                                 ) => (
//                                     <CustomTip
//                                         onOpen={transformSelection}
//                                         onClose={(event: any) => {
//                                             // @ts-ignore
//                                             addHighlight({ content, position, data: {}});
//                                             hideTipAndSelection();
//                                         }}
//                                     />
//                                 )}
//                                 highlightTransform={(
//                                     highlight,
//                                     index,
//                                     setTip,
//                                     hideTip,
//                                     viewportToScaled,
//                                     screenshot,
//                                     isScrolledTo,
//                                 ) => {
//                                     const isTextHighlight = !highlight.content?.image;

//                                     const component = isTextHighlight ? (
//                                         <Highlight
//                                             isScrolledTo={isScrolledTo}
//                                             position={highlight.position}
//                                             comment={highlight.comment}
//                                         />
//                                         ) : (
//                                         <AreaHighlight
//                                             isScrolledTo={isScrolledTo}
//                                             highlight={highlight}
//                                             onChange={(boundingRect) => {
//                                             updateHighlight(
//                                                 highlight.id,
//                                                 { boundingRect: viewportToScaled(boundingRect) },
//                                                 { image: screenshot(boundingRect) },
//                                             );
//                                             }}
//                                         />
//                                     );

//                                     return (
//                                         <Popup
//                                             // popupContent={<HighlightPopup {...highlight} />}
//                                             popupContent={<div></div>}
//                                             onMouseOver={(popupContent) =>
//                                                 setTip(highlight, (highlight) => popupContent)
//                                             }
//                                             onMouseOut={hideTip}
//                                             key={index}
//                                         >
//                                             {component}
//                                         </Popup>
//                                     );
//                             }}
//                             highlights={highlights}
//                         />
//                         )
//                     }
//                 </PdfLoader>
//             </Box>
//         </Box>
//     )
// }
